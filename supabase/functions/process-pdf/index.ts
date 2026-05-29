import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import pdf from "npm:pdf-parse";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "Missing PDF file in payload under 'file' form data key." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF using npm:pdf-parse
    const data = await pdf(buffer);

    const text = data.text || "";
    
    // Limit text length to 120,000 characters to avoid memory crash (around 24,000 words)
    const truncatedText = text.length > 120000 ? text.substring(0, 120000) + "..." : text;

    return new Response(JSON.stringify({
      text: truncatedText,
      pages: data.numpages || 1,
      info: data.info || {},
      words: truncatedText.split(/\s+/).filter(Boolean).length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
