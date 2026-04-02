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

// --- Provider-specific AI callers ---

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
  if (!content) throw new Error("No content in Google AI response");
  return content.trim();
}

async function callOpenAI(apiKey: string, system: string, userPrompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const body = await response.text();
    if (status === 429) throw new Error("RATE_LIMITED");
    throw new Error(`OpenAI error [${status}]: ${body}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in OpenAI response");
  return content.trim();
}

async function callAnthropic(apiKey: string, system: string, userPrompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const body = await response.text();
    if (status === 429) throw new Error("RATE_LIMITED");
    throw new Error(`Anthropic error [${status}]: ${body}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("No content in Anthropic response");
  return text.trim();
}

// --- Router ---

type Provider = "google" | "openai" | "anthropic";

async function callAI(provider: Provider, system: string, userPrompt: string): Promise<string> {
  switch (provider) {
    case "google": {
      const key = Deno.env.get("GOOGLE_AI_API_KEY");
      if (!key) throw new Error("GOOGLE_AI_API_KEY não configurada.");
      return callGoogleAI(key, system, userPrompt);
    }
    case "openai": {
      const key = Deno.env.get("OPENAI_API_KEY");
      if (!key) throw new Error("OPENAI_API_KEY não configurada.");
      return callOpenAI(key, system, userPrompt);
    }
    case "anthropic": {
      const key = Deno.env.get("ANTHROPIC_API_KEY");
      if (!key) throw new Error("ANTHROPIC_API_KEY não configurada.");
      return callAnthropic(key, system, userPrompt);
    }
    default:
      throw new Error(`Provider desconhecido: ${provider}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { field, action, slide, strategy, tone, niche, ai_provider = "google" } = await req.json();

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

    const hasParagraphs = /\n\s*\n/.test(slide.body || "");
    const hasBold = /\*\*.+?\*\*/.test(slide.body || "");
    const hasHook = (slide.body || "").trimEnd().endsWith(">");

    let formatRules = "";
    if (hasParagraphs || hasBold || hasHook) {
      const rules: string[] = [];
      if (hasParagraphs) {
        rules.push("- O texto atual tem MÚLTIPLOS PARÁGRAFOS separados por linhas em branco (\\n\\n). Você DEVE manter essa estrutura. NUNCA junte tudo em um bloco só. Cada parágrafo deve continuar separado por uma linha em branco.");
        rules.push("- Ao encurtar: reduza DENTRO da estrutura de parágrafos atual, mantendo a separação.");
        rules.push("- Ao alongar: aprofunde os parágrafos existentes ou adicione novos, mas NUNCA transforme em uma parede de texto contínua.");
      }
      if (hasBold) {
        rules.push("- O texto atual usa **negrito** (marcadores **). Você DEVE preservar esse padrão. Mantenha as palavras/frases importantes em **negrito**.");
      }
      if (hasHook) {
        rules.push("- O texto atual termina com uma frase-gancho curta seguida de '>'. Você DEVE manter esse padrão — o texto final DEVE terminar com uma frase-gancho curta + '>' (ex: 'te explico o seguinte >').");
      }
      formatRules = `\n\nREGRAS OBRIGATÓRIAS DE FORMATAÇÃO (NÃO IGNORAR):\n${rules.join("\n")}`;
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
${action === "regenerate" && field === "visual_prompt" ? "Gere um novo PROMPT VISUAL para o slide acima." : ""}${formatRules}`;

    const value = await callAI(ai_provider as Provider, systemPrompt, userPrompt);

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
