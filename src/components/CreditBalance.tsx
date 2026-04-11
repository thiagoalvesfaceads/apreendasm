import { Coins } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export function CreditBalance() {
  const { balance, loading } = useCredits();
  const { isAdmin } = useAuth();

  if (loading || balance === null) return null;

  return (
    <Link
      to="/pricing"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
    >
      <Coins className="w-3.5 h-3.5" />
      {isAdmin ? "∞" : balance} créditos
    </Link>
  );
}
