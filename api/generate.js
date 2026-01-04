// ========================================
// API ROUTE: /api/generate
// Función Serverless para Vercel
// ========================================

export const config = {
    maxDuration: 60, // 60 segundos de timeout
};

// FILTRO ANTI-TEXTO INVIOLABLE
const FORBIDDEN_WORDS = [
    'text', 'texts', 'word', 'words', 'letter', 'letters',
    'subtitle', 'subtitles', 'caption', 'captions', 
    'title', 'titles', 'typography', 'writing', 'written',
    'Browns', 'brown', 'label', 'labels', 'sign', 'signs',
    'banner', 'headline', 'font', 'typeface'
];

export default async function handler(req, res) {
    // Solo aceptar POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { type, topic, style, script } = req.body;

    // Validación de entrada
    if (!type) {
        return res.status(400).json({ error: 'Tipo de generación requerido' });
    }

    try {
        // ========================================
        // GENERAR GUION
        // ========================================
        if (type === 'script') {
            if (!topic) {
                return res.status(400).json({ error: 'Tema requerido' });
            }

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1000,
                    messages: [{
                        role: 'user',
                        content: `Eres un experto en crear guiones para Reels de Instagram.

REGLA ESTRICTA: El guion debe tener un máximo de 60 segundos de lectura (aproximadamente 150 palabras).

Crea un guion de estilo "${style || 'Viral'}" sobre el tema: "${topic}".

El guion debe ser:
- Conciso y directo
- Perfecto para ser leído en 60 segundos o menos
- Enganchante desde el primer segundo
- Con un hook potente al inicio
- Con call-to-action al final

Responde SOLO con el guion en texto plano, sin introducción ni explicaciones adicionales.`
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('Error en API de Claude');
            }

            const data = await response.json();
            const generatedScript = data.content
                .map(item => item.type === 'text' ? item.text : '')
                .filter(Boolean)
                .join('\n');

            return res.status(200).json({ 
                script: generatedScript 
            });
        }

        // ========================================
        // GENERAR PROMPTS DE IMAGEN
        // ========================================
        if (type === 'image') {
            if (!script) {
                return res.status(400).json({ error: 'Guion requerido' });
            }

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1000,
                    messages: [{
                        role: 'user',
                        content: `Basándote en este guion para Reel:

"${script}"

Genera 3-4 prompts técnicos para crear imágenes con IA (Midjourney, DALL-E, etc.).

Cada prompt debe:
- Ser específico y detallado
- Incluir estilo visual (cinematográfico, minimalista, etc.)
- Mencionar iluminación, colores y composición
- Ser en inglés

Responde SOLO con los prompts numerados, sin introducción.`
                    }]
                })
            });

            const data = await response.json();
            const prompts = data.content
                .map(item => item.type === 'text' ? item.text : '')
                .filter(Boolean)
                .join('\n')
                .split('\n')
                .filter(line => line.trim().length > 0);

            return res.status(200).json({ prompts });
        }

        // ========================================
        // GENERAR PROMPTS DE VIDEO
        // (CON FILTRO ANTI-TEXTO INVIOLABLE)
        // ========================================
        if (type === 'video') {
            if (!script) {
                return res.status(400).json({ error: 'Guion requerido' });
            }

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1000,
                    messages: [{
                        role: 'user',
                        content: `Basándote en este guion para Reel:

"${script}"

Genera 3-4 prompts técnicos para crear videos con IA (Runway, Pika, etc.).

⚠️ REGLA CRÍTICA INVIOLABLE: Los prompts NO deben incluir NINGÚN texto, letras, subtítulos, palabras, títulos o caracteres escritos en la imagen. Los visuales deben ser 100% limpios y cinematográficos.

❌ PROHIBIDO ABSOLUTO mencionar: text, words, letters, subtitles, captions, titles, typography, writing, Browns, labels, signs, banners, headlines, fonts

Cada prompt debe:
- Describir SOLO la escena visual y movimiento de cámara
- Incluir detalles de iluminación, atmósfera y composición
- Especificar duración aproximada (5-10 segundos)
- Ser completamente visual, sin mencionar texto alguno
- Ser en inglés
- Enfocarse en elementos cinematográficos puros

Responde SOLO con los prompts numerados, sin introducción.`
                    }]
                })
            });

            const data = await response.json();
            let prompts = data.content
                .map(item => item.type === 'text' ? item.text : '')
                .filter(Boolean)
                .join('\n')
                .split('\n')
                .filter(line => line.trim().length > 0);

            // ========================================
            // FILTRO ANTI-TEXTO INVIOLABLE
            // El usuario NO puede saltarse esta regla
            // ========================================
            prompts = prompts.filter(prompt => {
                const lowerPrompt = prompt.toLowerCase();
                return !FORBIDDEN_WORDS.some(word => lowerPrompt.includes(word));
            });

            // Si todos los prompts fueron filtrados, devolver error
            if (prompts.length === 0) {
                return res.status(400).json({ 
                    error: 'Los prompts generados contenían texto prohibido. Intenta con otro guion.' 
                });
            }

            return res.status(200).json({ prompts });
        }

        // Tipo de generación no válido
        return res.status(400).json({ 
            error: 'Tipo de generación no válido. Usa: script, image o video' 
        });

    } catch (error) {
        console.error('Error en API:', error);
        return res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
}
