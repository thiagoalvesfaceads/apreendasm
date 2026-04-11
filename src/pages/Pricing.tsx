import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, ArrowLeft, Sparkles, Gift } from "lucide-react";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  description: string;
  is_active: boolean;
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Pricing() {
  const { user } = useAuth();
  const { balance } = useCredits();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("credit_packages")
      .select("*")
      .eq("is_active", true)
      .order("credits")
      .then(({ data }) => {
        setPackages((data as CreditPackage[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to={user ? "/app" : "/"}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          {user && balance !== null && (
            <div className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
              <Coins className="w-3.5 h-3.5" />
              {balance} créditos
            </div>
          )}
        </div>

        {/* Banner for guests */}
        {!user && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
            <Gift className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-foreground">
              <Link to="/auth?tab=signup" className="font-semibold text-primary hover:underline">
                Cadastre-se grátis
              </Link>{" "}
              e ganhe <strong>100 créditos</strong> para testar.
            </p>
          </div>
        )}

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Escolha seu pacote de créditos</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Compre uma vez, use quando quiser. Sem assinatura, sem surpresa.
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Carregando pacotes...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => {
              const isPopular = pkg.name === "Criador";
              const flashGens = Math.floor(pkg.credits / 20);
              const fullCarousels = Math.floor(pkg.credits / 650);

              return (
                <Card
                  key={pkg.id}
                  className={`relative flex flex-col ${
                    isPopular ? "border-primary ring-1 ring-primary/30" : ""
                  }`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Mais popular
                    </Badge>
                  )}
                  <CardHeader className="pb-2 pt-6">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 gap-4">
                    <div>
                      <span className="text-3xl font-bold">{formatBRL(pkg.price_cents)}</span>
                    </div>
                    <div className="text-primary font-semibold text-lg">
                      {pkg.credits.toLocaleString("pt-BR")} créditos
                    </div>
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                    <div className="text-xs text-muted-foreground space-y-1 mt-auto">
                      <p>≈ {flashGens} gerações com Gemini Flash</p>
                      <p>ou ≈ {fullCarousels} carrosséis completos com imagem</p>
                    </div>
                    <Button disabled className="w-full mt-2">
                      Em breve
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
