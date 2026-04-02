import { Copy, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface VisualPromptsTabProps {
  prompts: string[];
  labels?: string[];
}

export function VisualPromptsTab({ prompts, labels }: VisualPromptsTabProps) {
  const [copiedAll, setCopiedAll] = useState(false);

  const copyAll = () => {
    navigator.clipboard.writeText(prompts.join("\n\n---\n\n"));
    setCopiedAll(true);
    toast.success("Todos os prompts copiados!");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={copyAll}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedAll ? "Copiados" : "Copiar todos"}
        </button>
      </div>
      {prompts.map((prompt, i) => (
        <PromptCard key={i} prompt={prompt} label={labels?.[i] || `Prompt ${i + 1}`} />
      ))}

      <Button
        className="w-full gap-2 mt-2"
        onClick={() => {
          window.open("https://gemini.google.com/gem/1Jh27NXowbrFiqCzDx6YvO_6UfQiTMuQt", "_blank");
          navigator.clipboard.writeText(prompts.join("\n\n---\n\n"));
          toast.success("Prompts copiados! Cole no Gemini (Ctrl+V)");
        }}
      >
        <Sparkles className="w-4 h-4" />
        Gerar imagens no Gemini
      </Button>
    </div>
  );
}

function PromptCard({ prompt, label }: { prompt: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success("Prompt copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-premium p-5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-primary uppercase tracking-wider">{label}</span>
        <button onClick={copy} className="text-muted-foreground hover:text-primary transition-colors">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-xs text-foreground/70 leading-relaxed font-mono">{prompt}</p>
    </div>
  );
}
