import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STRATEGY_SYSTEM = `Você é um estrategista de conteúdo digital de alto nível. Sua função é analisar uma ideia bruta e produzir uma camada estratégica completa.

Regras:
- Identifique a dor, desejo ou tensão central do público
- Defina uma Big Idea clara e memorável
- Escolha o melhor tipo de lead entre: offer, promise, problem_solution, big_secret, revelation, story
- Defina um ângulo de comunicação único
- Crie uma promessa forte e específica
- Defina a estratégia de CTA

Responda APENAS com JSON válido no formato:
{
  "pain_desire_tension": "string",
  "big_idea": "string",
  "lead_type": "offer|promise|problem_solution|big_secret|revelation|story",
  "angle": "string",
  "promise": "string",
  "cta_strategy": "string"
}`;

const REELS_SYSTEM = `Você é um roteirista de Reels virais e estratégicos. Crie conteúdo com linguagem natural, alta clareza, emocionalmente denso mas não vendedor, premissas fortes, não genérico, sem tom robótico, CTA simples e direto, progressão lógica e emocional.

Estrutura do Reels:
1. Hook (gancho poderoso)
2. Contexto
3. Conflito
4. Conexão
5. CTA

Responda APENAS com JSON válido no formato:
{
  "title": "string",
  "hook": "string",
  "script": "string (roteiro completo falado)",
  "on_screen_text": ["texto1", "texto2", ...],
  "scene_suggestions": ["cena1", "cena2", ...],
  "caption": "string (legenda para publicação)",
  "cta": "string",
  "editing_notes": "string"
}`;

const CAROUSEL_SYSTEM = `Você é um especialista em carrosséis estratégicos para redes sociais. Crie conteúdo com linguagem natural, alta clareza, emocionalmente denso mas não vendedor, premissas fortes, não genérico, sem tom robótico, CTA simples e direto, progressão lógica e emocional.

Estrutura do Carrossel:
- Slide 1: hook (gancho)
- Slide 2: tensão/expansão
- Slide 3: aprofundamento
- Slide 4: virada/insight
- Slides 5+: desenvolvimento/solução/reflexão
- Último slide: CTA

Para cada slide, o visual_prompt deve ser:
- Descrição visual rica pronta para geração de imagem
- Estética coerente entre slides
- Evitar visual genérico de IA
- Priorizar visual humano, editorial, real, limpo
- Incluir cena, ambiente, sujeito, emoção, composição, iluminação, estilo premium
- Aspecto quadrado (1:1)
- Se o slide tem tipografia forte, a imagem deve deixar espaço limpo para texto

Responda APENAS com JSON válido no formato:
{
  "title": "string",
  "caption": "string (legenda para publicação)",
  "cta": "string",
  "slides": [
    {
      "slide_number": 1,
      "role": "hook|tension|deepening|insight|development|solution|cta",
      "title": "string",
      "body": "string",
      "emotional_goal": "string",
      "visual_prompt": "string"
    }
  ]
}`;

// --- Provider-specific AI callers ---

async function callGoogleAI(apiKey: string, system: string, userPrompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: system }] },
        generationConfig: { responseMimeType: "application/json" },
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
  return JSON.parse(content);
}

async function callOpenAI(apiKey: string, system: string, userPrompt: string) {
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
      response_format: { type: "json_object" },
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
  return JSON.parse(content);
}

async function callAnthropic(apiKey: string, system: string, userPrompt: string) {
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
  
  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}

// --- Router ---

type Provider = "google" | "openai" | "anthropic";

async function callAI(provider: Provider, system: string, userPrompt: string): Promise<any> {
  switch (provider) {
    case "google": {
      const key = Deno.env.get("GOOGLE_AI_API_KEY");
      if (!key) throw new Error("GOOGLE_AI_API_KEY não configurada. Adicione nas configurações.");
      return callGoogleAI(key, system, userPrompt);
    }
    case "openai": {
      const key = Deno.env.get("OPENAI_API_KEY");
      if (!key) throw new Error("OPENAI_API_KEY não configurada. Adicione nas configurações.");
      return callOpenAI(key, system, userPrompt);
    }
    case "anthropic": {
      const key = Deno.env.get("ANTHROPIC_API_KEY");
      if (!key) throw new Error("ANTHROPIC_API_KEY não configurada. Adicione nas configurações.");
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
    const input = await req.json();
    const { idea, format, goal, awareness, tone, niche, offer, cards, visual_style, ai_provider = "google" } = input;

    const strategyPrompt = `Analise esta ideia e crie a camada estratégica:

IDEIA: ${idea}
FORMATO: ${format}
OBJETIVO: ${goal}
CONSCIÊNCIA DA AUDIÊNCIA: ${awareness}
TOM: ${tone}
NICHO: ${niche}
${offer ? `OFERTA: ${offer}` : ""}

Considere o nível de consciência da audiência (${awareness}) para calibrar a abordagem.
O objetivo é ${goal}, então a estratégia deve maximizar esse resultado.
O tom principal deve ser ${tone}.`;

    const strategy = await callAI(ai_provider, STRATEGY_SYSTEM, strategyPrompt);

    let content;
    if (format === "reels") {
      const reelsPrompt = `Com base nesta estratégia, crie o conteúdo completo para um Reels:

ESTRATÉGIA:
- Dor/Desejo/Tensão: ${strategy.pain_desire_tension}
- Big Idea: ${strategy.big_idea}
- Tipo de Lead: ${strategy.lead_type}
- Ângulo: ${strategy.angle}
- Promessa: ${strategy.promise}
- Estratégia de CTA: ${strategy.cta_strategy}

CONTEXTO ORIGINAL:
- Ideia: ${idea}
- Nicho: ${niche}
- Tom: ${tone}
- Objetivo: ${goal}
- Audiência: ${awareness}
${offer ? `- Oferta: ${offer}` : ""}

Crie um roteiro envolvente seguindo a estrutura Hook > Contexto > Conflito > Conexão > CTA.`;

      content = await callAI(ai_provider, REELS_SYSTEM, reelsPrompt);
    } else {
      const carouselPrompt = `Com base nesta estratégia, crie o conteúdo completo para um carrossel de ${cards} slides:

ESTRATÉGIA:
- Dor/Desejo/Tensão: ${strategy.pain_desire_tension}
- Big Idea: ${strategy.big_idea}
- Tipo de Lead: ${strategy.lead_type}
- Ângulo: ${strategy.angle}
- Promessa: ${strategy.promise}
- Estratégia de CTA: ${strategy.cta_strategy}

CONTEXTO ORIGINAL:
- Ideia: ${idea}
- Nicho: ${niche}
- Tom: ${tone}
- Objetivo: ${goal}
- Audiência: ${awareness}
- Estilo Visual: ${visual_style}
${offer ? `- Oferta: ${offer}` : ""}

Crie exatamente ${cards} slides seguindo a estrutura definida. Cada slide deve ter um visual_prompt rico e coerente com o estilo visual "${visual_style}".`;

      content = await callAI(ai_provider, CAROUSEL_SYSTEM, carouselPrompt);
    }

    const result: Record<string, unknown> = { strategy };
    if (format === "reels") {
      result.reels = {
        ...content,
        big_idea: strategy.big_idea,
        lead_type: strategy.lead_type,
        angle: strategy.angle,
      };
    } else {
      result.carousel = {
        ...content,
        big_idea: strategy.big_idea,
        lead_type: strategy.lead_type,
        angle: strategy.angle,
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";

    let status = 500;
    if (msg === "RATE_LIMITED") status = 429;

    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
