// ESTE ARCHIVO VA EN LA CARPETA "api"
// Nombre del archivo: api/generar.js

export const config = {
    runtime: 'edge', // Usamos Edge para que sea más rápido
};

export default async function handler(req) {
    // 1. Seguridad: Solo permitir peticiones POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Método no permitido' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // 2. Obtener datos del frontend
        const { contenido, tipo } = await req.json();

        // 3. Obtener la clave de Vercel (Aquí es donde busca la Key "GEMINI_API")
        const apiKey = process.env.GEMINI_API;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Falta la API Key en Vercel' }), { status: 500 });
        }

        // 4. Preparar el Prompt (Instrucciones para la IA)
        let prompt = "";
        if (tipo === 'resumen') {
            prompt = `Actúa como un profesor experto. Haz un resumen estructurado, claro y conciso del siguiente texto para un estudiante de Grado Superior. Usa negritas para conceptos clave:\n\n${contenido}`;
        } else if (tipo === 'test') {
            prompt = `Genera 3 preguntas de examen tipo test (con opciones A, B, C) sobre el siguiente texto. Al final de las 3 preguntas, añade una sección llamada 'SOLUCIONES' indicando la correcta. Formato HTML limpio:\n\n${contenido}`;
        } else if (tipo === 'mapa') {
            prompt = `Genera ÚNICAMENTE el código para un diagrama de flujo usando sintaxis Mermaid.js sobre el siguiente texto. Debe ser un gráfico de arriba a abajo (graph TD). No incluyas explicaciones, solo el código dentro de bloques mermaid:\n\n${contenido}`;
        } else {
            prompt = `Explica este contenido de forma sencilla:\n\n${contenido}`;
        }

        // 5. Llamar a Google Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        // Verificar si Google dio error
        if (!response.ok) {
            console.error("Error de Google:", data);
            return new Response(JSON.stringify({ error: data.error?.message || 'Error en la IA' }), { status: 500 });
        }

        // Extraer el texto de la respuesta
        let textoGenerado = data.candidates[0].content.parts[0].text;

        // 6. Devolver respuesta al Frontend
        return new Response(JSON.stringify({ resultado: textoGenerado }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}