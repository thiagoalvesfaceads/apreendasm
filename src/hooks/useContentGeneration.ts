import { useState } from "react";
import { ContentInput, GeneratedContent } from "@/types/content";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useContentGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImages = async (content: GeneratedContent) => {
    const prompts: string[] = [];
    if (content.carousel) {
      prompts.push(...content.carousel.slides.map((s) => s.visual_prompt));
    } else if (content.reels?.scene_suggestions) {
      prompts.push(...content.reels.scene_suggestions);
    }
    if (prompts.length === 0) return content;

    setIsGeneratingImages(true);
    toast.info("Gerando imagens... isso pode levar alguns segundos.");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-images", {
        body: { prompts, visual_style: content.input.visual_style },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error === "PAYMENT_REQUIRED") {
        throw new Error("Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage.");
      }

      const urls: (string | null)[] = data?.urls || [];
      const updated = { ...content };

      if (updated.carousel) {
        updated.carousel = {
          ...updated.carousel,
          slides: updated.carousel.slides.map((s, i) => ({
            ...s,
            image_url: urls[i] || s.image_url,
          })),
        };
      }

      const successCount = urls.filter(Boolean).length;
      if (successCount > 0) {
        toast.success(`${successCount} imagem(ns) gerada(s) com sucesso!`);
      } else {
        toast.warning("Não foi possível gerar as imagens. Tente novamente.");
      }

      return updated;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao gerar imagens";
      toast.error(message);
      return content;
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const generate = async (input: ContentInput) => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-content", {
        body: input,
      });

      if (fnError) throw new Error(fnError.message || "Erro ao chamar a função de geração");

      if (data?.error) {
        if (data.error === "RATE_LIMITED") {
          throw new Error("Limite de requisições atingido. Aguarde um momento e tente novamente.");
        }
        if (data.error === "PAYMENT_REQUIRED" || data.error === "INSUFFICIENT_CREDITS") {
          throw new Error("Créditos insuficientes. Recarregue seus créditos para continuar.");
        }
        if (data.error === "WELCOME_CREDITS_RESTRICTED") {
          throw new Error(data.message || "Créditos de boas-vindas só podem ser usados para geração de texto com Gemini ou OpenAI.");
        }
        throw new Error(data.error);
      }

      let content: GeneratedContent = {
        input,
        strategy: data.strategy,
        reels: data.reels,
        carousel: data.carousel,
        generated_at: new Date().toISOString(),
      };

      setResult(content);
      toast.success("Conteúdo gerado com sucesso!");

      // Auto-generate images if toggle is on
      if (input.generate_images) {
        content = await generateImages(content);
        setResult(content);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao gerar conteúdo";
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateImages = async () => {
    if (!result) return;
    const updated = await generateImages(result);
    setResult(updated);
  };

  const regenerateCaption = async () => {
    // Placeholder
  };

  const regenerateSlide = async (slideNumber: number) => {
    if (!result?.carousel) return;
    const slide = result.carousel.slides.find((s) => s.slide_number === slideNumber);
    if (!slide) return;

    setIsGeneratingImages(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-images", {
        body: { prompts: [slide.visual_prompt], visual_style: result.input.visual_style },
      });

      if (fnError) throw new Error(fnError.message);

      const url = data?.urls?.[0];
      if (url) {
        const updated = {
          ...result,
          carousel: {
            ...result.carousel,
            slides: result.carousel.slides.map((s) =>
              s.slide_number === slideNumber ? { ...s, image_url: url } : s
            ),
          },
        };
        setResult(updated);
        toast.success(`Imagem do slide ${slideNumber} regenerada!`);
      } else {
        toast.warning("Não foi possível gerar a imagem. Tente novamente.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao regenerar imagem");
    } finally {
      setIsGeneratingImages(false);
    }
  };

  return {
    isGenerating,
    isGeneratingImages,
    result,
    error,
    generate,
    setResult,
    regenerateImages,
    regenerateCaption,
    regenerateSlide,
  };
}
