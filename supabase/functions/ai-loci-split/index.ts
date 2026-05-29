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
    const { topic, theme, rooms } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not set." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!topic || !rooms || !Array.isArray(rooms)) {
      return new Response(JSON.stringify({ error: "Missing topic or rooms array in payload." }), {
        status: 400,
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
              text: `Eres un experto mundial en mnemotecnia, memoria y el Método de los Loci (Palacio de la Memoria).
Deseo memorizar el siguiente tema libre: "${topic}".
Para ello, divide el tema exactamente en ${rooms.length} sub-conceptos ordenados y secuenciales.
Asocia cada uno de estos sub-conceptos con una habitación física de mi palacio mental (tema: "${theme}"). Las habitaciones ordenadas son: [${rooms.join(', ')}].

Para cada habitación y concepto, inventa un "story hook" (gancho mnemotécnico bizarro): una escena absurda, cómica, chocante, altamente visual y surrealista que ocurra allí y conecte de forma inquebrantable el concepto del tema con la habitación física.

Responde estrictamente con un JSON válido que contenga la propiedad "concepts" que sea una lista con el formato exacto requerido.

Formato esperado:
{
  "concepts": [
    {
      "room": "NombreHabitacion",
      "concept": "Concepto Breve",
      "story": "Historia cómica y bizarra que asocie el Concepto con la Habitacion"
    }
  ]
}`
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
                concepts: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      room: { type: "STRING" },
                      concept: { type: "STRING" },
                      story: { type: "STRING" }
                    },
                    required: ["room", "concept", "story"]
                  }
                }
              },
              required: ["concepts"]
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
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      throw new Error('Gemini failed to output valid parts.');
    }

    const parsed = JSON.parse(candidate.content.parts[0].text);
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
