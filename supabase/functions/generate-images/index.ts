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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
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
      const fullPrompt = `Create a social media visual for: ${prompts[i]}.${styleHint} High quality, professional, suitable for Instagram carousel.`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [{ role: "user", content: fullPrompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          const status = aiResponse.status;
          const text = await aiResponse.text();
          console.error(`AI error for prompt ${i}:`, status, text);

          if (status === 429) {
            urls.push(null);
            continue;
          }
          if (status === 402) {
            return new Response(JSON.stringify({ error: "PAYMENT_REQUIRED" }), {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          urls.push(null);
          continue;
        }

        const data = await aiResponse.json();
        const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData) {
          console.error(`No image in response for prompt ${i}`);
          urls.push(null);
          continue;
        }

        // Extract base64 data
        const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
          console.error(`Invalid base64 format for prompt ${i}`);
          urls.push(null);
          continue;
        }

        const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
        const base64 = base64Match[2];
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

        const filePath = `${timestamp}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("generated-images")
          .upload(filePath, bytes, { contentType: `image/${base64Match[1]}`, upsert: true });

        if (uploadError) {
          console.error(`Upload error for prompt ${i}:`, uploadError);
          urls.push(null);
          continue;
        }

        const { data: publicUrl } = supabase.storage
          .from("generated-images")
          .getPublicUrl(filePath);

        urls.push(publicUrl.publicUrl);
      } catch (err) {
        console.error(`Error processing prompt ${i}:`, err);
        urls.push(null);
      }
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
