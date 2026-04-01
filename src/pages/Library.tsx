import { motion } from "framer-motion";
import { Archive, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const Library = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-display font-bold">Biblioteca</h1>
          <Link to="/" className="text-sm text-primary hover:text-primary/80 transition-colors">
            ← Gerar novo
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-16 flex flex-col items-center justify-center text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Archive className="w-8 h-8 text-primary/40" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground/80">Em breve</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Histórico de conteúdos gerados, favoritos e reutilização de estratégias anteriores.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <Clock className="w-3.5 h-3.5" />
            Planejado para V2
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Library;
