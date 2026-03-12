import { GoogleGenAI } from '@google/genai';
import { VITE_GEMINI_API_KEY } from './env';
import type { ClothingItem, WeatherData } from '../types';

const API_KEY = VITE_GEMINI_API_KEY;

export async function* streamOutfitRecommendation(
    wardrobe: ClothingItem[],
    weather: WeatherData,
    event?: string
) {
    if (!API_KEY) {
        throw new Error('Gemini API Key no configurada. Añade VITE_GEMINI_API_KEY a tu .env.local');
    }

    const wardrobeContext = wardrobe
        .map(item => `- ${item.name} (${item.category}, color ${item.color})`)
        .join('\n');

    const prompt = `
Eres "¿Qué me pongo?", un estilista personal premium experto en moda.
Tu objetivo es sugerir el outfit perfecto basándote ÚNICAMENTE en las prendas del armario del usuario.

CONTEXTO:
- Ciudad/Ubicación: ${weather.city}
- Clima actual: ${weather.condition}, ${weather.temp}°C
${event ? `- Ocasión/Evento: ${event}` : ''}

ARMARIO DISPONIBLE:
${wardrobeContext}

INSTRUCCIONES:
1. Analiza el clima y la ocasión.
2. Selecciona UNA combinación lógica de prendas del armario (Abrigo, Top, Bottom, Calzado).
3. Explica brevemente por qué elegiste estas prendas basándote en la temperatura y el estilo.
4. Responde en ESPAÑOL con un tono elegante, moderno y motivador.
5. Usa negritas para resaltar los nombres de las prendas sugeridas.

Formato de respuesta:
"¡Hola! Basado en el clima de hoy (${weather.temp}°C), te sugiero este look:
[Lista de prendas]
[Explicación de 2-3 frases]"
`.trim();

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const result = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash',
        contents: [{ parts: [{ text: prompt }] }]
    });

    for await (const chunk of result) {
        if (chunk.text) yield chunk.text;
    }
}
