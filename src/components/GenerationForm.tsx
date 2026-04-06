import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ContentInput,
  ContentFormat,
  ContentGoal,
  AudienceAwareness,
  ContentTone,
  VisualStyle,
  AIModel,
  GOAL_LABELS,
  AWARENESS_LABELS,
  TONE_LABELS,
  VISUAL_STYLE_LABELS,
  AI_MODEL_LABELS,
  AI_MODEL_INFO,
} from "@/types/content";

interface GenerationFormProps {
  onSubmit: (input: ContentInput) => void;
  isGenerating: boolean;
}

export function GenerationForm({ onSubmit, isGenerating }: GenerationFormProps) {
  const [idea, setIdea] = useState("");
  const [format, setFormat] = useState<ContentFormat>("carousel");
  const [goal, setGoal] = useState<ContentGoal>("discovery");
  const [awareness, setAwareness] = useState<AudienceAwareness>("cold");
  const [tone, setTone] = useState<ContentTone>("calm_authority");
  const [niche, setNiche] = useState("");
  const [offer, setOffer] = useState("");
  const [cards, setCards] = useState(7);
  const [generateImages, setGenerateImages] = useState(false);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>("editorial_premium");
  const [aiModel, setAiModel] = useState<AIModel>("gemini-flash-lite");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || !niche.trim()) return;
    onSubmit({
      idea,
      format,
      goal,
      awareness,
      tone,
      niche,
      offer: offer || undefined,
      cards,
      generate_images: generateImages,
      visual_style: visualStyle,
      ai_provider: AI_MODEL_INFO[aiModel].provider,
      ai_model: aiModel,
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-8 max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="text-center space-y-3 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary tracking-wide uppercase">Motor de Conteúdo</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Content Engine <span className="text-primary">MASTER</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Transforme uma ideia bruta em conteúdo estratégico completo para redes sociais.
        </p>
      </div>

      {/* Idea */}
      <div className="space-y-2">
        <Label htmlFor="idea" className="text-sm font-medium text-foreground/80">
          Ideia Bruta *
        </Label>
        <Textarea
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Descreva sua ideia, insight, conceito ou tema..."
          className="min-h-[120px] bg-secondary border-border focus:border-primary/50 resize-none text-foreground placeholder:text-muted-foreground/50"
          required
        />
      </div>

      {/* Format + Goal Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground/80">Formato *</Label>
          <div className="grid grid-cols-2 gap-3">
            {(["reels", "carousel"] as ContentFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  format === f
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-secondary border-border text-muted-foreground hover:border-primary/20"
                }`}
              >
                {f === "reels" ? "Reels" : "Carrossel"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground/80">Objetivo *</Label>
          <Select value={goal} onValueChange={(v) => setGoal(v as ContentGoal)}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GOAL_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Awareness + Tone Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground/80">Consciência da Audiência *</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["cold", "warm", "hot"] as AudienceAwareness[]).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAwareness(a)}
                className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                  awareness === a
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-secondary border-border text-muted-foreground hover:border-primary/20"
                }`}
              >
                {AWARENESS_LABELS[a]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground/80">Tom Principal *</Label>
          <Select value={tone} onValueChange={(v) => setTone(v as ContentTone)}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TONE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Niche + Offer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="niche" className="text-sm font-medium text-foreground/80">
            Nicho / Contexto *
          </Label>
          <Input
            id="niche"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Ex: marketing digital, psicologia, fitness..."
            className="bg-secondary border-border"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer" className="text-sm font-medium text-foreground/80">
            Oferta Relacionada <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="offer"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="Ex: mentoria, curso, consultoria..."
            className="bg-secondary border-border"
          />
        </div>
      </div>

      {/* Carousel-specific: Cards count */}
      {format === "carousel" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <Label className="text-sm font-medium text-foreground/80">
            Número de Cards
          </Label>
          <div className="flex items-center gap-3">
            {[5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCards(n)}
                className={`w-10 h-10 rounded-lg border text-sm font-medium transition-all ${
                  cards === n
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-secondary border-border text-muted-foreground hover:border-primary/20"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Visual Style + Image Toggle */}
      <div className="card-premium p-5 space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground/80">Modelo de IA (Texto)</Label>
          <Select value={aiModel} onValueChange={(v) => setAiModel(v as AIModel)}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AI_MODEL_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium text-foreground/80">Gerar Imagens Automaticamente</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Usa Google Gemini para gerar visuais</p>
          </div>
          <Switch checked={generateImages} onCheckedChange={setGenerateImages} />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground/80">Estilo Visual</Label>
          <Select value={visualStyle} onValueChange={(v) => setVisualStyle(v as VisualStyle)}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VISUAL_STYLE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isGenerating || !idea.trim() || !niche.trim()}
        className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 glow-gold transition-all"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Gerando conteúdo MASTER...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Gerar Conteúdo MASTER
          </span>
        )}
      </Button>
    </motion.form>
  );
}
