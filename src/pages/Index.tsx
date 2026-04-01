import { useState } from "react";
import { GenerationForm } from "@/components/GenerationForm";
import { ResultsView } from "@/components/ResultsView";
import { useContentGeneration } from "@/hooks/useContentGeneration";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut, Users, BookOpen, Zap, ClipboardPaste, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ContentInput,
  GeneratedContent,
  VisualStyle,
  VISUAL_STYLE_LABELS,
} from "@/types/content";

const Index = () => {
  const { isAdmin, signOut } = useAuth();
  const {
    isGenerating,
    isGeneratingImages,
    result,
    generate,
    setResult,
    regenerateImages,
    regenerateCaption,
    regenerateSlide,
  } = useContentGeneration();

  const [mode, setMode] = useState<"generate" | "paste">("generate");
  const [pasteJson, setPasteJson] = useState("");
  const [pasteGenerateImages, setPasteGenerateImages] = useState(true);
  const [pasteVisualStyle, setPasteVisualStyle] = useState<VisualStyle>("clean_realistic");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteLoadingImages, setPasteLoadingImages] = useState(false);

  const handleLoadPasted = async () => {
    setPasteError(null);
    try {
      const parsed = JSON.parse(pasteJson);

      if (!parsed.strategy) {
        setPasteError("JSON inválido: campo 'strategy' é obrigatório.");
        return;
      }
      if (!parsed.carousel && !parsed.reels) {
        setPasteError("JSON inválido: é necessário ter 'carousel' ou 'reels'.");
        return;
      }

      const format = parsed.carousel ? "carousel" : "reels";

      const content: GeneratedContent = {
        input: {
          idea: "",
          format: format as any,
          goal: "discovery",
          awareness: "cold",
          tone: "reflective",
          niche: "",
          cards: parsed.carousel?.slides?.length || 5,
          generate_images: pasteGenerateImages,
          visual_style: pasteVisualStyle,
          ai_provider: "google",
        },
        strategy: parsed.strategy,
        carousel: parsed.carousel || undefined,
        reels: parsed.reels || undefined,
        generated_at: new Date().toISOString(),
      };

      setResult(content);
      toast.success("Conteúdo carregado com sucesso!");

      // Generate images if toggle is on and there are visual prompts
      if (pasteGenerateImages) {
        const prompts: string[] = [];
        if (content.carousel) {
          prompts.push(...content.carousel.slides.map((s) => s.visual_prompt).filter(Boolean));
        } else if (content.reels?.scene_suggestions) {
          prompts.push(...content.reels.scene_suggestions.filter(Boolean));
        }

        if (prompts.length > 0) {
          setPasteLoadingImages(true);
          toast.info("Gerando imagens... isso pode levar alguns segundos.");
          try {
            const { data, error: fnError } = await supabase.functions.invoke("generate-images", {
              body: { prompts, visual_style: pasteVisualStyle },
            });
            if (fnError) throw new Error(fnError.message);

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
            }
            setResult(updated);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao gerar imagens");
          } finally {
            setPasteLoadingImages(false);
          }
        }
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        setPasteError("JSON inválido. Verifique a formatação e tente novamente.");
      } else {
        setPasteError(e instanceof Error ? e.message : "Erro ao processar JSON.");
      }
    }
  };

  const topBar = (
    <div className="max-w-4xl mx-auto flex items-center justify-end gap-2 mb-4 px-4">
      {isAdmin && (
        <Link to="/admin/users">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            Usuários
          </Button>
        </Link>
      )}
      <Link to="/content-engine">
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <Zap className="w-4 h-4" />
          Content Engine
        </Button>
      </Link>
      <Link to="/library">
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <BookOpen className="w-4 h-4" />
          Biblioteca
        </Button>
      </Link>
      <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground">
        <LogOut className="w-4 h-4" />
        Sair
      </Button>
    </div>
  );

  if (result) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        {topBar}
        <ResultsView
          content={result}
          isGeneratingImages={isGeneratingImages || pasteLoadingImages}
          onBack={() => setResult(null)}
          onRegenerate={() => generate(result.input)}
          onRegenerateImages={regenerateImages}
          onRegenerateCaption={regenerateCaption}
          onRegenerateSlide={regenerateSlide}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      {topBar}

      {/* Mode tabs */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg w-fit mx-auto">
          <button
            onClick={() => setMode("generate")}
            className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              mode === "generate"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Gerar
          </button>
          <button
            onClick={() => setMode("paste")}
            className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              mode === "paste"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            Colar Conteúdo
          </button>
        </div>
      </div>

      {mode === "generate" ? (
        <GenerationForm onSubmit={generate} isGenerating={isGenerating} />
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-display font-bold">Colar Conteúdo</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cole o JSON gerado pelo Claude e visualize o resultado
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                JSON do Conteúdo
              </Label>
              <Textarea
                value={pasteJson}
                onChange={(e) => setPasteJson(e.target.value)}
                placeholder='Cole aqui o JSON gerado pelo Claude...'
                rows={14}
                className="font-mono text-xs bg-secondary border-border resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Estilo Visual (para imagens)
                </Label>
                <Select value={pasteVisualStyle} onValueChange={(v) => setPasteVisualStyle(v as VisualStyle)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(VISUAL_STYLE_LABELS) as [VisualStyle, string][]).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end pb-1">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={pasteGenerateImages}
                    onCheckedChange={setPasteGenerateImages}
                  />
                  <Label className="text-sm text-muted-foreground">Gerar imagens automaticamente</Label>
                </div>
              </div>
            </div>

            {pasteError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive">
                {pasteError}
              </div>
            )}

            <Button
              onClick={handleLoadPasted}
              disabled={!pasteJson.trim()}
              className="w-full gap-2"
              size="lg"
            >
              <ClipboardPaste className="w-4 h-4" />
              Carregar Conteúdo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
