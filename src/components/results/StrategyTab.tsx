import { motion } from "framer-motion";
import { Strategy, LEAD_TYPE_LABELS } from "@/types/content";
import { Target, Lightbulb, Compass, MessageSquare, Crosshair, Megaphone } from "lucide-react";

interface StrategyTabProps {
  strategy: Strategy;
}

const items = [
  { key: "pain_desire_tension", label: "Dor / Desejo / Tensão", icon: Target },
  { key: "big_idea", label: "Big Idea", icon: Lightbulb },
  { key: "lead_type", label: "Tipo de Lead", icon: Crosshair },
  { key: "angle", label: "Ângulo de Comunicação", icon: Compass },
  { key: "promise", label: "Promessa", icon: MessageSquare },
  { key: "cta_strategy", label: "Estratégia de CTA", icon: Megaphone },
] as const;

export function StrategyTab({ strategy }: StrategyTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map(({ key, label, icon: Icon }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="card-premium p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">{label}</span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {key === "lead_type" ? LEAD_TYPE_LABELS[strategy[key]] : strategy[key]}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
