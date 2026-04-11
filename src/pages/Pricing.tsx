import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Coins, ArrowLeft, Sparkles, Gift, Copy, Check, Loader2, CreditCard, Lock, Zap, CalendarOff, Mail } from "lucide-react";
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

function formatCpfCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

export default function Pricing() {
  const { user } = useAuth();
  const { balance, refresh: refreshBalance } = useCredits();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<CreditPackage | null>(null);

  // Form state
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [billingType, setBillingType] = useState<"PIX" | "CREDIT_CARD">("PIX");

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardPostalCode, setCardPostalCode] = useState("");
  const [cardAddressNumber, setCardAddressNumber] = useState("");
  const [cardPhone, setCardPhone] = useState("");

  // PIX result state
  const [pixData, setPixData] = useState<{
    paymentId: string;
    pixQrCodeBase64: string | null;
    pixCopyPaste: string | null;
    expirationDate: string | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step: "form" | "pix" | "confirmed"
  const [step, setStep] = useState<"form" | "pix" | "confirmed">("form");

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
          setStep("confirmed");
          await refreshBalance();
          toast({
            title: "Pagamento confirmado! 🎉",
            description: "Seus créditos já estão disponíveis.",
          });
          setTimeout(() => handleCloseModal(), 2000);
        }
      }, 5000);
    },
    [refreshBalance]
  );

  const handleBuy = (pkg: CreditPackage) => {
    if (!user) {
      navigate("/auth?tab=signup");
      return;
    }
    setSelectedPkg(pkg);
    setStep("form");
    setPixData(null);
    setModalOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedPkg) return;
    const cleanCpf = cpfCnpj.replace(/\D/g, "");
    if (cleanCpf.length < 11) {
      toast({ title: "CPF/CNPJ inválido", description: "Digite um CPF (11 dígitos) ou CNPJ (14 dígitos).", variant: "destructive" });
      return;
    }

    setModalLoading(true);

    try {
      const body: Record<string, unknown> = {
        package_id: selectedPkg.id,
        cpf_cnpj: cleanCpf,
        billing_type: billingType,
      };

      if (billingType === "CREDIT_CARD") {
        const [expiryMonth, expiryYear] = cardExpiry.split("/").map((s) => s.trim());
        body.credit_card = {
          holder_name: cardName,
          number: cardNumber,
          expiry_month: expiryMonth,
          expiry_year: expiryYear?.length === 2 ? `20${expiryYear}` : expiryYear,
          ccv: cardCvv,
        };
        body.card_holder_info = {
          name: cardName,
          postal_code: cardPostalCode,
          address_number: cardAddressNumber,
          phone: cardPhone,
        };
      }

      const { data, error } = await supabase.functions.invoke("process-payment", { body });
      if (error) throw error;

      if (data.billingType === "CREDIT_CARD" && data.status === "confirmed") {
        setStep("confirmed");
        await refreshBalance();
        toast({
          title: "Pagamento confirmado! 🎉",
          description: "Seus créditos já estão disponíveis.",
        });
        setTimeout(() => handleCloseModal(), 2000);
      } else {
        setPixData(data);
        setStep("pix");
        startPolling(data.paymentId);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({
        title: "Erro ao processar pagamento",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!pixData?.pixCopyPaste) return;
    await navigator.clipboard.writeText(pixData.pixCopyPaste);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetryQr = async () => {
    if (!pixData?.paymentId) return;
    setModalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pix-qr-code", {
        body: { payment_id: pixData.paymentId },
      });
      if (error) throw error;
      if (data.pixQrCodeBase64 || data.pixCopyPaste) {
        setPixData((prev) => prev ? { ...prev, pixQrCodeBase64: data.pixQrCodeBase64, pixCopyPaste: data.pixCopyPaste } : prev);
      } else {
        toast({ title: "QR Code ainda não disponível", description: "Tente novamente em alguns segundos.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao buscar QR Code", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = null;
    setModalOpen(false);
    setPixData(null);
    setSelectedPkg(null);
    setStep("form");
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
                    <Button className="w-full mt-2" onClick={() => handleBuy(pkg)}>
                      {user ? "Comprar" : "Cadastre-se para comprar"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Trust bar */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 py-6 border-t border-border/40">
          {[
            { icon: Lock, label: "Pagamento seguro" },
            { icon: Zap, label: "Créditos instantâneos" },
            { icon: CalendarOff, label: "Sem assinatura" },
            { icon: Mail, label: "Suporte por e-mail" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-[12px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === "confirmed" ? "Pagamento confirmado!" : step === "pix" ? "Pagamento via PIX" : "Finalizar compra"}
            </DialogTitle>
            <DialogDescription>
              {step === "confirmed"
                ? "Seus créditos já estão disponíveis."
                : step === "pix"
                ? "Escaneie o QR code ou copie o código PIX."
                : selectedPkg
                ? `${selectedPkg.name} — ${selectedPkg.credits.toLocaleString("pt-BR")} créditos por ${formatBRL(selectedPkg.price_cents)}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {/* Step: Form */}
          {step === "form" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  placeholder="000.000.000-00"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <RadioGroup value={billingType} onValueChange={(v) => setBillingType(v as "PIX" | "CREDIT_CARD")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PIX" id="pix" />
                    <Label htmlFor="pix" className="cursor-pointer">PIX</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CREDIT_CARD" id="card" />
                    <Label htmlFor="card" className="cursor-pointer flex items-center gap-1">
                      <CreditCard className="w-4 h-4" /> Cartão de Crédito
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {billingType === "CREDIT_CARD" && (
                <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Nome no cartão</Label>
                    <Input id="cardName" placeholder="Como está no cartão" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Número do cartão</Label>
                    <Input id="cardNumber" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="cardExpiry">Validade</Label>
                      <Input id="cardExpiry" placeholder="MM/AA" maxLength={5} value={cardExpiry} onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                        setCardExpiry(v);
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardCvv">CVV</Label>
                      <Input id="cardCvv" placeholder="000" maxLength={4} value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="cardPostalCode">CEP</Label>
                      <Input id="cardPostalCode" placeholder="00000-000" value={cardPostalCode} onChange={(e) => setCardPostalCode(e.target.value.replace(/\D/g, "").slice(0, 8))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardAddressNumber">Nº endereço</Label>
                      <Input id="cardAddressNumber" placeholder="123" value={cardAddressNumber} onChange={(e) => setCardAddressNumber(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardPhone">Telefone</Label>
                    <Input id="cardPhone" placeholder="(00) 00000-0000" value={cardPhone} onChange={(e) => setCardPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} />
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={handleSubmitPayment} disabled={modalLoading}>
                {modalLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processando...
                  </>
                ) : billingType === "PIX" ? (
                  "Gerar QR Code PIX"
                ) : (
                  "Pagar com cartão"
                )}
              </Button>
            </div>
          )}

          {/* Step: PIX */}
          {step === "pix" && pixData && (
            <div className="flex flex-col items-center gap-4">
              {pixData.pixQrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${pixData.pixQrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-56 h-56 rounded-lg border"
                />
              ) : (
                <div className="w-56 h-56 rounded-lg border flex flex-col items-center justify-center gap-3 bg-muted/30">
                  <p className="text-sm text-muted-foreground text-center px-4">QR Code ainda sendo gerado...</p>
                  <Button size="sm" variant="outline" disabled={modalLoading} onClick={handleRetryQr}>
                    {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gerar QR Code"}
                  </Button>
                </div>
              )}
              {pixData.pixCopyPaste ? (
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
              ) : !pixData.pixQrCodeBase64 ? null : (
                <p className="text-xs text-muted-foreground">Código copia-e-cola indisponível</p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Aguardando confirmação do pagamento...
              </div>
            </div>
          )}

          {/* Step: Confirmed */}
          {step === "confirmed" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Check className="w-12 h-12 text-primary" />
              <p className="font-semibold text-lg">Créditos adicionados!</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
