// ========================================
// REEL STUDIO PRO - APP.JS
// ========================================

// Estado Global
let currentTab = 'gen';
let userPlan = 'FREE';
let scriptsUsed = 0;
const FREE_LIMIT = 3;
let selectedStyle = 'Viral';
let selectedRhythm = 'Equilibrado';
let currentScript = '';
let isLoading = false;

// ========================================
// NAVEGACIÓN ENTRE PESTAÑAS
// ========================================
function showTab(tabName) {
    currentTab = tabName;
    
    // Ocultar todos los contenidos
    document.getElementById('content-gen').classList.add('hidden');
    document.getElementById('content-cortes').classList.add('hidden');
    document.getElementById('content-premium').classList.add('hidden');
    
    // Resetear pestañas
    document.getElementById('tab-gen').className = 'tab inactive';
    document.getElementById('tab-cortes').className = 'tab inactive';
    document.getElementById('tab-premium').className = 'tab inactive';
    
    // Activar pestaña correspondiente
    if (tabName === 'gen') {
        document.getElementById('content-gen').classList.remove('hidden');
        document.getElementById('tab-gen').className = 'tab active-generador';
    } else if (tabName === 'cortes') {
        document.getElementById('content-cortes').classList.remove('hidden');
        document.getElementById('tab-cortes').className = 'tab active-cortes';
    } else if (tabName === 'premium') {
        document.getElementById('content-premium').classList.remove('hidden');
        document.getElementById('tab-premium').className = 'tab active-premium';
    }
}

// ========================================
// SISTEMA DE LÍMITES PLAN FREE
// ========================================
function canGenerateScript() {
    if (userPlan === 'PRO') return true;
    return scriptsUsed < FREE_LIMIT;
}

function updateUsageCount() {
    if (userPlan === 'FREE') {
        scriptsUsed++;
        console.log(`Scripts usados: ${scriptsUsed}/${FREE_LIMIT}`);
        
        if (scriptsUsed >= FREE_LIMIT) {
            alert('Has alcanzado el límite de 3 guiones del plan FREE. Actualiza a PRO para acceso ilimitado.');
        }
    }
}

// ========================================
// GENERADOR DE GUIONES
// ========================================
async function generateScript() {
    const topic = document.getElementById('topic').value.trim();
    
    if (!topic) {
        alert('Por favor, ingresa un tema para tu Reel');
        return;
    }
    
    // Verificar límites FREE
    if (!canGenerateScript()) {
        showTab('premium');
        alert('Límite alcanzado. Actualiza a PRO para continuar.');
        return;
    }
    
    if (isLoading) return;
    
    isLoading = true;
    const genBtn = document.getElementById('gen-text');
    genBtn.textContent = 'Conectando...';
    
    try {
        // Llamada a API
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'script',
                topic: topic,
                style: selectedStyle
            })
        });
        
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        
        genBtn.textContent = 'Procesando...';
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        currentScript = data.script;
        
        // Mostrar resultado
        const resultDiv = document.getElementById('script-result');
        resultDiv.innerHTML = `
            <div style="background: rgba(31, 41, 55, 0.8); padding: 1rem; border-radius: 0.75rem; margin-top: 1rem;">
                <h3 style="color: #d8b4fe; margin-bottom: 1rem;">Tu Guion</h3>
                <p style="color: #e5e7eb; line-height: 1.6; white-space: pre-wrap;">${currentScript}</p>
                <div style="margin-top: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <button onclick="generateImagePrompts()" style="background: #2563eb; color: white; padding: 0.75rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
                        Prompts Imagen
                    </button>
                    <button onclick="generateVideoPrompts()" style="background: #16a34a; color: white; padding: 0.75rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">
                        Prompts Video
                    </button>
                </div>
            </div>
        `;
        resultDiv.classList.remove('hidden');
        
        // Actualizar contador de uso
        updateUsageCount();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al generar el guion: ' + error.message);
    } finally {
        isLoading = false;
        genBtn.textContent = canGenerateScript() ? 'Generar Guion' : 'Límite Alcanzado';
    }
}

// ========================================
// GENERADOR DE PROMPTS PARA IMAGEN
// ========================================
async function generateImagePrompts() {
    if (!currentScript || isLoading) return;
    
    isLoading = true;
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'image',
                script: currentScript
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        alert('Prompts de imagen generados:\n\n' + data.prompts.join('\n\n'));
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al generar prompts de imagen');
    } finally {
        isLoading = false;
    }
}

// ========================================
// GENERADOR DE PROMPTS PARA VIDEO
// (CON FILTRO ANTI-TEXTO INVIOLABLE)
// ========================================
async function generateVideoPrompts() {
    if (!currentScript || isLoading) return;
    
    isLoading = true;
    const videoBtn = document.querySelector('button[onclick="generateVideoPrompts()"]');
    const originalText = videoBtn.textContent;
    
    videoBtn.textContent = 'Conectando...';
    
    try {
        videoBtn.textContent = 'Renderizando...';
        
        // Llamada a API con filtro anti-texto
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'video',
                script: currentScript
            })
        });
        
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        videoBtn.textContent = 'Video Listo ✓';
        
        // Mostrar prompts
        alert('Prompts de video generados (SIN TEXTO):\n\n' + data.prompts.join('\n\n'));
        
        setTimeout(() => {
            videoBtn.textContent = originalText;
        }, 2000);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al generar prompts de video: ' + error.message);
        videoBtn.textContent = originalText;
    } finally {
        isLoading = false;
    }
}

// ========================================
// GENERADOR DE TIMESTAMPS PARA CAPCUT
// ========================================
function generateTimestamps(duration) {
    if (!duration || duration <= 0) {
        alert('Por favor ingresa una duración válida');
        return;
    }
    
    let cutInterval;
    
    // Definir intervalos según ritmo
    switch (selectedRhythm) {
        case 'Dinámico':
            cutInterval = 1.5;
            break;
        case 'Equilibrado':
            cutInterval = 3;
            break;
        case 'Narrativo':
            cutInterval = 5;
            break;
        case 'Ultra Rápido':
            if (userPlan !== 'PRO') {
                alert('Ultra Rápido es exclusivo de PRO');
                return;
            }
            cutInterval = 0.8;
            break;
        case 'Slow Motion':
            if (userPlan !== 'PRO') {
                alert('Slow Motion es exclusivo de PRO');
                return;
            }
            cutInterval = 7;
            break;
        default:
            cutInterval = 3;
    }
    
    const numberOfCuts = Math.floor(duration / cutInterval);
    const timestamps = [];
    
    // Generar timestamps en formato MM:SS.CC (centésimas)
    for (let i = 1; i <= numberOfCuts; i++) {
        const timeInSeconds = i * cutInterval;
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const centiseconds = Math.floor((timeInSeconds % 1) * 100);
        
        const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
        timestamps.push(formatted);
    }
    
    return timestamps;
}

// ========================================
// SISTEMA DE UPGRADE A PRO
// ========================================
function upgradeToPro() {
    userPlan = 'PRO';
    alert('¡Bienvenido a PRO! 🎉\n\nAcceso ilimitado activado.\n\n(Demo - En producción esto procesaría el pago con Stripe)');
    showTab('gen');
}

// ========================================
// COPIAR AL PORTAPAPELES
// ========================================
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Mostrar notificación
        const notification = document.createElement('div');
        notification.textContent = '✓ Copiado';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(to right, #10b981, #059669);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            z-index: 9999;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    });
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Reel Studio Pro inicializado');
    showTab('gen');
});
