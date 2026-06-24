import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guard, corsHeaders as buildCors } from "../_shared/guard.ts";

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = buildCors(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const auth = await guard(req, { fn: 'ai-chat', limit: 40, windowSec: 3600 });
  if (auth instanceof Response) return auth;

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
- Respuestas claras, completas y concisas: entre 2 y 6 oraciones, o un par de viñetas. Ve al grano sin introducciones largas, pero NUNCA dejes una idea o frase a medias: termina siempre tu respuesta.
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
               maxOutputTokens: 800,
             }
           })
         }
       );
       if (!response.ok) {
         // Surface the real Gemini error body so the 500 is diagnosable
         // (clave inválida / API no habilitada / modelo no disponible).
         const detail = await response.text().catch(() => '');
         throw new Error(`Model ${model} returned status ${response.status}: ${detail.slice(0, 300)}`);
       }
       return response;
     };

     // Modelos vigentes (los gemini-1.5 están retirados). Se prueba en orden
     // y se cae al siguiente si falla.
     const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro'];
     let response;
     let lastError;
     for (const model of MODELS) {
       try {
         response = await tryModel(model);
         break;
       } catch (err: any) {
         lastError = err;
         console.warn(`ai-chat edge: ${model} failed, trying next fallback:`, err?.message || err);
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
