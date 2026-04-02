import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CanvaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setError("Código de autorização não encontrado na URL.");
      return;
    }

    const exchangeToken = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("canva-callback", {
          body: { code },
        });

        if (fnError || !data?.success) {
          setError("Falha ao conectar com o Canva. Tente novamente.");
          return;
        }

        navigate("/content-engine?canva=connected", { replace: true });
      } catch {
        setError("Erro inesperado. Tente novamente.");
      }
    };

    exchangeToken();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Erro na Conexão</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => navigate("/content-engine")}>
            Voltar ao Content Engine
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Conectando ao Canva...</p>
      </div>
    </div>
  );
}
