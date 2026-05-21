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
    const { text, count = 3 } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not set." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Eres un experto en comprensión lectora. Dado el siguiente texto en español, genera exactamente ${count} preguntas de comprensión.
Cada pregunta debe tener 4 opciones (A, B, C, D) y una única respuesta correcta (índice 0-3).
Responde estrictamente con un JSON válido en el formato requerido.

Texto: "${text}"`
            }]
          }],
          systemInstruction: {
            parts: [{ text: "Eres un asistente experto que responde única y exclusivamente con un JSON válido. No uses bloques de markdown con ```json." }]
          },
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                questions: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      q: { type: "STRING" },
                      opts: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                      },
                      correct: { type: "INTEGER" }
                    },
                    required: ["q", "opts", "correct"]
                  }
                }
              },
              required: ["questions"]
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

    const textResponse = result.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(textResponse);

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
