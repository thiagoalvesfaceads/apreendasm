import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins, Home, ArrowLeft, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UsageEntry {
  id: string;
  function_name: string;
  ai_model: string;
  credits_used: number;
  created_at: string;
  metadata: any;
}

const FUNCTION_LABELS: Record<string, string> = {
  "generate-content": "Gerar conteúdo",
  "generate-images": "Gerar imagens",
  "regenerate-field": "Regenerar campo",
};

export default function Usage() {
  const { balance, loading: balanceLoading } = useCredits();
  const { user } = useAuth();
  const [entries, setEntries] = useState<UsageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("usage_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        const rows = (data ?? []) as UsageEntry[];
        setEntries(rows);
        setTotalSpent(rows.reduce((sum, e) => sum + e.credits_used, 0));
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/app">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Uso de Créditos</h1>
          </div>
          <Link to="/content-engine">
            <Button size="sm" className="gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Gerar
            </Button>
          </Link>
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Saldo Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">
                  {balanceLoading ? "..." : balance}
                </span>
                <span className="text-sm text-muted-foreground">créditos</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Total Gasto</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{totalSpent}</span>
              <span className="text-sm text-muted-foreground ml-1">créditos</span>
            </CardContent>
          </Card>
        </div>

        {/* Usage table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Uso</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum uso registrado ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ação</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-right">Créditos</TableHead>
                    <TableHead className="text-right">Quando</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium text-sm">
                        {FUNCTION_LABELS[e.function_name] || e.function_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {e.ai_model}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {e.credits_used}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
