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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analiza el siguiente texto en español y extrae entre 5 y 10 conceptos o preguntas clave en forma de parejas de tarjetas educativas (Flashcards) para memorizar.
Cada tarjeta debe tener un "front" (pregunta o término corto), un "back" (respuesta explicativa corta) y un "hint" (pista o analogía mnemónica visual y extravagante para recordar).
Responde con un JSON válido.

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
                flashcards: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      front: { type: "STRING" },
                      back: { type: "STRING" },
                      hint: { type: "STRING" }
                    },
                    required: ["front", "back", "hint"]
                  }
                }
              },
              required: ["flashcards"]
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
