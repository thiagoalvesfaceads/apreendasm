import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, Record<string, string>> = {
  title: {
    regenerate: `Você é um copywriter de alto nível. Gere um NOVO título curto, impactante e estratégico para um slide de carrossel de rede social.
Considere o papel do slide (hook, tensão, insight, etc.), o corpo do texto e o objetivo emocional.
Responda APENAS com o texto do novo título, sem aspas, sem explicação.`,
  },
  body: {
    regenerate: `Você é um copywriter de alto nível. Gere um NOVO corpo de texto para um slide de carrossel de rede social.
Mantenha o mesmo papel (role), objetivo emocional e tom. O texto deve ser envolvente, não genérico, com progressão emocional.
Responda APENAS com o novo corpo de texto, sem aspas, sem explicação.`,
    shorten: `Você é um editor de textos expert. Encurte o texto abaixo, tornando-o mais conciso e direto, sem perder a essência e o impacto emocional.
Mantenha o tom e o objetivo emocional. Reduza em aproximadamente 30-50%.
Responda APENAS com o texto encurtado, sem aspas, sem explicação.`,
    lengthen: `Você é um copywriter de alto nível. Expanda o texto abaixo, aprofundando os argumentos, adicionando storytelling, frases de impacto e mais camadas emocionais.
Mantenha o tom e o objetivo emocional. Aumente em aproximadamente 50-100%.
Responda APENAS com o texto expandido, sem aspas, sem explicação.`,
  },
  visual_prompt: {
    regenerate: `Você é um diretor de arte digital. Gere um NOVO prompt visual para geração de imagem de um slide de carrossel.
O prompt deve ser rico, descritivo, com cena, ambiente, sujeito, emoção, composição, iluminação. Aspecto 1:1. Estética premium, não genérica.
Considere o conteúdo do slide para criar uma imagem coerente.
Responda APENAS com o novo prompt visual, sem aspas, sem explicação.`,
  },
};

async function callGoogleAI(apiKey: string, system: string, userPrompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: system }] },
      }),
    }
  );

  if (!response.ok) {
    const status = response.status;
    const body = await response.text();
    if (status === 429) throw new Error("RATE_LIMITED");
    throw new Error(`Google AI error [${status}]: ${body}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("No content in AI response");
  return content.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { field, action, slide, strategy, tone, niche } = await req.json();

    if (!field || !action || !slide) {
      return new Response(JSON.stringify({ error: "Missing required fields: field, action, slide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = SYSTEM_PROMPTS[field]?.[action];
    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: `Invalid field/action: ${field}/${action}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `SLIDE #${slide.slide_number}
Papel: ${slide.role}
Título atual: ${slide.title}
Corpo atual: ${slide.body}
Objetivo emocional: ${slide.emotional_goal}
Prompt visual atual: ${slide.visual_prompt || "nenhum"}

ESTRATÉGIA:
- Big Idea: ${strategy?.big_idea || "N/A"}
- Dor/Desejo/Tensão: ${strategy?.pain_desire_tension || "N/A"}
- Promessa: ${strategy?.promise || "N/A"}

Nicho: ${niche || "N/A"}
Tom: ${tone || "N/A"}

${action === "shorten" ? "Encurte o CORPO do slide acima." : ""}
${action === "lengthen" ? "Expanda e aprofunde o CORPO do slide acima." : ""}
${action === "regenerate" && field === "title" ? "Gere um novo TÍTULO para o slide acima." : ""}
${action === "regenerate" && field === "body" ? "Gere um novo CORPO para o slide acima." : ""}
${action === "regenerate" && field === "visual_prompt" ? "Gere um novo PROMPT VISUAL para o slide acima." : ""}`;

    const key = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!key) throw new Error("GOOGLE_AI_API_KEY não configurada.");

    const value = await callGoogleAI(key, systemPrompt, userPrompt);

    return new Response(JSON.stringify({ value }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("regenerate-field error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    let status = 500;
    if (msg === "RATE_LIMITED") status = 429;

    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
