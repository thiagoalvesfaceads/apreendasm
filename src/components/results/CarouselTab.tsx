import { motion } from "framer-motion";
import { renderMarkdownBold } from "@/lib/formatText";
import { CarouselContent as CarouselData, CarouselSlide } from "@/types/content";
import { RefreshCw } from "lucide-react";

interface CarouselTabProps {
  carousel: CarouselData;
  onRegenerateSlide?: (slideNumber: number) => void;
}

const ROLE_LABELS: Record<string, string> = {
  hook: "HOOK",
  tension: "TENSÃO",
  insight: "INSIGHT",
  solution: "SOLUÇÃO",
  cta: "CTA",
  development: "DESENVOLVIMENTO",
  deepening: "APROFUNDAMENTO",
};

const ROLE_COLORS: Record<string, string> = {
  hook: "border-yellow-500/30 bg-yellow-500/5",
  tension: "border-red-500/30 bg-red-500/5",
  insight: "border-blue-500/30 bg-blue-500/5",
  solution: "border-green-500/30 bg-green-500/5",
  cta: "border-primary/30 bg-primary/5",
  development: "border-purple-500/30 bg-purple-500/5",
  deepening: "border-cyan-500/30 bg-cyan-500/5",
};

export function CarouselTab({ carousel, onRegenerateSlide }: CarouselTabProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="card-premium p-5">
        <span className="text-xs font-medium text-primary uppercase tracking-wider">Título do Carrossel</span>
        <h3 className="text-lg font-semibold text-foreground mt-2">{carousel.title}</h3>
      </div>

      {/* Slides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {carousel.slides.map((slide, i) => (
          <motion.div
            key={slide.slide_number}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-lg border p-5 space-y-3 ${ROLE_COLORS[slide.role] || "card-premium"}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">#{slide.slide_number}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                  {ROLE_LABELS[slide.role] || slide.role}
                </span>
              </div>
              {onRegenerateSlide && (
                <button
                  onClick={() => onRegenerateSlide(slide.slide_number)}
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 text-[10px]"
                  title="Regenerar imagem · 80 cr"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>· 80 cr</span>
                </button>
              )}
            </div>
            {slide.image_url && (
              <div className="rounded-md overflow-hidden aspect-video">
                <img src={slide.image_url} alt={`Slide ${slide.slide_number}`} className="w-full h-full object-cover" />
              </div>
            )}
            <h4 className="text-sm font-semibold text-foreground">{renderMarkdownBold(slide.title)}</h4>
            <p className="text-xs text-foreground/75 leading-relaxed whitespace-pre-wrap">{renderMarkdownBold(slide.body)}</p>
            <div className="pt-2 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Objetivo Emocional</span>
              <p className="text-xs text-foreground/60 mt-0.5">{slide.emotional_goal}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
