import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY no configurada en Supabase." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Contexto específico del ejercicio si existe
    let exerciseContextPrompt = "";
    if (context?.exerciseId) {
      exerciseContextPrompt = `\n[CONTEXTO ACTIVO]: El usuario se encuentra configurando o realizando el ejercicio "${context.exerciseTitle}" (${context.exerciseCategory}). Su objetivo de mejora es: ${context.exerciseImproves}. Dificultad: ${context.exerciseDifficulty}. Dale consejos prácticos y específicos para este ejercicio si te lo solicita.`;
    }

    const systemInstruction = `Eres "Mente IA", el mentor neuronal y asistente experto de LectorApp, una plataforma premium de entrenamiento mental, lectura rápida, mnemotecnia y comprensión lectora.

Tus áreas de especialización absoluta son:
1. Lectura Rápida: RSVP, eliminación de subvocalización, fijaciones, y expansión periférica.
2. Memoria: Palacio de la memoria (Método Loci) y Word Span.
3. Asociación Inverosímil: creación de historias locas, coloridas, surrealistas y emocionales para el hipocampo.
4. Comprensión Lectora: procesamiento semántico, retención crítica, y lectura analítica.

Instrucciones de respuesta y personalidad:
- Sé amigable, motivador y cálido (como un mentor), pero mantén un tono profesional, instruido y estructurado.
- Respuestas CORTAS, DIRECTAS y OBJETIVAS (máximo 2 párrafos concisos o viñetas muy claras por mensaje). Evita bloques largos de texto.
- Usa emojis de manera moderada y elegante (🧠, ⚡, 📚, 👁️, 👑).
- Responde estrictamente en español.
- Nunca inventes código o devuelvas texto irrelevante.${exerciseContextPrompt}`;

    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: formattedContents,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 350,
          }
        })
      }
    );

    const result = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: result }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reply = result.candidates?.[0]?.content?.parts?.[0]?.text || "Tu sinapsis está cargando... Por favor, vuelve a intentarlo.";

    return new Response(JSON.stringify({ text: reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
