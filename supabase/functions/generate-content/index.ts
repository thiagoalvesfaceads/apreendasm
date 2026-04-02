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

NÃO inclua visual_prompt nos slides. Deixe visual_prompt como string vazia "". Os prompts visuais serão gerados separadamente.

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
      "visual_prompt": ""
    }
  ]
}`;

const VISUAL_PROMPT_SYSTEM = `Você é um diretor de arte especializado em criar prompts visuais para geração de imagens por IA. Sua função é analisar o conteúdo textual FINALIZADO de cada slide de um carrossel e criar prompts visuais que complementem visualmente a narrativa.

Regras fundamentais:
- Cada prompt deve COMPLEMENTAR o texto, não repeti-lo ou ilustrá-lo literalmente
- Mantenha coerência estética entre TODOS os slides (mesma paleta, ambiente, sujeito, iluminação)
- Priorize visual humano, editorial, real, limpo — NUNCA visual genérico de IA
- Inclua: cena, ambiente, sujeito, emoção, composição, iluminação, estilo
- Aspecto quadrado (1:1) sempre
- Se o slide tem tipografia forte, a imagem deve deixar espaço limpo para texto (área negativa)
- Para slides de CTA (último slide), retorne "none" como visual_prompt
- Adapte a atmosfera visual ao emotional_goal de cada slide
- Use referências visuais concretas (ex: "iluminação golden hour lateral", "composição regra dos terços", "profundidade de campo rasa f/1.8")

Responda APENAS com JSON válido no formato:
{
  "visual_prompts": [
    {
      "slide_number": 1,
      "visual_prompt": "string (prompt detalhado para geração de imagem)"
    }
  ]
}`;

// --- Provider-specific AI callers ---

async function callGoogleAI(apiKey: string, system: string, userPrompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      const cardToneInstruction = tone === "card"
        ? `\n\nINSTRUÇÃO ESPECIAL — TOM "CARD":\nCada slide deve ter um body denso e de impacto. Use storytelling, frases de impacto e progressão emocional. O estilo é de posts de autoridade no Instagram — como se cada card fosse um micro-post completo. Cada parágrafo deve ter peso próprio. Não use frases genéricas ou superficiais. Escreva como Alfredo Soares, Gary Vee ou grandes criadores de conteúdo de autoridade. Cada card deve provocar reflexão profunda.\n\nTAMANHO DO BODY:\n- A MAIORIA dos slides deve ter no máximo 2 parágrafos densos\n- Apenas o slide central (se 5 slides → slide 3, se 7 slides → slide 4, se número par de slides → o mais próximo do último) pode ter até 3 parágrafos\n- O último slide (CTA) pode ter até 3 parágrafos\n- O gancho de transição (">") conta como parágrafo separado\n- NUNCA exceda esses limites. Priorize impacto por frase, não volume de texto.\n\nGANCHO DE TRANSIÇÃO: Cada card (EXCETO o último) DEVE terminar com uma frase-gancho curta seguida de ">" para instigar a leitura do próximo card. Exemplos: "te explico o seguinte >", "e é aqui que muda tudo >", "olha o que acontece >", "mas tem um detalhe >", "e o melhor ainda vem >". A frase deve ser natural e criar tensão/curiosidade.\n\nÚLTIMO CARD (CTA): O último slide deve ser puramente textual, SEM imagem. Defina o visual_prompt como "none". O body deve ser um texto persuasivo de alta conversão com a oferta/chamada para ação. Centralizado, direto, emocional. Como um fechamento de venda irresistível.\n\nFORMATAÇÃO OBRIGATÓRIA DO BODY:\n- Separe cada parágrafo com duas quebras de linha (\\n\\n) dentro do campo "body" do JSON\n- Use **negrito** (markdown com dois asteriscos) nas frases de maior impacto emocional, insights-chave e palavras de autoridade\n- NUNCA retorne o body como um bloco único de texto corrido\n- O gancho de transição final (com ">") deve estar em seu próprio parágrafo separado`
        : "";

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

Crie exatamente ${cards} slides seguindo a estrutura definida. NÃO crie visual_prompt — deixe como string vazia.${cardToneInstruction}`;

      content = await callAI(ai_provider, CAROUSEL_SYSTEM, carouselPrompt);

      // --- Second step: generate visual prompts based on final copy ---
      const slidesContext = content.slides
        .map((s: any) => `Slide ${s.slide_number} [${s.role}]: Título: "${s.title}" | Body: "${s.body}" | Objetivo emocional: "${s.emotional_goal}"`)
        .join("\n");

      const visualPromptRequest = `Crie prompts visuais para cada slide deste carrossel, baseados no conteúdo textual FINAL abaixo.

ESTRATÉGIA:
- Dor/Desejo/Tensão: ${strategy.pain_desire_tension}
- Big Idea: ${strategy.big_idea}
- Ângulo: ${strategy.angle}

CONTEXTO:
- Nicho: ${niche}
- Tom: ${tone}
- Estilo Visual desejado: ${visual_style}

SLIDES (conteúdo final):
${slidesContext}

Para o ÚLTIMO slide (CTA), retorne visual_prompt como "none".
Mantenha coerência visual entre todos os slides — mesma paleta, sujeito, ambiente.
Adapte cada prompt ao emotional_goal e ao conteúdo específico de cada slide.`;

      try {
        const visualData = await callAI(ai_provider, VISUAL_PROMPT_SYSTEM, visualPromptRequest);
        if (visualData?.visual_prompts && Array.isArray(visualData.visual_prompts)) {
          content.slides = content.slides.map((slide: any) => {
            const vp = visualData.visual_prompts.find((v: any) => v.slide_number === slide.slide_number);
            return vp ? { ...slide, visual_prompt: vp.visual_prompt } : slide;
          });
        }
      } catch (vpError) {
        console.error("Visual prompt generation failed, keeping original prompts:", vpError);
      }
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
