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
    const { text } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not set." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Analiza sintáctica y léxicamente el siguiente texto en español.
Determina su dificultad (valores posibles únicamente: "facil", "medio", "dificil"), proporciona una explicación corta del porqué, y sugiere una velocidad RSVP inicial óptima en WPM (palabras por minuto) de acuerdo a la complejidad detectada (por ejemplo, entre 250 y 500 WPM).
Responde con un JSON válido.

Texto: ` + JSON.stringify(text);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          systemInstruction: {
            parts: [{ text: "Eres un asistente experto en lingüística que responde única y exclusivamente con un JSON válido. No uses bloques de markdown con ```json." }]
          },
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                difficulty: { type: "STRING" },
                explanation: { type: "STRING" },
                suggestedWpm: { type: "INTEGER" }
              },
              required: ["difficulty", "explanation", "suggestedWpm"]
            }
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

    const candidate = result.candidates?.[0];
    if (!candidate || candidate.finishReason === 'SAFETY' || !candidate.content?.parts?.[0]?.text) {
      return new Response(JSON.stringify({
        difficulty: 'medio',
        explanation: 'No se pudo analizar el texto. Usando valores predeterminados.',
        suggestedWpm: 280,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const textResponse = candidate.content.parts[0].text;
    let parsed;
    try {
      parsed = JSON.parse(textResponse);
    } catch {
      parsed = {
        difficulty: 'medio',
        explanation: 'Error de análisis de formato.',
        suggestedWpm: 280,
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
