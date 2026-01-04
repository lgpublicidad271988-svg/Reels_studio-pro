import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método no permitido');
    
      const { topic } = req.body;
        if (!topic) return res.status(400).json({ error: 'Tema requerido' });

          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            
              // Tu regla de oro:
                const prompt = `Genera un guion de Reel sobre: ${topic}. 
                  REGLA ESTRICTA: No incluyas la palabra 'Browns', ni subtítulos, ni ninguna letra en el video. Solo descripción visual.`;

                    try {
                        const result = await model.generateContent(prompt);
                            const response = await result.response;
                                res.status(200).json({ text: response.text() });
                                  } catch (error) {
                                      res.status(500).json({ error: "Error con Google AI Studio" });
                                        }
                                        }