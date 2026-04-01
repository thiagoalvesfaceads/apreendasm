import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LogOut, Users, BookOpen, Zap, Copy, RefreshCw, ArrowLeft, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";

// Maps PT-BR form values → EN values expected by edge functions
const FORMAT_MAP: Record<string, string> = { carrossel: "carousel", reels: "reels" };
const GOAL_MAP: Record<string, string> = { descoberta: "discovery", conexão: "connection", relacionamento: "relationship", conversão: "conversion" };
const AWARENESS_MAP: Record<string, string> = { frio: "cold", morno: "warm", quente: "hot" };
const TONE_MAP: Record<string, string> = { reflexivo: "reflective", confrontador: "confrontational", didático: "didactic", emocional: "emotional", "autoridade tranquila": "calm_authority" };
const VISUAL_MAP: Record<string, string> = { "clean realista": "clean_realistic", "editorial premium": "editorial_premium", "humano e cotidiano": "human_everyday", "dramático cinematográfico": "dramatic_cinematic", "minimalista sofisticado": "minimal_sophisticated" };

const SELECT_FIELDS = [
  { label: "Formato", key: "format", options: [["carrossel", "Carrossel"], ["reels", "Reels"]] },
  { label: "Objetivo", key: "goal", options: [["descoberta", "Descoberta"], ["conexão", "Conexão"], ["relacionamento", "Relacionamento"], ["conversão", "Conversão"]] },
  { label: "Consciência", key: "awareness", options: [["frio", "Frio"], ["morno", "Morno"], ["quente", "Quente"]] },
  { label: "Tom", key: "tone", options: [["reflexivo", "Reflexivo"], ["confrontador", "Confrontador"], ["didático", "Didático"], ["emocional", "Emocional"], ["autoridade tranquila", "Autoridade Tranquila"]] },
  { label: "Estilo Visual", key: "visualStyle", options: [["clean realista", "Clean Realista"], ["editorial premium", "Editorial Premium"], ["humano e cotidiano", "Humano e Cotidiano"], ["dramático cinematográfico", "Dramático Cinemático"], ["minimalista sofisticado", "Minimalista Sofisticado"]] },
  { label: "Modelo de IA", key: "aiProvider", options: [["google", "Google Gemini"], ["openai", "OpenAI GPT-4o"], ["anthropic", "Claude Sonnet"]] },
];

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
  aiProvider: string;
}

export default function ContentEngine() {
  const { isAdmin, signOut } = useAuth();

  const [form, setForm] = useState<FormState>({
    idea: "", format: "carrossel", goal: "descoberta",
    awareness: "frio", tone: "reflexivo", niche: "",
    offer: "", cards: "5", generateImages: true,
    visualStyle: "clean realista", aiProvider: "google",
  });

  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [images, setImages] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState("estrategia");
  const [error, setError] = useState("");
  const [sidebarMode, setSidebarMode] = useState<"generate" | "paste">("generate");
  const [pasteJson, setPasteJson] = useState("");
  const [pasteGenerateImages, setPasteGenerateImages] = useState(true);
  const [pasteVisualStyle, setPasteVisualStyle] = useState("clean realista");

  const handleLoadPasted = () => {
    try {
      const parsed = JSON.parse(pasteJson.trim());
      if (!parsed.strategy || (!parsed.carousel && !parsed.reels)) {
        setError("JSON inválido: precisa ter 'strategy' e 'carousel' ou 'reels'.");
        return;
      }

      // Detect format and update form format for tabs
      const detectedFormat = parsed.carousel ? "carrossel" : "reels";
      set("format", detectedFormat);

      setResult(parsed);
      setImages({});
      setActiveTab("estrategia");
      setError("");
      toast.success("Conteúdo carregado com sucesso!");

      // Auto-generate images if toggle is on and there are visual_prompts
      if (pasteGenerateImages && parsed.carousel?.slides) {
        const hasPrompts = parsed.carousel.slides.some((s: any) => s.visual_prompt);
        if (hasPrompts) {
          handleGenerateImagesForPaste(parsed.carousel.slides);
        }
      }
    } catch {
      setError("JSON inválido. Verifique o formato e tente novamente.");
    }
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
      slides.forEach((s: any, i: number) => {
        if (urls[i]) newImages[s.slide_number] = urls[i]!;
      });
      setImages(newImages);

      const count = Object.keys(newImages).length;
      if (count > 0) toast.success(`${count} imagem(ns) gerada(s)!`);
      else toast.warning("Não foi possível gerar imagens.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar imagens.");
    } finally {
      setLoadingImages(false);
    }
  };

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const handleGenerate = async () => {
    if (!form.idea.trim()) { setError("Digite uma ideia."); return; }
    setError(""); setLoading(true); setResult(null); setImages({});

    try {
      const body = {
        idea: form.idea,
        format: FORMAT_MAP[form.format] || form.format,
        goal: GOAL_MAP[form.goal] || form.goal,
        awareness: AWARENESS_MAP[form.awareness] || form.awareness,
        tone: TONE_MAP[form.tone] || form.tone,
        niche: form.niche,
        offer: form.offer,
        cards: parseInt(form.cards),
        generate_images: false, // we handle images separately here
        visual_style: VISUAL_MAP[form.visualStyle] || form.visualStyle,
        ai_provider: form.aiProvider,
      };

      const { data, error: fnError } = await supabase.functions.invoke("generate-content", { body });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) {
        if (data.error === "RATE_LIMITED") throw new Error("Limite de requisições atingido. Aguarde e tente novamente.");
        if (data.error === "PAYMENT_REQUIRED") throw new Error("Créditos de IA esgotados.");
        throw new Error(data.error);
      }

      setResult(data);
      setActiveTab("estrategia");
      toast.success("Conteúdo gerado com sucesso!");

      if (form.generateImages && form.format === "carrossel" && data.carousel?.slides) {
        handleGenerateImages(data.carousel.slides);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar conteúdo.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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
      slides.forEach((s: any, i: number) => {
        if (urls[i]) newImages[s.slide_number] = urls[i]!;
      });
      setImages(newImages);

      const count = Object.keys(newImages).length;
      if (count > 0) toast.success(`${count} imagem(ns) gerada(s)!`);
      else toast.warning("Não foi possível gerar imagens.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar imagens.");
    } finally {
      setLoadingImages(false);
    }
  };

  const handleRegenerateSlide = async (slide: any) => {
    setImages((prev) => ({ ...prev, [slide.slide_number]: "loading" }));
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-images", {
        body: { prompts: [slide.visual_prompt], visual_style: VISUAL_MAP[form.visualStyle] || form.visualStyle },
      });
      if (fnError) throw new Error(fnError.message);
      const url = data?.urls?.[0];
      if (url) {
        setImages((prev) => ({ ...prev, [slide.slide_number]: url }));
        toast.success(`Imagem do slide ${slide.slide_number} regenerada!`);
      } else {
        setImages((prev) => ({ ...prev, [slide.slide_number]: "error" }));
        toast.warning("Não foi possível regenerar.");
      }
    } catch {
      setImages((prev) => ({ ...prev, [slide.slide_number]: "error" }));
      toast.error("Erro ao regenerar imagem.");
    }
  };

  const tabs = result
    ? ["estrategia", form.format === "reels" ? "reels" : "carrossel", "legenda", "prompts", "imagens"]
    : [];

  const tabLabels: Record<string, string> = {
    estrategia: "Estratégia", reels: "Reels", carrossel: "Carrossel",
    legenda: "Legenda", prompts: "Prompts Visuais", imagens: "Imagens",
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-border flex flex-col overflow-y-auto bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <div className="font-bold text-sm">Content Engine</div>
                <div className="text-xs text-muted-foreground">MASTER</div>
              </div>
            </div>
            <Link to="/app">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Nav links */}
        <div className="px-4 pt-3 flex items-center gap-1 flex-wrap">
          {isAdmin && (
            <Link to="/admin/users">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground text-xs h-7 px-2">
                <Users className="w-3 h-3" /> Usuários
              </Button>
            </Link>
          )}
          <Link to="/library">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground text-xs h-7 px-2">
              <BookOpen className="w-3 h-3" /> Biblioteca
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground text-xs h-7 px-2">
            <LogOut className="w-3 h-3" /> Sair
          </Button>
        </div>

        <div className="p-4 flex flex-col gap-3 flex-1">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Ideia Bruta</label>
            <textarea
              value={form.idea}
              onChange={(e) => set("idea", e.target.value)}
              placeholder="Descreva sua ideia..."
              rows={4}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {SELECT_FIELDS.map(({ label, key, options }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">{label}</label>
              <select
                value={(form as any)[key]}
                onChange={(e) => set(key, e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Nicho</label>
            <input value={form.niche} onChange={(e) => set("niche", e.target.value)} placeholder="ex: empreendedorismo"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Oferta (opcional)</label>
            <input value={form.offer} onChange={(e) => set("offer", e.target.value)} placeholder="ex: mentoria"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
          </div>

          {form.format === "carrossel" && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Qtd de Cards</label>
              <select value={form.cards} onChange={(e) => set("cards", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                {["3", "4", "5", "6", "7", "8", "10"].map((n) => <option key={n} value={n}>{n} cards</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button onClick={() => set("generateImages", !form.generateImages)}
              className={`w-10 h-5 rounded-full relative transition-colors ${form.generateImages ? "bg-primary" : "bg-muted"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground transition-all ${form.generateImages ? "left-5" : "left-0.5"}`} />
            </button>
            <span className="text-xs text-muted-foreground">Gerar imagens</span>
          </div>

          {error && <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 text-xs text-destructive">{error}</div>}

          <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2">
            <Zap className="w-4 h-4" />
            {loading ? "Gerando..." : "Gerar Conteúdo MASTER"}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!result && !loading && (
          <div className="flex-1 flex items-center justify-center flex-col gap-3 text-muted-foreground">
            <Zap className="w-12 h-12 text-primary" />
            <div className="text-lg font-semibold">Content Engine MASTER</div>
            <div className="text-sm max-w-xs text-center">Digite sua ideia e clique em Gerar para começar</div>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-border border-t-primary animate-spin" />
            <div className="text-muted-foreground text-sm">Construindo estratégia e conteúdo...</div>
          </div>
        )}

        {result && (
          <>
            <div className="border-b border-border px-6 flex gap-1">
              {tabs.map((t) => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {tabLabels[t] || t}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Estratégia */}
              {activeTab === "estrategia" && result.strategy && (
                <div className="grid gap-4 max-w-3xl">
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
                <div className="grid gap-4 max-w-3xl">
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
                <div className="grid gap-4 max-w-3xl">
                  <h2 className="text-lg font-bold">{result.carousel.title}</h2>
                  {result.carousel.slides?.map((slide: any) => (
                    <div key={slide.slide_number} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">{slide.slide_number}</div>
                        <div>
                          <div className="font-semibold text-sm">{slide.title}</div>
                          <div className="text-xs text-primary uppercase tracking-wider">{slide.role}</div>
                        </div>
                      </div>
                      <div className="text-sm leading-relaxed mb-2">{slide.body}</div>
                      <div className="text-xs text-muted-foreground italic">🎯 {slide.emotional_goal}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Legenda */}
              {activeTab === "legenda" && (
                <div className="grid gap-4 max-w-3xl">
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
                <div className="grid gap-3 max-w-3xl">
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
                      <div className="text-xs text-muted-foreground leading-relaxed">{slide.visual_prompt}</div>
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

                  {!loadingImages && Object.keys(images).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="mb-4">Nenhuma imagem gerada ainda.</p>
                      {result.carousel?.slides && (
                        <Button variant="secondary" onClick={() => handleGenerateImages(result.carousel.slides)} className="gap-2">
                          <RefreshCw className="w-4 h-4" /> Gerar Imagens Agora
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {result.carousel?.slides?.map((slide: any) => {
                      const img = images[slide.slide_number];
                      if (!img && !loadingImages) return null;
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
                              <RefreshCw className="w-3 h-3" /> Regenerar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
