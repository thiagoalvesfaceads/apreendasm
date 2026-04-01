import { GenerationForm } from "@/components/GenerationForm";
import { ResultsView } from "@/components/ResultsView";
import { useContentGeneration } from "@/hooks/useContentGeneration";

const Index = () => {
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

  if (result) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <ResultsView
          content={result}
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
      <GenerationForm onSubmit={generate} isGenerating={isGenerating} />
    </div>
  );
};

export default Index;
