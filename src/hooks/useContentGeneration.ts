import { useState } from "react";
import { ContentInput, GeneratedContent, Strategy, ReelsContent, CarouselContent, CarouselSlide } from "@/types/content";

// Mock generation for now - will be replaced with AI edge function calls
function generateMockStrategy(input: ContentInput): Strategy {
  return {
    pain_desire_tension: "Carregando análise estratégica...",
    big_idea: "Carregando...",
    lead_type: "promise",
    angle: "Carregando...",
    promise: "Carregando...",
    cta_strategy: "Carregando...",
  };
}

function generateMockReels(input: ContentInput, strategy: Strategy): ReelsContent {
  return {
    title: "Carregando...",
    big_idea: strategy.big_idea,
    lead_type: strategy.lead_type,
    angle: strategy.angle,
    hook: "Carregando...",
    script: "Carregando...",
    on_screen_text: [],
    scene_suggestions: [],
    caption: "Carregando...",
    cta: "Carregando...",
    editing_notes: "Carregando...",
  };
}

function generateMockCarousel(input: ContentInput, strategy: Strategy): CarouselContent {
  const slides: CarouselSlide[] = Array.from({ length: input.cards }, (_, i) => ({
    slide_number: i + 1,
    role: i === 0 ? "hook" : i === input.cards - 1 ? "cta" : i === 1 ? "tension" : i === 2 ? "deepening" : i === 3 ? "insight" : "development",
    title: "Carregando...",
    body: "Carregando...",
    emotional_goal: "Carregando...",
    visual_prompt: "Carregando...",
  }));

  return {
    title: "Carregando...",
    big_idea: strategy.big_idea,
    lead_type: strategy.lead_type,
    angle: strategy.angle,
    caption: "Carregando...",
    cta: "Carregando...",
    slides,
  };
}

export function useContentGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async (input: ContentInput) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Simulate AI processing delay
      await new Promise((r) => setTimeout(r, 2000));

      const strategy = generateMockStrategy(input);
      
      const content: GeneratedContent = {
        input,
        strategy,
        generated_at: new Date().toISOString(),
      };

      if (input.format === "reels") {
        content.reels = generateMockReels(input, strategy);
      } else {
        content.carousel = generateMockCarousel(input, strategy);
      }

      setResult(content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar conteúdo");
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateImages = async () => {
    // Placeholder for image regeneration
  };

  const regenerateCaption = async () => {
    // Placeholder
  };

  const regenerateSlide = async (slideNumber: number) => {
    // Placeholder
  };

  return {
    isGenerating,
    result,
    error,
    generate,
    setResult,
    regenerateImages,
    regenerateCaption,
    regenerateSlide,
  };
}
