import { motion } from "framer-motion";
import { renderMarkdownBold } from "@/lib/formatText";
import { ReelsContent } from "@/types/content";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ReelsTabProps {
  reels: ReelsContent;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copiado" : `Copiar ${label}`}
    </button>
  );
}

export function ReelsTab({ reels }: ReelsTabProps) {
  return (
    <div className="space-y-4">
      {/* Hook */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">Hook</span>
        </div>
        <p className="text-foreground font-medium text-lg leading-snug">{renderMarkdownBold(reels.hook)}</p>
      </motion.div>

      {/* Script */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card-premium p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">Roteiro Completo</span>
          <CopyButton text={reels.script} label="roteiro" />
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{renderMarkdownBold(reels.script)}</p>
      </motion.div>

      {/* On-screen text */}
      {reels.on_screen_text.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium p-5 space-y-3">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">Textos na Tela</span>
          <ul className="space-y-2">
            {reels.on_screen_text.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="text-primary font-mono text-xs mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                {t}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Scene suggestions */}
      {reels.scene_suggestions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card-premium p-5 space-y-3">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">Sugestões de Cena</span>
          <ul className="space-y-2">
            {reels.scene_suggestions.map((s, i) => (
              <li key={i} className="text-sm text-foreground/80 pl-4 border-l-2 border-primary/20">{s}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Editing Notes */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-premium p-5 space-y-2">
        <span className="text-xs font-medium text-primary uppercase tracking-wider">Notas de Edição</span>
        <p className="text-sm text-foreground/70 leading-relaxed">{renderMarkdownBold(reels.editing_notes)}</p>
      </motion.div>
    </div>
  );
}
