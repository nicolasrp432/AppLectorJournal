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
    const { room, items, hook } = await req.json();
    const apiKey = (Deno.env.get('GEMINI_API_KEY') || Deno.env.get('EXPO_PUBLIC_GEMINI_API_KEY'))?.trim().replace(/^["']|["']$/g, "");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not set." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let description = "";
    let itemWord = "";

    // Determine description
    if (hook && typeof hook === 'string') {
      description = hook;
      if (items && Array.isArray(items) && items.length > 0) {
        itemWord = items[0];
      }
    } else if (items && Array.isArray(items) && items.length > 0) {
      itemWord = items[0];
      const itemsStr = items.join(', ');
      
      // Generate description using gemini-2.5-flash
      try {
        const textResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Usa el Método de los Loci (Palacio de la Memoria). Para la habitación "${room}", asocia de forma mental y visual cada uno de los siguientes objetos: [${itemsStr}].
Para cada objeto, inventa una escena mental absurdamente cómica, bizarra, interactiva, sensorial y memorable que ocurra en esa habitación específica para anclar el objeto.
Responde con un JSON válido.`
                }]
              }],
              systemInstruction: {
                parts: [{ text: "Eres un asistente experto en mnemotecnia que responde única y exclusivamente con un JSON válido. No uses bloques de markdown con ```json." }]
              },
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    descriptions: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          item: { type: "STRING" },
                          description: { type: "STRING" }
                        },
                        required: ["item", "description"]
                      }
                    }
                  },
                  required: ["descriptions"]
                }
              }
            })
          }
        );

        const result = await textResponse.json();
        if (textResponse.ok) {
          const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsed = JSON.parse(candidateText);
            if (parsed.descriptions && parsed.descriptions.length > 0) {
              description = parsed.descriptions[0].description;
            }
          }
        }
      } catch (err) {
        console.warn("Failed to generate Loci text via Gemini:", err);
      }

      // Fallback description if generation failed
      if (!description) {
        description = `Un(a) ${itemWord.toUpperCase()} gigante levita y flota de manera misteriosa por toda la ${room.toLowerCase()}.`;
      }
    } else {
      return new Response(JSON.stringify({ error: "Missing both hook and items in request payload." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imagePrompt = `A vibrant, detailed digital art illustration depicting a whimsical and surreal scene in a ${room.toLowerCase()}: ${description}. High quality, colorful, playful 3D render feel, clean design, no text.`;
    let imageBase64 = null;
    let imageMime = "image/png";

    // 1) "Nano Banana" = Gemini 2.5 Flash Image: generación nativa de imágenes,
    //    mejor calidad. Devuelve la imagen como inlineData base64.
    try {
      const nb = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: imagePrompt }] }],
            generationConfig: { responseModalities: ["IMAGE"] },
          }),
        }
      );
      if (nb.ok) {
        const nbData = await nb.json();
        const parts = nbData.candidates?.[0]?.content?.parts || [];
        const imgPart = parts.find((p: any) => p.inlineData?.data || p.inline_data?.data);
        const inline = imgPart?.inlineData || imgPart?.inline_data;
        if (inline?.data) {
          imageBase64 = inline.data;
          imageMime = inline.mimeType || inline.mime_type || "image/png";
        }
      } else {
        console.warn(`Nano Banana returned ${nb.status}:`, (await nb.text()).slice(0, 300));
      }
    } catch (e) {
      console.warn("Nano Banana (gemini-2.5-flash-image) failed:", e);
    }

    // 2) Respaldo: Imagen 3 (por si el modelo de imagen no está disponible).
    if (!imageBase64) {
      try {
        const imageResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instances: [{ prompt: imagePrompt }],
              parameters: { sampleCount: 1, aspectRatio: "1:1", outputMimeType: "image/png" },
            }),
          }
        );
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageBase64 = imageData.predictions?.[0]?.bytesBase64Encoded || null;
        } else {
          console.warn(`Imagen 3 returned ${imageResponse.status}:`, (await imageResponse.text()).slice(0, 300));
        }
      } catch (imageErr) {
        console.warn("Imagen 3 fallback failed:", imageErr);
      }
    }

    // Prepare a response structure compatible with both old and new clients
    const responsePayload = {
      description,
      imageBase64,
      mimeType: imageMime,
      descriptions: [
        {
          item: itemWord,
          description: description
        }
      ]
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
