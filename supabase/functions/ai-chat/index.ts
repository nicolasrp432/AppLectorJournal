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
    const rawApiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('EXPO_PUBLIC_GEMINI_API_KEY');
    const apiKey = rawApiKey?.trim().replace(/^["']|["']$/g, "");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY o EXPO_PUBLIC_GEMINI_API_KEY no configurada en los secretos de Supabase." }), {
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
- Sé amigable, motivador y cálido, pero extremadamente directo, claro y conciso.
- Las respuestas deben ser MUY CORTAS y OBJETIVAS: un máximo absoluto de 1 a 3 oraciones muy breves y directas, o un par de viñetas cortas. Ve al grano inmediatamente sin rodeos ni introducciones largas.
- Usa emojis de manera moderada y elegante (🧠, ⚡, 📚, 👁️, 👑).
- Responde estrictamente en español.
- Nunca inventes código o devuelvas texto irrelevante.${exerciseContextPrompt}`;
 
     const formattedContents = messages
       .map((m: any) => ({
         role: m.role === 'user' ? 'user' : 'model',
         parts: [{ text: m.text }]
       }))
       .filter((m: any, idx: number) => !(idx === 0 && m.role === 'model'));

     const tryModel = async (model: string) => {
       const response = await fetch(
         `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
         {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             contents: formattedContents,
             systemInstruction: { parts: [{ text: systemInstruction }] },
             generationConfig: {
               temperature: 0.5,
               maxOutputTokens: 150,
             }
           })
         }
       );
       if (!response.ok) {
         throw new Error(`Model ${model} returned status ${response.status}`);
       }
       return response;
     };

     let response;
     let lastError;
     try {
       response = await tryModel('gemini-1.5-flash');
     } catch (firstErr: any) {
       lastError = firstErr;
       console.warn('ai-chat edge: gemini-1.5-flash failed, trying gemini-2.0-flash fallback:', firstErr);
       try {
         response = await tryModel('gemini-2.0-flash');
       } catch (secErr: any) {
         lastError = secErr;
         console.warn('ai-chat edge: gemini-2.0-flash failed, trying gemini-1.5-pro fallback:', secErr);
         try {
           response = await tryModel('gemini-1.5-pro');
         } catch (thirdErr: any) {
           lastError = thirdErr;
         }
       }
     }

     if (!response) {
       return new Response(JSON.stringify({ error: `Todos los modelos de Gemini fallaron. Último error: ${lastError?.message || 'Desconocido'}` }), {
         status: 500,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
     }

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
