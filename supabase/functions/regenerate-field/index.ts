import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANTI_CONTAMINATION = `
REGRA CRÍTICA: Responda APENAS com o texto solicitado. 
NÃO inclua NENHUMA label, metadado ou estrutura do prompt como: "SLIDE #", "Papel:", "Título atual:", "Corpo atual:", "Objetivo emocional:", "Prompt visual:", "ESTRATÉGIA", "Big Idea:", "Dor/Desejo/Tensão:", "Promessa:", "Nicho:", "Tom:", etc.
Sua resposta deve conter SOMENTE o texto final, sem aspas, sem explicação, sem labels.`;

const FORMAT_RULES_CARD = `
FORMATAÇÃO OBRIGATÓRIA:
- Separe cada parágrafo com duas quebras de linha (\\n\\n) dentro do texto
- Use **negrito** (markdown) nas frases de maior impacto emocional, insights-chave e palavras de autoridade
- NUNCA retorne o texto como um bloco único corrido

GANCHO DE TRANSIÇÃO (OBRIGATÓRIO):
- Se NÃO for o último slide (CTA), o body DEVE terminar com uma frase-gancho curta seguida de ">" em parágrafo separado
- Exemplos: "te explico o seguinte >", "e é aqui que muda tudo >", "mas tem um detalhe >"
- Se FOR o último slide (CTA), NÃO incluir gancho
- A frase-gancho DEVE estar em seu próprio parágrafo separado e terminar com ">"

LIMITE DE PARÁGRAFOS:
- Máximo 2 parágrafos para a maioria dos slides
- Até 3 parágrafos APENAS para o slide central (se 5 slides → slide 3, se 7 → slide 4, se par → o mais próximo do último) e o último slide (CTA)
- O gancho de transição (">") conta como parágrafo separado
- NUNCA exceda esses limites. Priorize impacto por frase, não volume.
- Estes limites são ABSOLUTOS e se aplicam a TODAS as ações (regenerar, encurtar, alongar).`;

const SYSTEM_PROMPTS: Record<string, Record<string, string>> = {
  title: {
    regenerate: `Você é um copywriter de alto nível. Gere um NOVO título curto, impactante e estratégico para um slide de carrossel de rede social.
Considere o papel do slide (hook, tensão, insight, etc.), o corpo do texto e o objetivo emocional.
${ANTI_CONTAMINATION}`,
  },
  body: {
    regenerate: `Você é um copywriter de alto nível. Gere um NOVO corpo de texto para um slide de carrossel de rede social.
Mantenha o mesmo papel (role), objetivo emocional e tom. O texto deve ser envolvente, não genérico, com progressão emocional.
${ANTI_CONTAMINATION}`,
    shorten: `Você é um editor de textos expert. Sua ÚNICA tarefa é ENCURTAR o texto fornecido.
REGRAS OBRIGATÓRIAS:
- O texto resultante DEVE ser significativamente mais curto que o original (30-50% menor em caracteres)
- Mantenha a essência, o tom e o impacto emocional
- NUNCA retorne o texto original sem alterações
- Se o texto já for curto, ainda assim reduza condensando frases
${ANTI_CONTAMINATION}`,
    lengthen: `Você é um copywriter de alto nível. Expanda o texto fornecido, aprofundando os argumentos com mais camadas emocionais e storytelling.
Mantenha o tom e o objetivo emocional. Enriqueça a densidade do texto SEM adicionar parágrafos extras — aprofunde os existentes.
IMPORTANTE: O limite de parágrafos das regras de formatação é INVIOLÁVEL, mesmo ao expandir.
${ANTI_CONTAMINATION}`,
  },
  visual_prompt: {
    regenerate: `Você é um diretor de arte digital. Gere um NOVO prompt visual para geração de imagem de um slide de carrossel.
O prompt deve ser rico, descritivo, com cena, ambiente, sujeito, emoção, composição, iluminação. Aspecto 1:1. Estética premium, não genérica.
Considere o conteúdo do slide para criar uma imagem coerente.
${ANTI_CONTAMINATION}`,
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

function buildUserPrompt(field: string, action: string, slide: any, strategy: any, tone: string, niche: string): string {
  const isCard = tone === "card";
  const isBodyAction = field === "body";

  // For body shorten/lengthen, use delimited structure to prevent metadata contamination
  if (isBodyAction && (action === "shorten" || action === "lengthen")) {
    const actionLabel = action === "shorten" ? "ENCURTAR" : "EXPANDIR";
    let prompt = `---TEXTO A ${actionLabel}---
${slide.body}
---FIM DO TEXTO---

Contexto auxiliar (NÃO incluir na resposta, use apenas como referência de tom e estilo):
- Slide #${slide.slide_number}, Papel: ${slide.role}
- Título: ${slide.title}
- Objetivo emocional: ${slide.emotional_goal}
- Tom: ${tone || "N/A"}, Nicho: ${niche || "N/A"}`;

    if (isCard) {
      prompt += `\n\n${FORMAT_RULES_CARD}`;
    }

    return prompt;
  }

  // For regenerate actions, also use clear separation
  let prompt = `Contexto auxiliar (NÃO incluir na resposta, use apenas como referência):
- Slide #${slide.slide_number}, Papel: ${slide.role}
- Título: ${slide.title}
- Corpo: ${slide.body}
- Objetivo emocional: ${slide.emotional_goal}
- Prompt visual atual: ${slide.visual_prompt || "nenhum"}
- Big Idea: ${strategy?.big_idea || "N/A"}
- Dor/Desejo/Tensão: ${strategy?.pain_desire_tension || "N/A"}
- Promessa: ${strategy?.promise || "N/A"}
- Tom: ${tone || "N/A"}, Nicho: ${niche || "N/A"}

`;

  if (field === "title") {
    prompt += "Gere um novo TÍTULO para este slide.";
  } else if (field === "body") {
    prompt += "Gere um novo CORPO para este slide.";
    if (isCard) {
      prompt += `\n\n${FORMAT_RULES_CARD}`;
    }
  } else if (field === "visual_prompt") {
    prompt += "Gere um novo PROMPT VISUAL para este slide.";
  }

  return prompt;
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

    let systemPrompt = SYSTEM_PROMPTS[field]?.[action];
    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: `Invalid field/action: ${field}/${action}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For card tone, always append format rules to body system prompts
    if (tone === "card" && field === "body") {
      systemPrompt += `\n\n${FORMAT_RULES_CARD}`;
    }

    const userPrompt = buildUserPrompt(field, action, slide, strategy, tone || "", niche || "");

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
