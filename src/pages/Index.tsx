import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Users, BookOpen, Zap, Palette, ArrowRight, FileText, Video, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditBalance } from "@/components/CreditBalance";

interface RecentGeneration {
  id: string;
  title: string;
  format: string;
  created_at: string;
}

const Index = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [generationsCount, setGenerationsCount] = useState(0);
  const [recentGenerations, setRecentGenerations] = useState<RecentGeneration[]>([]);
  const [canvaConnected, setCanvaConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [countRes, recentRes, canvaRes] = await Promise.all([
        supabase.from("generations").select("id", { count: "exact", head: true }),
        supabase.from("generations").select("id, title, format, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("canva_tokens").select("id").limit(1),
      ]);
      setGenerationsCount(countRes.count ?? 0);
      setRecentGenerations(recentRes.data ?? []);
      setCanvaConnected((canvaRes.data?.length ?? 0) > 0);
      setLoading(false);
    };
    fetchData();
  }, []);

  const displayName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "usuário";

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-display">Olá, {displayName} 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">O que vamos criar hoje?</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Quick action cards */}
        <div className={`grid gap-4 mb-8 ${isAdmin ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
          <Link to="/content-engine" className="group">
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base">Content Engine</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Gerar novo conteúdo</p>
                <ArrowRight className="w-4 h-4 text-muted-foreground mt-3 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/library" className="group">
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base">Biblioteca</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {loading ? "..." : `${generationsCount} conteúdo${generationsCount !== 1 ? "s" : ""} salvo${generationsCount !== 1 ? "s" : ""}`}
                </p>
                <ArrowRight className="w-4 h-4 text-muted-foreground mt-3 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/content-engine" className="group">
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader className="pb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${canvaConnected ? "bg-emerald-500/10" : "bg-muted"}`}>
                  <Palette className={`w-5 h-5 ${canvaConnected ? "text-emerald-500" : "text-muted-foreground"}`} />
                </div>
                <CardTitle className="text-base">Canva</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {canvaConnected ? "Conectado ✓" : "Não conectado"}
                </p>
                <ArrowRight className="w-4 h-4 text-muted-foreground mt-3 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          {isAdmin && (
            <Link to="/admin/users" className="group">
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Gerenciar acessos</p>
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-3 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Recent generations */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Últimas gerações</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : recentGenerations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhum conteúdo salvo ainda.</p>
                <Link to="/content-engine">
                  <Button variant="link" className="mt-2 gap-1">
                    <Zap className="w-4 h-4" />
                    Criar primeiro conteúdo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentGenerations.map((gen) => (
                <Link key={gen.id} to="/library">
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="flex items-center gap-3 py-3 px-4">
                      {gen.format === "reels" ? (
                        <Video className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{gen.title || "Sem título"}</p>
                        <p className="text-xs text-muted-foreground">
                          {gen.format === "reels" ? "Reels" : "Carrossel"} · {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
