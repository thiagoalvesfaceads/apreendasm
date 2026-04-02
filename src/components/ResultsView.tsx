import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Download, Bookmark, Check } from "lucide-react";
import { GeneratedContent } from "@/types/content";
import { StrategyTab } from "@/components/results/StrategyTab";
import { ReelsTab } from "@/components/results/ReelsTab";
import { CarouselTab } from "@/components/results/CarouselTab";
import { CaptionTab } from "@/components/results/CaptionTab";
import { VisualPromptsTab } from "@/components/results/VisualPromptsTab";
import { ImagesTab } from "@/components/results/ImagesTab";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ResultsViewProps {
  content: GeneratedContent;
  isGeneratingImages?: boolean;
  onBack: () => void;
  onRegenerate: () => void;
  onRegenerateImages?: () => void;
  onRegenerateCaption?: () => void;
  onRegenerateSlide?: (slideNumber: number) => void;
}

const TAB_CONFIG = {
  reels: [
    { key: "strategy", label: "Estratégia" },
    { key: "reels", label: "Reels" },
    { key: "caption", label: "Legenda" },
    { key: "visual_prompts", label: "Prompts Visuais" },
    { key: "images", label: "Imagens" },
  ],
  carousel: [
    { key: "strategy", label: "Estratégia" },
    { key: "carousel", label: "Carrossel" },
    { key: "caption", label: "Legenda" },
    { key: "visual_prompts", label: "Prompts Visuais" },
    { key: "images", label: "Imagens" },
  ],
};

export function ResultsView({
  content,
  isGeneratingImages,
  onBack,
  onRegenerate,
  onRegenerateImages,
  onRegenerateCaption,
  onRegenerateSlide,
}: ResultsViewProps) {
  const tabs = TAB_CONFIG[content.input.format];
  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();

  const handleSave = async () => {
    if (!user) {
      toast.error("Faça login para salvar na biblioteca");
      return;
    }
    setSaving(true);
    const title = content.reels?.title || content.carousel?.title || "Sem título";
    const { error } = await supabase.from("generations").insert([{
      title,
      format: content.input.format,
      niche: content.input.niche,
      content: content as unknown as Record<string, unknown>,
    }]);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      setSaved(true);
      toast.success("Salvo na biblioteca!");
    }
  };

  const caption = content.reels?.caption || content.carousel?.caption || "";
  const cta = content.reels?.cta || content.carousel?.cta || "";

  const visualPrompts = content.carousel
    ? content.carousel.slides.map((s) => s.visual_prompt)
    : content.reels?.scene_suggestions || [];

  const promptLabels = content.carousel
    ? content.carousel.slides.map((s) => `Slide ${s.slide_number}`)
    : visualPrompts.map((_, i) => `Cena ${i + 1}`);

  const images = content.carousel
    ? content.carousel.slides.map((s) => ({ label: `Slide ${s.slide_number}`, url: s.image_url }))
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Nova geração
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-1.5 border-border text-foreground">
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerar tudo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-border text-foreground"
            onClick={handleSave}
            disabled={saving || saved}
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {saved ? "Salvo" : saving ? "Salvando..." : "Salvar"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 border-border text-foreground">
            <Download className="w-3.5 h-3.5" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-2xl font-display font-bold">
          {content.reels?.title || content.carousel?.title || "Conteúdo Gerado"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {content.input.format === "reels" ? "Reels" : "Carrossel"} · {content.input.niche}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "strategy" && <StrategyTab strategy={content.strategy} />}
        {activeTab === "reels" && content.reels && <ReelsTab reels={content.reels} />}
        {activeTab === "carousel" && content.carousel && (
          <CarouselTab carousel={content.carousel} onRegenerateSlide={onRegenerateSlide} />
        )}
        {activeTab === "caption" && <CaptionTab caption={caption} cta={cta} />}
        {activeTab === "visual_prompts" && (
          <VisualPromptsTab prompts={visualPrompts} labels={promptLabels} />
        )}
        {activeTab === "images" && (
          <ImagesTab
            images={images}
            isLoading={isGeneratingImages}
            onRegenerateAll={onRegenerateImages}
            onRegenerateSingle={onRegenerateSlide ? (i) => onRegenerateSlide(i + 1) : undefined}
          />
        )}
      </div>
    </motion.div>
  );
}
