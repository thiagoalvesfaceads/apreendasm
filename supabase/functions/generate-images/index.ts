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

async function generateSingleImage(
  prompt: string,
  index: number,
  visual_style: string | undefined,
  apiKey: string,
  supabase: any,
  timestamp: number,
): Promise<string | null> {
  const isThiago = visual_style === "carrosseis_thiago";
  if (isThiago) {
    // For Thiago style, the prompt already contains full card instructions with text
    const fullPrompt = `Create a complete Instagram card design (1080x1440px, aspect ratio 3:4, vertical/portrait orientation). ${prompt}. Render ALL text exactly as specified — large, bold, legible sans-serif display typography. Text in the specified colors (white, black, or orange #E85D04). The typography must be sharp, clean, and perfectly readable. Professional graphic design quality.`;
    // Use the same generation logic below
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await delay(1500);
      try {
        const aiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
            }),
          }
        );
        if (!aiResponse.ok) {
          const status = aiResponse.status;
          const text = await aiResponse.text();
          console.error(`Google AI error for prompt ${index} (attempt ${attempt}):`, status, text);
          if (status === 429) break;
          continue;
        }
        const data = await aiResponse.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));
        if (!imagePart) {
          console.warn(`No image in response for prompt ${index} (attempt ${attempt}), retrying...`);
          continue;
        }
        const base64 = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType;
        const ext = mimeType === "image/jpeg" ? "jpg" : "png";
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const filePath = `${timestamp}_${index}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("generated-images")
          .upload(filePath, bytes, { contentType: mimeType, upsert: true });
        if (uploadError) {
          console.error(`Upload error for prompt ${index}:`, uploadError);
          return null;
        }
        const { data: publicUrl } = supabase.storage
          .from("generated-images")
          .getPublicUrl(filePath);
        return publicUrl.publicUrl;
      } catch (err) {
        console.error(`Error processing prompt ${index} (attempt ${attempt}):`, err);
      }
    }
    return null;
  }

  const styleHint = visual_style ? ` Style: ${visual_style}.` : "";
  const fullPrompt = `Generate an image: ${prompt}.${styleHint} High quality, professional, suitable for Instagram carousel. Do not include any text in the image.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await delay(1500);

    try {
      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        }
      );

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        const text = await aiResponse.text();
        console.error(`Google AI error for prompt ${index} (attempt ${attempt}):`, status, text);
        if (status === 429) break;
        continue;
      }

      const data = await aiResponse.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));

      if (!imagePart) {
        console.warn(`No image in response for prompt ${index} (attempt ${attempt}), retrying...`);
        continue;
      }

      const base64 = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType;
      const ext = mimeType === "image/jpeg" ? "jpg" : "png";
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      const filePath = `${timestamp}_${index}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("generated-images")
        .upload(filePath, bytes, { contentType: mimeType, upsert: true });

      if (uploadError) {
        console.error(`Upload error for prompt ${index}:`, uploadError);
        return null;
      }

      const { data: publicUrl } = supabase.storage
        .from("generated-images")
        .getPublicUrl(filePath);

      return publicUrl.publicUrl;
    } catch (err) {
      console.error(`Error processing prompt ${index} (attempt ${attempt}):`, err);
    }
  }

  return null;
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

    // --- Credit check ---
    const COST_PER_IMAGE = 36;
    const totalCost = prompts.length * COST_PER_IMAGE;
    
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: authUser } } = await createClient(
      supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);
    const userId = authUser?.id;

    if (totalCost > 0 && userId) {
      const { error: debitError } = await supabase.rpc("debit_credits", {
        p_user_id: userId,
        p_amount: totalCost,
      });
      if (debitError) {
        const isInsufficient = debitError.message?.includes("INSUFFICIENT_CREDITS");
        return new Response(
          JSON.stringify({ error: isInsufficient ? "INSUFFICIENT_CREDITS" : debitError.message }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const timestamp = Date.now();
    const urls: (string | null)[] = new Array(prompts.length).fill(null);

    // Process in batches of 3
    const BATCH_SIZE = 3;
    for (let batchStart = 0; batchStart < prompts.length; batchStart += BATCH_SIZE) {
      if (batchStart > 0) await delay(1000);

      const batchEnd = Math.min(batchStart + BATCH_SIZE, prompts.length);
      const batchPromises: Promise<{ index: number; url: string | null }>[] = [];

      for (let i = batchStart; i < batchEnd; i++) {
        batchPromises.push(
          generateSingleImage(prompts[i], i, visual_style, GOOGLE_AI_API_KEY, supabase, timestamp)
            .then((url) => ({ index: i, url }))
        );
      }

      const results = await Promise.allSettled(batchPromises);
      for (const r of results) {
        if (r.status === "fulfilled") {
          urls[r.value.index] = r.value.url;
        }
      }
    }

    // Log usage
    if (userId && totalCost > 0) {
      await supabase.from("usage_log").insert({
        user_id: userId,
        function_name: "generate-images",
        ai_model: "gemini-3.1-flash-image",
        credits_used: totalCost,
        metadata: { image_count: prompts.length, visual_style },
      });
    }

    let newBalance: number | undefined;
    if (userId) {
      const { data: creditData } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .single();
      newBalance = creditData?.balance;
    }

    return new Response(JSON.stringify({ urls, credits_used: totalCost, balance: newBalance }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-images error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
