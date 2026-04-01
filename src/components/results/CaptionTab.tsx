import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CaptionTabProps {
  caption: string;
  cta: string;
}

export function CaptionTab({ caption, cta }: CaptionTabProps) {
  const [copied, setCopied] = useState(false);
  const fullCaption = `${caption}\n\n${cta}`;

  const copy = () => {
    navigator.clipboard.writeText(fullCaption);
    setCopied(true);
    toast.success("Legenda copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="card-premium p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">Legenda</span>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiado" : "Copiar legenda"}
          </button>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{caption}</p>
        <div className="pt-3 border-t border-border/50">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">CTA</span>
          <p className="text-sm text-foreground/80 mt-2">{cta}</p>
        </div>
      </div>
    </div>
  );
}
