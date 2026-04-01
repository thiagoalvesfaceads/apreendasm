import { GenerationForm } from "@/components/GenerationForm";
import { ResultsView } from "@/components/ResultsView";
import { useContentGeneration } from "@/hooks/useContentGeneration";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Users, BookOpen, Zap } from "lucide-react";

const Index = () => {
  const { isAdmin, signOut } = useAuth();
  const {
    isGenerating,
    isGeneratingImages,
    result,
    generate,
    setResult,
    regenerateImages,
    regenerateCaption,
    regenerateSlide,
  } = useContentGeneration();

  const topBar = (
    <div className="max-w-4xl mx-auto flex items-center justify-end gap-2 mb-4 px-4">
      {isAdmin && (
        <Link to="/admin/users">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            Usuários
          </Button>
        </Link>
      )}
      <Link to="/content-engine">
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <Zap className="w-4 h-4" />
          Content Engine
        </Button>
      </Link>
      <Link to="/library">
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <BookOpen className="w-4 h-4" />
          Biblioteca
        </Button>
      </Link>
      <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground">
        <LogOut className="w-4 h-4" />
        Sair
      </Button>
    </div>
  );

  if (result) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        {topBar}
        <ResultsView
          content={result}
          isGeneratingImages={isGeneratingImages}
          onBack={() => setResult(null)}
          onRegenerate={() => generate(result.input)}
          onRegenerateImages={regenerateImages}
          onRegenerateCaption={regenerateCaption}
          onRegenerateSlide={regenerateSlide}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      {topBar}
      <GenerationForm onSubmit={generate} isGenerating={isGenerating} />
    </div>
  );
};

export default Index;
