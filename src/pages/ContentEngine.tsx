import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LogOut, Users, BookOpen, Zap, Copy, RefreshCw, ClipboardPaste, CheckCircle, ExternalLink, Home, LayoutGrid, Bookmark, Check, Sparkles, Minus, Plus, Loader2, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CreditBalance } from "@/components/CreditBalance";
import { estimateCost } from "@/hooks/useCredits";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FORMAT_MAP: Record<string, string> = { carrossel: "carousel", reels: "reels" };
const GOAL_MAP: Record<string, string> = { descoberta: "discovery", conexão: "connection", relacionamento: "relationship", conversão: "conversion" };
const AWARENESS_MAP: Record<string, string> = { frio: "cold", morno: "warm", quente: "hot" };
const TONE_MAP: Record<string, string> = { reflexivo: "reflective", confrontador: "confrontational", didático: "didactic", emocional: "emotional", "autoridade tranquila": "calm_authority", card: "card" };
const VISUAL_MAP: Record<string, string> = { "clean realista": "clean_realistic", "editorial premium": "editorial_premium", "humano e cotidiano": "human_everyday", "dramático cinematográfico": "dramatic_cinematic", "minimalista sofisticado": "minimal_sophisticated", "carrosseis thiago": "carrosseis_thiago" };

const GOAL_OPTIONS = [
  ["descoberta", "Descoberta"], ["conexão", "Conexão"], ["relacionamento", "Relacionamento"], ["conversão", "Conversão"],
] as const;

const TONE_OPTIONS = [
  ["reflexivo", "Reflexivo"], ["confrontador", "Confrontador"], ["didático", "Didático"], ["emocional", "Emocional"], ["autoridade tranquila", "Autoridade Tranquila"], ["card", "Card"],
] as const;

const VISUAL_STYLE_OPTIONS = [
  ["clean realista", "Clean Realista"], ["editorial premium", "Editorial Premium"], ["humano e cotidiano", "Humano e Cotidiano"], ["dramático cinematográfico", "Dramático Cinemático"], ["minimalista sofisticado", "Minimalista Sofisticado"], ["carrosseis thiago", "Carrosséis Thiago"],
] as const;

const AI_MODEL_OPTIONS = Object.entries(AI_MODEL_INFO).map(([key, info]) => {
  const cost = CREDIT_COSTS["generate-content"][key as keyof typeof CREDIT_COSTS["generate-content"]];
  const costLabel = cost === 0 ? "Grátis" : `${cost} créditos`;
  return [key, info.label, costLabel] as const;
});

interface FormState {
  idea: string;
  format: string;
  goal: string;
  awareness: string;
  tone: string;
  niche: string;
  offer: string;
  cards: string;
  generateImages: boolean;
  visualStyle: string;
  aiModel: string;
}

export default function ContentEngine() {
  const { isAdmin, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [canvaConnected, setCanvaConnected] = useState(false);
  const [canvaLoading, setCanvaLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (searchParams.get("canva") === "connected") {
      setCanvaConnected(true);
      toast.success("Canva conectado com sucesso!");
      searchParams.delete("canva");
      setSearchParams(searchParams, { replace: true });
      return;
    }
    supabase
      .from("canva_tokens")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setCanvaConnected(true); });
  }, [user]);

  const handleConnectCanva = async () => {
    setCanvaLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("canva-auth-url");
      if (error || !data?.url || !data?.code_verifier) { toast.error("Erro ao iniciar conexão com Canva."); return; }
      sessionStorage.setItem("canva_code_verifier", data.code_verifier);
      window.open(data.url, '_blank');
    } catch { toast.error("Erro ao conectar com Canva."); }
    finally { setCanvaLoading(false); }
  };

  const [form, setForm] = useState<FormState>({
    idea: "", format: "carrossel", goal: "descoberta",
    awareness: "frio", tone: "reflexivo", niche: "",
    offer: "", cards: "7", generateImages: false,
    visualStyle: "editorial premium", aiModel: "gemini-flash-lite",
  });

  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [images, setImages] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState("estrategia");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [regeneratingField, setRegeneratingField] = useState<string | null>(null);
  const [mode, setMode] = useState<"generate" | "paste">("generate");
  const [pasteJson, setPasteJson] = useState("");
  const [pasteGenerateImages, setPasteGenerateImages] = useState(false);
  const [pasteVisualStyle, setPasteVisualStyle] = useState("clean realista");

  // Restore state from sessionStorage when returning from Card Generator
  useEffect(() => {
    const savedResult = sessionStorage.getItem("content_engine_result");
    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult));
        const savedImages = sessionStorage.getItem("content_engine_images");
        if (savedImages) setImages(JSON.parse(savedImages));
        const savedForm = sessionStorage.getItem("content_engine_form");
        if (savedForm) setForm(JSON.parse(savedForm));
        const savedTab = sessionStorage.getItem("content_engine_tab");
        if (savedTab) setActiveTab(savedTab);
      } catch {}
      sessionStorage.removeItem("content_engine_result");
      sessionStorage.removeItem("content_engine_images");
      sessionStorage.removeItem("content_engine_form");
      sessionStorage.removeItem("content_engine_tab");
    }
  }, []);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copiado!"); };

  const updateSlide = (slideNumber: number, field: string, value: string) => {
    if (!result?.carousel?.slides) return;
    const updated = {
      ...result,
      carousel: {
        ...result.carousel,
        slides: result.carousel.slides.map((s: any) =>
          s.slide_number === slideNumber ? { ...s, [field]: value } : s
        ),
      },
    };
    setResult(updated);
  };

  const handleRegenerateField = async (slideNumber: number, field: string, action: string) => {
    const slide = result?.carousel?.slides?.find((s: any) => s.slide_number === slideNumber);
    if (!slide) return;
    const key = `${slideNumber}-${field}-${action}`;
    setRegeneratingField(key);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("regenerate-field", {
        body: {
          field,
          action,
          slide,
          strategy: result.strategy,
          tone: TONE_MAP[form.tone] || form.tone,
          niche: form.niche,
          ai_model: form.aiModel,
        },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (data?.value) {
        updateSlide(slideNumber, field, data.value);
        toast.success("Campo atualizado!");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao regenerar campo.");
    } finally {
      setRegeneratingField(null);
    }
  };

  const handleLoadPasted = () => {
    try {
      const parsed = JSON.parse(pasteJson.trim());
      if (!parsed.strategy || (!parsed.carousel && !parsed.reels)) {
        setError("JSON inválido: precisa ter 'strategy' e 'carousel' ou 'reels'.");
        return;
      }
      const detectedFormat = parsed.carousel ? "carrossel" : "reels";
      set("format", detectedFormat);
      setResult(parsed); setImages({}); setActiveTab("estrategia"); setError("");
      toast.success("Conteúdo carregado com sucesso!");
      if (pasteGenerateImages && parsed.carousel?.slides) {
        const hasPrompts = parsed.carousel.slides.some((s: any) => s.visual_prompt);
        if (hasPrompts) handleGenerateImagesForPaste(parsed.carousel.slides);
      }
    } catch { setError("JSON inválido. Verifique o formato e tente novamente."); }
  };

  const handleGenerateImagesForPaste = async (slides: any[]) => {
    setLoadingImages(true);
    const prompts = slides.map((s: any) => s.visual_prompt).filter(Boolean);
    if (prompts.length === 0) { setLoadingImages(false); return; }
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-images", {
        body: { prompts, visual_style: VISUAL_MAP[pasteVisualStyle] || pasteVisualStyle },
      });
      if (fnError) throw new Error(fnError.message);
      const urls: (string | null)[] = data?.urls || [];
      const newImages: Record<number, string> = {};
      slides.forEach((s: any, i: number) => { if (urls[i]) newImages[s.slide_number] = urls[i]!; });
      setImages(newImages);
      const count = Object.keys(newImages).length;
      if (count > 0) toast.success(`${count} imagem(ns) gerada(s)!`);
      else toast.warning("Não foi possível gerar imagens.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao gerar imagens."); }
    finally { setLoadingImages(false); }
  };

  const handleGenerate = async () => {
    if (!form.idea.trim()) { setError("Digite uma ideia."); return; }
    setError(""); setLoading(true); setResult(null); setImages({}); setSaved(false);
    try {
      const body = {
        idea: form.idea, format: FORMAT_MAP[form.format] || form.format,
        goal: GOAL_MAP[form.goal] || form.goal, awareness: AWARENESS_MAP[form.awareness] || form.awareness,
        tone: TONE_MAP[form.tone] || form.tone, niche: form.niche, offer: form.offer,
        cards: parseInt(form.cards), generate_images: false,
        visual_style: VISUAL_MAP[form.visualStyle] || form.visualStyle, ai_model: form.aiModel,
      };
      const { data, error: fnError } = await supabase.functions.invoke("generate-content", { body });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) {
        if (data.error === "RATE_LIMITED") throw new Error("Limite de requisições atingido. Aguarde e tente novamente.");
        if (data.error === "PAYMENT_REQUIRED") throw new Error("Créditos de IA esgotados.");
        if (data.error === "INSUFFICIENT_CREDITS") throw new Error("Créditos insuficientes. Recarregue seu saldo.");
        throw new Error(data.error);
      }
      setResult(data); setActiveTab("estrategia");
      toast.success("Conteúdo gerado com sucesso!");
      if (form.generateImages && form.format === "carrossel" && data.carousel?.slides) {
        handleGenerateImages(data.carousel.slides);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar conteúdo.";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleGenerateImages = async (slides: any[]) => {
    setLoadingImages(true);
    const prompts = slides.map((s: any) => s.visual_prompt).filter(Boolean);
    if (prompts.length === 0) { setLoadingImages(false); return; }
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-images", {
        body: { prompts, visual_style: VISUAL_MAP[form.visualStyle] || form.visualStyle },
      });
      if (fnError) throw new Error(fnError.message);
      const urls: (string | null)[] = data?.urls || [];
      const newImages: Record<number, string> = {};
      slides.forEach((s: any, i: number) => { if (urls[i]) newImages[s.slide_number] = urls[i]!; });
      setImages(newImages);
      const count = Object.keys(newImages).length;
      if (count > 0) toast.success(`${count} imagem(ns) gerada(s)!`);
      else toast.warning("Não foi possível gerar imagens.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao gerar imagens."); }
    finally { setLoadingImages(false); }
  };

  const handleRegenerateSlide = async (slide: any) => {
    setImages((prev) => ({ ...prev, [slide.slide_number]: "loading" }));
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-images", {
        body: { prompts: [slide.visual_prompt], visual_style: VISUAL_MAP[form.visualStyle] || form.visualStyle },
      });
      if (fnError) throw new Error(fnError.message);
      const url = data?.urls?.[0];
      if (url) { setImages((prev) => ({ ...prev, [slide.slide_number]: url })); toast.success(`Imagem do slide ${slide.slide_number} regenerada!`); }
      else { setImages((prev) => ({ ...prev, [slide.slide_number]: "error" })); toast.warning("Não foi possível regenerar."); }
    } catch { setImages((prev) => ({ ...prev, [slide.slide_number]: "error" })); toast.error("Erro ao regenerar imagem."); }
  };

  const tabs = result
    ? ["estrategia", form.format === "reels" ? "reels" : "carrossel", "legenda", "prompts", "imagens"]
    : [];

  const tabLabels: Record<string, string> = {
    estrategia: "Estratégia", reels: "Reels", carrossel: "Carrossel",
    legenda: "Legenda", prompts: "Prompts Visuais", imagens: "Imagens",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Content Engine <span className="text-primary">MASTER</span></span>
            <CreditBalance />
          </div>

          <nav className="flex items-center gap-1">
            <Link to="/app">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs h-8">
                <Home className="w-3.5 h-3.5" /> Dashboard
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin/users">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs h-8">
                  <Users className="w-3.5 h-3.5" /> Usuários
                </Button>
              </Link>
            )}
            <Link to="/library">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs h-8">
                <BookOpen className="w-3.5 h-3.5" /> Biblioteca
              </Button>
            </Link>
            <Link to="/usage">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs h-8">
                <Coins className="w-3.5 h-3.5" /> Uso
              </Button>
            </Link>
            {canvaConnected ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 h-8 text-emerald-500 dark:text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> Canva
              </span>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleConnectCanva} disabled={canvaLoading}
                className="gap-1.5 text-muted-foreground text-xs h-8">
                <ExternalLink className="w-3.5 h-3.5" />
                {canvaLoading ? "Conectando..." : "Conectar Canva"}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-muted-foreground text-xs h-8">
              <LogOut className="w-3.5 h-3.5" /> Sair
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Show form when no result and not loading */}
        {!result && !loading && (
          <>
            {/* Mode tabs */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex border border-border rounded-lg overflow-hidden">
                <button onClick={() => setMode("generate")}
                  className={`px-5 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors ${mode === "generate" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
                  <Zap className="w-4 h-4" /> Gerar
                </button>
                <button onClick={() => setMode("paste")}
                  className={`px-5 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors ${mode === "paste" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
                  <ClipboardPaste className="w-4 h-4" /> Colar Conteúdo
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary tracking-wide uppercase">Motor de Conteúdo</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Content Engine <span className="text-primary">MASTER</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                Transforme uma ideia bruta em conteúdo estratégico completo para redes sociais.
              </p>
            </div>

            {mode === "generate" ? (
              <div className="space-y-6">
                {/* Ideia Bruta */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Ideia Bruta *</label>
                  <textarea value={form.idea} onChange={(e) => set("idea", e.target.value)}
                    placeholder="Descreva sua ideia, insight, conceito ou tema..."
                    rows={4}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50" />
                </div>

                {/* Formato + Objetivo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Formato *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[["reels", "Reels"], ["carrossel", "Carrossel"]].map(([val, label]) => (
                        <button key={val} type="button" onClick={() => set("format", val)}
                          className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${form.format === val
                            ? "bg-primary/15 border-primary/40 text-primary"
                            : "bg-secondary border-border text-muted-foreground hover:border-primary/20"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Objetivo *</label>
                    <Select value={form.goal} onValueChange={(v) => set("goal", v)}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GOAL_OPTIONS.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Consciência + Tom */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Consciência da Audiência *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[["frio", "Frio"], ["morno", "Morno"], ["quente", "Quente"]].map(([val, label]) => (
                        <button key={val} type="button" onClick={() => set("awareness", val)}
                          className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${form.awareness === val
                            ? "bg-primary/15 border-primary/40 text-primary"
                            : "bg-secondary border-border text-muted-foreground hover:border-primary/20"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Tom Principal *</label>
                    <Select value={form.tone} onValueChange={(v) => set("tone", v)}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TONE_OPTIONS.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Nicho + Oferta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Nicho / Contexto *</label>
                    <input value={form.niche} onChange={(e) => set("niche", e.target.value)}
                      placeholder="Ex: marketing digital, psicologia, fitness..."
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Oferta Relacionada <span className="text-muted-foreground">(opcional)</span></label>
                    <input value={form.offer} onChange={(e) => set("offer", e.target.value)}
                      placeholder="Ex: mentoria, curso, consultoria..."
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50" />
                  </div>
                </div>

                {/* Cards count (carousel only) */}
                {form.format === "carrossel" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Número de Cards</label>
                    <div className="flex items-center gap-3">
                      {["5", "6", "7", "8", "9", "10"].map((n) => (
                        <button key={n} type="button" onClick={() => set("cards", n)}
                          className={`w-10 h-10 rounded-lg border text-sm font-medium transition-all ${form.cards === n
                            ? "bg-primary/15 border-primary/40 text-primary"
                            : "bg-secondary border-border text-muted-foreground hover:border-primary/20"}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Settings Card */}
                <div className="border border-border rounded-xl p-5 space-y-5 bg-card">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Modelo de IA (Texto)</label>
                    <Select value={form.aiModel} onValueChange={(v) => set("aiModel", v)}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AI_MODEL_OPTIONS.map(([k, label, cost]) => <SelectItem key={k} value={k}>{label} — {cost}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-foreground/80">Gerar Imagens Automaticamente</label>
                      <p className="text-xs text-muted-foreground mt-0.5">Usa Google Gemini para gerar visuais</p>
                    </div>
                    <Switch checked={form.generateImages} onCheckedChange={(v) => set("generateImages", v)} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">Estilo Visual</label>
                    <Select value={form.visualStyle} onValueChange={(v) => set("visualStyle", v)}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VISUAL_STYLE_OPTIONS.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cost estimation */}
                {(() => {
                  const cost = estimateCost(
                    form.aiModel,
                    form.generateImages && form.format === "carrossel",
                    parseInt(form.cards) || 7
                  );
                  return cost > 0 ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                      <Coins className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-foreground/80">
                        Esta geração vai custar <strong className="text-primary">{cost} créditos</strong>
                        {form.generateImages && form.format === "carrossel" && (
                          <span className="text-muted-foreground"> (texto: {estimateCost(form.aiModel, false, 0)} + imagens: {(parseInt(form.cards) || 7) * 36})</span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-sm">
                      <Coins className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-foreground/80">
                        Geração de texto <strong className="text-emerald-500">gratuita</strong> com Google Gemini
                        {form.generateImages && form.format === "carrossel" && (
                          <span className="text-muted-foreground"> + imagens: <strong className="text-primary">{(parseInt(form.cards) || 7) * 36} créditos</strong></span>
                        )}
                      </span>
                    </div>
                  );
                })()}

                {error && <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive">{error}</div>}

                {/* Submit */}
                <Button onClick={handleGenerate} disabled={loading || !form.idea.trim()}
                  className="w-full h-14 text-base font-semibold gap-2">
                  <Zap className="w-5 h-5" /> Gerar Conteúdo MASTER
                </Button>
              </div>
            ) : (
              /* Paste mode */
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">JSON do Conteúdo</label>
                  <textarea value={pasteJson} onChange={(e) => setPasteJson(e.target.value)}
                    placeholder="Cole aqui o JSON gerado pelo Claude..."
                    rows={12}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Estilo Visual (para imagens)</label>
                  <Select value={pasteVisualStyle} onValueChange={setPasteVisualStyle}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VISUAL_STYLE_OPTIONS.map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground/80">Gerar imagens automaticamente</label>
                    <p className="text-xs text-muted-foreground mt-0.5">Gera imagens ao carregar o conteúdo</p>
                  </div>
                  <Switch checked={pasteGenerateImages} onCheckedChange={setPasteGenerateImages} />
                </div>

                {error && <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive">{error}</div>}

                <Button onClick={handleLoadPasted} disabled={!pasteJson.trim()} className="w-full h-14 text-base font-semibold gap-2">
                  <ClipboardPaste className="w-5 h-5" /> Carregar Conteúdo
                </Button>
              </div>
            )}
          </>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center flex-col gap-4 py-24">
            <div className="w-10 h-10 rounded-full border-2 border-border border-t-primary animate-spin" />
            <div className="text-muted-foreground text-sm">Construindo estratégia e conteúdo...</div>
          </div>
        )}
      </main>

      {/* Results — full width */}
      {result && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
          {/* Result tabs */}
          <div className="border-b border-border flex gap-1 mb-6 overflow-x-auto">
            {tabs.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {tabLabels[t] || t}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {result.carousel?.slides && (
                <Button variant="secondary" size="sm" className="text-xs h-8 gap-1.5"
                  onClick={() => {
                    localStorage.setItem("card_generator_slides", JSON.stringify(result.carousel.slides));
                    if (Object.keys(images).length > 0) {
                      localStorage.setItem("card_generator_images", JSON.stringify(images));
                    }
                    sessionStorage.setItem("content_engine_result", JSON.stringify(result));
                    sessionStorage.setItem("content_engine_images", JSON.stringify(images));
                    sessionStorage.setItem("content_engine_form", JSON.stringify(form));
                    sessionStorage.setItem("content_engine_tab", activeTab);
                    navigate("/card-generator");
                  }}>
                  <LayoutGrid className="w-3.5 h-3.5" /> Criar Cards Visuais
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="text-xs h-8 gap-1.5"
                disabled={saving || saved}
                onClick={async () => {
                  if (!user) { toast.error("Faça login para salvar"); return; }
                  setSaving(true);
                  const title = result.carousel?.title || result.reels?.title || "Sem título";
                  const { error: saveErr } = await supabase.from("generations").insert([{
                    title,
                    format: form.format === "carrossel" ? "carousel" : form.format,
                    niche: form.niche,
                    content: JSON.parse(JSON.stringify(result)),
                  }]);
                  setSaving(false);
                  if (saveErr) { toast.error("Erro ao salvar: " + saveErr.message); }
                  else { setSaved(true); toast.success("Salvo na biblioteca!"); }
                }}
              >
                {saved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                {saved ? "Salvo" : saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setResult(null); setImages({}); setSaved(false); }}
                className="text-xs text-muted-foreground h-8">
                ← Nova geração
              </Button>
            </div>
          </div>

          {/* Estratégia */}
          {activeTab === "estrategia" && result.strategy && (
            <div className="grid gap-4">
              {[
                { label: "💡 Big Idea", value: result.strategy.big_idea },
                { label: "🔥 Dor/Desejo/Tensão", value: result.strategy.pain_desire_tension },
                { label: "🎯 Tipo de Lead", value: result.strategy.lead_type },
                { label: "📐 Ângulo", value: result.strategy.angle },
                { label: "✨ Promessa", value: result.strategy.promise },
                { label: "🚀 Estratégia de CTA", value: result.strategy.cta_strategy },
              ].filter((i) => i.value).map(({ label, value }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</div>
                  <div className="text-sm leading-relaxed">{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Reels */}
          {activeTab === "reels" && result.reels && (
            <div className="grid gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">{result.reels.title}</h2>
                <Button variant="secondary" size="sm" className="gap-1" onClick={() => copy(result.reels.script)}>
                  <Copy className="w-3 h-3" /> Copiar Roteiro
                </Button>
              </div>
              {[
                { label: "🎣 Hook", value: result.reels.hook },
                { label: "📝 Roteiro", value: result.reels.script },
                { label: "📱 Texto na Tela", value: result.reels.on_screen_text?.join("\n") },
                { label: "🎬 Cenas", value: result.reels.scene_suggestions?.join("\n") },
                { label: "✂️ Edição", value: result.reels.editing_notes },
              ].filter((i) => i.value).map(({ label, value }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Carrossel */}
          {activeTab === "carrossel" && result.carousel && (
            <div className="grid gap-4">
              <h2 className="text-lg font-bold">{result.carousel.title}</h2>
              {result.carousel.slides?.map((slide: any) => (
                <div key={slide.slide_number} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">{slide.slide_number}</div>
                    <div className="text-xs text-primary uppercase tracking-wider">{slide.role}</div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Título</label>
                        <Button
                          variant="ghost" size="sm"
                          className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                          disabled={!!regeneratingField}
                          onClick={() => handleRegenerateField(slide.slide_number, "title", "regenerate")}
                        >
                          {regeneratingField === `${slide.slide_number}-title-regenerate` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Regerar
                        </Button>
                      </div>
                      <input
                        className="w-full bg-secondary border border-border rounded-md px-2.5 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                        value={slide.title}
                        onChange={(e) => updateSlide(slide.slide_number, "title", e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Corpo</label>
                        <Button
                          variant="ghost" size="sm"
                          className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                          disabled={!!regeneratingField}
                          onClick={() => handleRegenerateField(slide.slide_number, "body", "regenerate")}
                        >
                          {regeneratingField === `${slide.slide_number}-body-regenerate` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Regerar
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                          disabled={!!regeneratingField}
                          onClick={() => handleRegenerateField(slide.slide_number, "body", "shorten")}
                        >
                          {regeneratingField === `${slide.slide_number}-body-shorten` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Minus className="w-3 h-3" />}
                          Encurtar
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                          disabled={!!regeneratingField}
                          onClick={() => handleRegenerateField(slide.slide_number, "body", "lengthen")}
                        >
                          {regeneratingField === `${slide.slide_number}-body-lengthen` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Alongar
                        </Button>
                      </div>
                      <textarea
                        className="w-full bg-secondary border border-border rounded-md px-2.5 py-1.5 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        rows={3}
                        value={slide.body}
                        onChange={(e) => updateSlide(slide.slide_number, "body", e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Prompt Visual</label>
                        <Button
                          variant="ghost" size="sm"
                          className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                          disabled={!!regeneratingField}
                          onClick={() => handleRegenerateField(slide.slide_number, "visual_prompt", "regenerate")}
                        >
                          {regeneratingField === `${slide.slide_number}-visual_prompt-regenerate` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Regerar
                        </Button>
                      </div>
                      <textarea
                        className="w-full bg-secondary border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-muted-foreground leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        rows={2}
                        value={slide.visual_prompt}
                        onChange={(e) => updateSlide(slide.slide_number, "visual_prompt", e.target.value)}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground italic">🎯 {slide.emotional_goal}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legenda */}
          {activeTab === "legenda" && (
            <div className="grid gap-4">
              {[
                { label: "📝 Legenda", value: result.carousel?.caption || result.reels?.caption },
                { label: "🔥 CTA", value: result.carousel?.cta || result.reels?.cta },
              ].filter((i) => i.value).map(({ label, value }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
                    <Button variant="secondary" size="sm" className="gap-1 h-7" onClick={() => copy(value!)}>
                      <Copy className="w-3 h-3" /> Copiar
                    </Button>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Prompts Visuais */}
          {activeTab === "prompts" && (
            <div className="grid gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-muted-foreground">Prompts para geração de imagem</h3>
                <Button variant="secondary" size="sm" className="gap-1" onClick={() => {
                  const allPrompts = (result.carousel?.slides || result.reels?.scene_suggestions || [])
                    .map((s: any, i: number) => s.visual_prompt ? `Card ${s.slide_number || i + 1}: ${s.visual_prompt}` : s)
                    .join("\n\n");
                  copy(allPrompts);
                }}>
                  <Copy className="w-3 h-3" /> Copiar Todos
                </Button>
              </div>
              {result.carousel?.slides?.map((slide: any) => (
                <div key={slide.slide_number} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs font-semibold text-primary">Card {slide.slide_number} — {slide.role}</div>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={() => copy(slide.visual_prompt)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <textarea
                    className="w-full bg-secondary border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-muted-foreground leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={3}
                    value={slide.visual_prompt}
                    onChange={(e) => updateSlide(slide.slide_number, "visual_prompt", e.target.value)}
                  />
                </div>
              ))}
              {form.format === "reels" && result.reels?.scene_suggestions?.map((scene: string, i: number) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs font-semibold text-primary">Cena {i + 1}</div>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={() => copy(scene)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{scene}</div>
                </div>
              ))}
              <Button
                className="w-full gap-2 mt-2"
                onClick={() => {
                  const allPrompts = (result.carousel?.slides || result.reels?.scene_suggestions || [])
                    .map((s: any, i: number) => s.visual_prompt ? `Card ${s.slide_number || i + 1}: ${s.visual_prompt}` : s)
                    .join("\n\n");
                   window.open("https://gemini.google.com/gem/1Jh27NXowbrFiqCzDx6YvO_6UfQiTMuQt", "_blank");
                   copy(allPrompts);
                   toast.success("Prompts copiados! Cole no Gemini (Ctrl+V)");
                }}
              >
                <Sparkles className="w-4 h-4" />
                Gerar imagens no Gemini
              </Button>
            </div>
          )}

          {/* Imagens */}
          {activeTab === "imagens" && (
            <div>
              {loadingImages && (
                <div className="flex items-center gap-3 mb-4 bg-card border border-border rounded-xl p-4">
                  <div className="w-4 h-4 rounded-full border-2 border-border border-t-primary animate-spin flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">Gerando imagens...</div>
                </div>
              )}
              <div className="flex justify-end mb-4">
                {result.carousel?.slides && (
                  <Button variant="secondary" size="sm" onClick={() => handleGenerateImages(result.carousel.slides)} className="gap-1.5 text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Gerar Todas
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {result.carousel?.slides?.map((slide: any) => {
                  const img = images[slide.slide_number];
                  return (
                    <div key={slide.slide_number} className="bg-card border border-border rounded-xl overflow-hidden">
                      <div className="aspect-square bg-background flex items-center justify-center">
                        {img === "loading" ? (
                          <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin" />
                        ) : img === "error" ? (
                          <div className="text-destructive text-xs text-center p-2">❌ Erro</div>
                        ) : img ? (
                          <img src={img} alt={`Card ${slide.slide_number}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-muted-foreground text-2xl">🖼️</div>
                        )}
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-semibold text-primary mb-1">Card {slide.slide_number}</div>
                        <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{slide.title}</div>
                        <Button variant="secondary" size="sm" className="w-full gap-1 h-7 text-xs" onClick={() => handleRegenerateSlide(slide)}>
                          <RefreshCw className="w-3 h-3" /> {img && img !== "loading" && img !== "error" ? "Regenerar" : "Gerar"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
