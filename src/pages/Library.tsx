import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Archive, Trash2, ArrowLeft, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GeneratedContent } from "@/types/content";
import { ResultsView } from "@/components/ResultsView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Generation {
  id: string;
  title: string;
  format: string;
  niche: string;
  content: GeneratedContent;
  created_at: string;
}

const Library = () => {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Generation | null>(null);

  const fetchGenerations = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar biblioteca");
    } else {
      setGenerations((data as unknown as Generation[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGenerations();
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("generations").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao deletar");
    } else {
      setGenerations((prev) => prev.filter((g) => g.id !== id));
      toast.success("Removido da biblioteca");
    }
  };

  if (selected) {
    const contentWithInput = {
      ...selected.content,
      input: selected.content.input || {
        idea: "",
        format: selected.format as "reels" | "carousel",
        goal: "discovery" as const,
        awareness: "cold" as const,
        tone: "reflective" as const,
        niche: selected.niche || "",
        cards: 7,
        generate_images: false,
        visual_style: "clean_realistic" as const,
        ai_provider: "google" as const,
      },
    };
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <ResultsView
          content={contentWithInput}
          onBack={() => setSelected(null)}
          onRegenerate={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-display font-bold">Biblioteca</h1>
          <Link to="/content-engine" className="text-sm text-primary hover:text-primary/80 transition-colors">
            ← Gerar novo
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : generations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-16 flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Archive className="w-8 h-8 text-primary/40" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground/80">Nenhum conteúdo salvo</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Gere conteúdo e clique em "Salvar" para guardar na sua biblioteca.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {generations.map((gen, i) => (
              <motion.div
                key={gen.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(gen)}
                className="card-premium p-5 cursor-pointer hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{gen.title || "Sem título"}</h3>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {gen.format === "reels" ? "Reels" : "Carrossel"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{gen.niche}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(gen.id, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
