import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Coins, ArrowLeft, Sparkles, Gift, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  const { balance, refresh: refreshBalance } = useCredits();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);

  // PIX modal state
  const [pixOpen, setPixOpen] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    paymentId: string;
    pixQrCodeBase64: string | null;
    pixCopyPaste: string | null;
    expirationDate: string | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startPolling = useCallback(
    (asaasPaymentId: string) => {
      if (pollingRef.current) clearInterval(pollingRef.current);

      pollingRef.current = setInterval(async () => {
        const { data } = await supabase
          .from("payments")
          .select("status")
          .eq("asaas_payment_id", asaasPaymentId)
          .maybeSingle();

        if (data?.status === "confirmed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setPixOpen(false);
          setPixData(null);
          await refreshBalance();
          toast({
            title: "Pagamento confirmado! 🎉",
            description: "Seus créditos já estão disponíveis.",
          });
        }
      }, 5000);
    },
    [refreshBalance]
  );

  const handleBuy = async (pkg: CreditPackage) => {
    if (!user) {
      navigate("/auth?tab=signup");
      return;
    }

    setPixLoading(true);
    setPixOpen(true);

    try {
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: { package_id: pkg.id },
      });

      if (error) throw error;

      setPixData(data);
      startPolling(data.paymentId);
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({
        title: "Erro ao gerar pagamento",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
      setPixOpen(false);
    } finally {
      setPixLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!pixData?.pixCopyPaste) return;
    await navigator.clipboard.writeText(pixData.pixCopyPaste);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseModal = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = null;
    setPixOpen(false);
    setPixData(null);
  };

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
              e ganhe <strong>50 créditos</strong> para testar geração de texto com Gemini e OpenAI.
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
                    <Button
                      className="w-full mt-2"
                      onClick={() => handleBuy(pkg)}
                    >
                      {user ? "Comprar via PIX" : "Cadastre-se para comprar"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* PIX Modal */}
      <Dialog open={pixOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento via PIX</DialogTitle>
            <DialogDescription>
              Escaneie o QR code ou copie o código PIX. Os créditos caem automaticamente.
            </DialogDescription>
          </DialogHeader>

          {pixLoading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando cobrança...</p>
            </div>
          ) : pixData ? (
            <div className="flex flex-col items-center gap-4">
              {pixData.pixQrCodeBase64 && (
                <img
                  src={`data:image/png;base64,${pixData.pixQrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-56 h-56 rounded-lg border"
                />
              )}
              {pixData.pixCopyPaste && (
                <div className="w-full space-y-2">
                  <p className="text-xs text-muted-foreground text-center">Ou copie o código:</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={pixData.pixCopyPaste}
                      className="flex-1 text-xs bg-muted rounded-md px-3 py-2 border overflow-hidden text-ellipsis"
                    />
                    <Button size="sm" variant="outline" onClick={handleCopy}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Aguardando confirmação do pagamento...
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
