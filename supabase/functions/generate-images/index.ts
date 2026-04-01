import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompts, visual_style } = await req.json();

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return new Response(JSON.stringify({ error: "prompts array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      return new Response(JSON.stringify({ error: "GOOGLE_AI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const timestamp = Date.now();
    const urls: (string | null)[] = [];

    for (let i = 0; i < prompts.length; i++) {
      if (i > 0) await delay(2500);

      const styleHint = visual_style ? ` Style: ${visual_style}.` : "";
      const fullPrompt = `Generate an image: ${prompts[i]}.${styleHint} High quality, professional, suitable for Instagram carousel. Do not include any text in the image.`;

      // Try up to 2 times since gemini-2.0-flash-exp sometimes doesn't return an image
      let imageUrl: string | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await delay(1500);

        try {
          const aiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: {
                  responseModalities: ["TEXT", "IMAGE"],
                },
              }),
            }
          );

          if (!aiResponse.ok) {
            const status = aiResponse.status;
            const text = await aiResponse.text();
            console.error(`Google AI error for prompt ${i} (attempt ${attempt}):`, status, text);
            if (status === 429) break; // don't retry on rate limit
            continue;
          }

          const data = await aiResponse.json();
          const parts = data.candidates?.[0]?.content?.parts || [];
          const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));

          if (!imagePart) {
            console.warn(`No image in response for prompt ${i} (attempt ${attempt}), retrying...`);
            continue;
          }

          const base64 = imagePart.inlineData.data;
          const mimeType = imagePart.inlineData.mimeType;
          const ext = mimeType === "image/jpeg" ? "jpg" : "png";
          const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

          const filePath = `${timestamp}_${i}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("generated-images")
            .upload(filePath, bytes, { contentType: mimeType, upsert: true });

          if (uploadError) {
            console.error(`Upload error for prompt ${i}:`, uploadError);
            break;
          }

          const { data: publicUrl } = supabase.storage
            .from("generated-images")
            .getPublicUrl(filePath);

          imageUrl = publicUrl.publicUrl;
          break; // success, no need to retry
        } catch (err) {
          console.error(`Error processing prompt ${i} (attempt ${attempt}):`, err);
        }
      }

      urls.push(imageUrl);
    }

    return new Response(JSON.stringify({ urls }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-images error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
