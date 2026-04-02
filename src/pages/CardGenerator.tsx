import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, ArrowLeft, Loader2, RefreshCw, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SlideData {
  slide_number: number;
  title: string;
  body: string;
  visual_prompt: string;
  role?: string;
  emotional_goal?: string;
}

const CANVAS_W = 1080;
const CANVAS_H = 1440;
const AVATAR_SIZE = 80;
const AVATAR_BORDER = 4;
const PADDING = 60;
const PROFILE_NAME = "Thiago Alcântara Alves";
const PROFILE_HANDLE = "@thiagoalcantaraalves";

function getProfileImageUrl() {
  const { data } = supabase.storage.from("generated-images").getPublicUrl("profile/thiago.jpg");
  return data.publicUrl;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, lineHeight: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split("\n");
  for (const para of paragraphs) {
    const words = para.split(" ");
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawVerifiedIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();
  // checkmark
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = size * 0.15;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - size * 0.22, y);
  ctx.lineTo(x - size * 0.05, y + size * 0.2);
  ctx.lineTo(x + size * 0.25, y - size * 0.18);
  ctx.stroke();
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function renderCard(
  canvas: HTMLCanvasElement,
  slide: SlideData,
  totalSlides: number,
  avatarImg: HTMLImageElement | null,
  slideImg: HTMLImageElement | null,
  offsetY: number = 0,
) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  // Background
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  let cursorY = PADDING;

  // --- Header row ---
  const avatarX = PADDING;
  const avatarY = cursorY;
  const avatarR = AVATAR_SIZE / 2;

  // Avatar border
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarR, avatarY + avatarR, avatarR + AVATAR_BORDER, 0, Math.PI * 2);
  ctx.fillStyle = "#3b82f6";
  ctx.fill();
  ctx.restore();

  // Avatar image
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarR, avatarY + avatarR, avatarR, 0, Math.PI * 2);
  ctx.clip();
  if (avatarImg) {
    ctx.drawImage(avatarImg, avatarX, avatarY, AVATAR_SIZE, AVATAR_SIZE);
  } else {
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("T", avatarX + avatarR, avatarY + avatarR);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();

  // Name + verified
  const textX = avatarX + AVATAR_SIZE + 20;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px sans-serif";
  const nameWidth = ctx.measureText(PROFILE_NAME).width;
  ctx.fillText(PROFILE_NAME, textX, avatarY + 35);
  drawVerifiedIcon(ctx, textX + nameWidth + 20, avatarY + 30, 22);

  // Handle
  ctx.fillStyle = "#94a3b8";
  ctx.font = "22px sans-serif";
  ctx.fillText(PROFILE_HANDLE, textX, avatarY + 65);

  // Counter pill
  const counterText = `${slide.slide_number}/${totalSlides}`;
  ctx.font = "bold 24px sans-serif";
  const counterW = ctx.measureText(counterText).width + 30;
  const pillX = CANVAS_W - PADDING - counterW;
  const pillY = avatarY + 15;
  const pillH = 38;
  ctx.save();
  drawRoundedRect(ctx, pillX, pillY, counterW, pillH, pillH / 2);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(counterText, pillX + counterW / 2, pillY + pillH / 2);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
  ctx.restore();

  cursorY = avatarY + AVATAR_SIZE + AVATAR_BORDER * 2 + 40;

  // --- Title ---
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 46px sans-serif";
  const titleLines = wrapText(ctx, slide.title, CANVAS_W - PADDING * 2, 56);
  for (const line of titleLines) {
    ctx.fillText(line, PADDING, cursorY + 46);
    cursorY += 56;
  }
  cursorY += 20;

  // --- Body ---
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "32px sans-serif";
  const bodyLines = wrapText(ctx, slide.body, CANVAS_W - PADDING * 2, 44);
  for (const line of bodyLines) {
    ctx.fillText(line, PADDING, cursorY + 32);
    cursorY += 44;
  }
  cursorY += 30;

  // --- Generated image ---
  if (slideImg) {
    const imgPadding = PADDING;
    const imgW = CANVAS_W - imgPadding * 2;
    const availableH = CANVAS_H - cursorY - imgPadding;
    const imgH = Math.min(availableH, imgW * 0.75);
    const imgY = cursorY;
    const imgX = imgPadding;
    const radius = 20;

    ctx.save();
    drawRoundedRect(ctx, imgX, imgY, imgW, imgH, radius);
    ctx.clip();
    // Cover-fit
    const srcRatio = slideImg.width / slideImg.height;
    const dstRatio = imgW / imgH;
    let sx = 0, sy = 0, sw = slideImg.width, sh = slideImg.height;
    if (srcRatio > dstRatio) {
      sw = slideImg.height * dstRatio;
      sx = (slideImg.width - sw) / 2;
    } else {
      sh = slideImg.width / dstRatio;
      const centerSy = (slideImg.height - sh) / 2;
      sy = Math.max(0, Math.min(slideImg.height - sh, centerSy + offsetY * centerSy));
    }
    ctx.drawImage(slideImg, sx, sy, sw, sh, imgX, imgY, imgW, imgH);
    ctx.restore();
  }
}

export default function CardGenerator() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
  const [loadingImages, setLoadingImages] = useState(false);
  const [avatarImg, setAvatarImg] = useState<HTMLImageElement | null>(null);
  const [slideImgs, setSlideImgs] = useState<Record<number, HTMLImageElement>>({});
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const [imageOffsets, setImageOffsets] = useState<Record<number, number>>({});
  const [rendered, setRendered] = useState(false);

  // Load slides and cached images from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("card_generator_slides");
    if (!raw) {
      toast.error("Nenhum dado de slides encontrado.");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SlideData[];
      setSlides(parsed);

      // Check for pre-generated images from ContentEngine
      const cachedImages = localStorage.getItem("card_generator_images");
      if (cachedImages) {
        try {
          const parsedImages = JSON.parse(cachedImages) as Record<string, string>;
          const validImages: Record<number, string> = {};
          Object.entries(parsedImages).forEach(([k, v]) => {
            if (v && v !== "loading" && v !== "error") validImages[Number(k)] = v;
          });
          if (Object.keys(validImages).length > 0) {
            setGeneratedImages(validImages);
            localStorage.removeItem("card_generator_images");
            return;
          }
        } catch {}
      }
    } catch {
      toast.error("Erro ao ler dados dos slides.");
    }
  }, []);

  // Load avatar once
  useEffect(() => {
    const url = getProfileImageUrl();
    loadImage(url).then(setAvatarImg).catch(() => {
      console.warn("Could not load profile image, using fallback");
    });
  }, []);

  // Generate images via edge function
  const generateImages = useCallback(async () => {
    if (slides.length === 0) return;
    setLoadingImages(true);
    toast.info("Gerando imagens para os cards...");
    try {
      const prompts = slides.map((s) => s.visual_prompt);
      const { data, error } = await supabase.functions.invoke("generate-images", {
        body: { prompts },
      });
      if (error) throw new Error(error.message);
      const urls: (string | null)[] = data?.urls || [];
      const map: Record<number, string> = {};
      slides.forEach((s, i) => {
        if (urls[i]) map[s.slide_number] = urls[i]!;
      });
      setGeneratedImages(map);
      const count = Object.keys(map).length;
      if (count > 0) toast.success(`${count} imagem(ns) gerada(s)!`);
      else toast.warning("Não foi possível gerar imagens.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar imagens.");
    } finally {
      setLoadingImages(false);
    }
  }, [slides]);


  // Load generated image HTMLImageElements
  useEffect(() => {
    const entries = Object.entries(generatedImages);
    if (entries.length === 0) return;
    let cancelled = false;
    (async () => {
      const loaded: Record<number, HTMLImageElement> = {};
      for (const [numStr, url] of entries) {
        if (cancelled) return;
        try {
          loaded[Number(numStr)] = await loadImage(url);
        } catch {
          console.warn(`Failed to load slide image ${numStr}`);
        }
      }
      if (!cancelled) setSlideImgs(loaded);
    })();
    return () => { cancelled = true; };
  }, [generatedImages]);

  // Render canvases — re-render whenever slides, avatar or slide images change
  useEffect(() => {
    if (slides.length === 0) return;
    let anyRendered = false;
    slides.forEach((slide) => {
      const canvas = canvasRefs.current[slide.slide_number];
      if (canvas) {
        renderCard(canvas, slide, slides.length, avatarImg, slideImgs[slide.slide_number] || null);
        anyRendered = true;
      }
    });
    if (anyRendered) setRendered(true);
  }, [slides, avatarImg, slideImgs]);

  const handleImageUpload = useCallback((slideNumber: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setGeneratedImages((prev) => ({ ...prev, [slideNumber]: dataUrl }));
    };
    reader.readAsDataURL(file);
  }, []);

  const removeImage = useCallback((slideNumber: number) => {
    setGeneratedImages((prev) => {
      const next = { ...prev };
      delete next[slideNumber];
      return next;
    });
    setSlideImgs((prev) => {
      const next = { ...prev };
      delete next[slideNumber];
      return next;
    });
  }, []);

  const downloadCard = (slideNumber: number) => {
    const canvas = canvasRefs.current[slideNumber];
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `card_${slideNumber}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadAll = async () => {
    for (const slide of slides) {
      downloadCard(slide.slide_number);
      await new Promise((r) => setTimeout(r, 300));
    }
    toast.success("Todos os cards baixados!");
  };

  if (slides.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Nenhum slide encontrado.</p>
          <Link to="/content-engine">
            <Button variant="secondary" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Content Engine
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link to="/content-engine">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs h-8">
                <ArrowLeft className="w-3.5 h-3.5" /> Content Engine
              </Button>
            </Link>
            <span className="text-sm font-bold">Card Generator</span>
          </div>
          <div className="flex items-center gap-2">
            {loadingImages && (
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando imagens...
              </span>
            )}
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs h-8" onClick={generateImages} disabled={loadingImages}>
              <RefreshCw className="w-3.5 h-3.5" /> Regenerar Imagens
            </Button>
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={downloadAll} disabled={!rendered}>
              <Download className="w-3.5 h-3.5" /> Baixar Todos
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {slides.map((slide) => (
            <div key={slide.slide_number} className="space-y-3">
              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <canvas
                  ref={(el) => { canvasRefs.current[slide.slide_number] = el; }}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className="w-full h-auto"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => downloadCard(slide.slide_number)}
                  disabled={!rendered}
                >
                  <Download className="w-3.5 h-3.5" /> Baixar PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleImageUpload(slide.slide_number, file);
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-3.5 h-3.5" /> Imagem
                </Button>
                {generatedImages[slide.slide_number] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2 text-destructive hover:text-destructive"
                    onClick={() => removeImage(slide.slide_number)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
