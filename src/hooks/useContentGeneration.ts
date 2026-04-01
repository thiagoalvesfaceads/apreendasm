import { useState } from "react";
import { ContentInput, GeneratedContent } from "@/types/content";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useContentGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async (input: ContentInput) => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-content", {
        body: input,
      });

      if (fnError) {
        throw new Error(fnError.message || "Erro ao chamar a função de geração");
      }

      if (data?.error) {
        if (data.error === "RATE_LIMITED") {
          throw new Error("Limite de requisições atingido. Aguarde um momento e tente novamente.");
        }
        if (data.error === "PAYMENT_REQUIRED") {
          throw new Error("Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage.");
        }
        throw new Error(data.error);
      }

      const content: GeneratedContent = {
        input,
        strategy: data.strategy,
        reels: data.reels,
        carousel: data.carousel,
        generated_at: new Date().toISOString(),
      };

      setResult(content);
      toast.success("Conteúdo gerado com sucesso!");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao gerar conteúdo";
      setError(message);
      toast.error(message);
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
