import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, LayoutGrid, Film, Type, BarChart3, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: LayoutGrid, title: "Carrosséis", desc: "Slides completos com textos prontos para postar" },
  { icon: Film, title: "Roteiros de Reels", desc: "Scripts com ganchos, CTAs e timing perfeito" },
  { icon: Type, title: "Legendas", desc: "Textos persuasivos com hashtags e emojis" },
  { icon: BarChart3, title: "Estratégia", desc: "Análise de público, tom de voz e posicionamento" },
  { icon: Sparkles, title: "Prompts Visuais", desc: "Descrições detalhadas para gerar imagens com IA" },
  { icon: Brain, title: "Multi-IA", desc: "Escolha entre Google Gemini, OpenAI GPT-4o ou Claude" },
];

const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/app", { replace: true });
    }
  }, [user, loading, navigate]);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">Social Media AI</span>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/auth?tab=signup">
              <Button size="sm">Criar conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Gere conteúdo profissional para suas
              <span className="text-primary"> redes sociais</span> com IA
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Carrosséis, reels, legendas e estratégia completa — tudo gerado automaticamente
              a partir do seu nicho, público e objetivos.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link to="/auth?tab=signup">
                <Button size="lg" className="text-base px-8">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Começar agora — é grátis
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="text-base px-8">
                  Ver pacotes
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Tudo que você precisa para criar conteúdo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card-premium p-6 space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para transformar seu conteúdo?
          </h2>
          <p className="text-muted-foreground mb-8">
            Crie sua conta e comece a gerar conteúdo profissional em segundos.
          </p>
          <Link to="/auth?tab=signup">
            <Button size="lg">Criar minha conta</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Social Media AI. Todos os direitos reservados.</span>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
            <a href="mailto:contato@socialmediaapreennda.lovable.app" className="hover:text-foreground transition-colors">
              Contato
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
