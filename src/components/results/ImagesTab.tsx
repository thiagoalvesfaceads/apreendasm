import { ImageIcon, RefreshCw, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface ImagesTabProps {
  images: { label: string; url?: string }[];
  isLoading?: boolean;
  onRegenerateAll?: () => void;
  onRegenerateSingle?: (index: number) => void;
}

export function ImagesTab({ images, isLoading, onRegenerateAll, onRegenerateSingle }: ImagesTabProps) {
  const hasAnyImages = images.some((img) => img.url);

  const handleDownload = async (url: string, label: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${label.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Erro ao baixar imagem");
    }
  };

  if (isLoading) {
    return (
      <div className="card-premium p-12 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div>
          <h3 className="text-sm font-medium text-foreground/80">Gerando imagens...</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Isso pode levar alguns segundos por imagem.
          </p>
        </div>
      </div>
    );
  }

  if (!hasAnyImages) {
    return (
      <div className="card-premium p-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-primary/50" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground/80">Nenhuma imagem gerada</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Ative "Gerar Imagens Automaticamente" no formulário ou clique em gerar.
          </p>
        </div>
        {onRegenerateAll && (
          <button
            onClick={onRegenerateAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Gerar Imagens
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {onRegenerateAll && (
          <button
            onClick={onRegenerateAll}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerar todas
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, i) => (
          <div key={i} className="card-premium overflow-hidden group">
            {img.url ? (
              <div className="relative aspect-square">
                <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onRegenerateSingle && (
                    <button
                      onClick={() => onRegenerateSingle(i)}
                      className="w-8 h-8 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-foreground" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(img.url!, img.label)}
                    className="w-8 h-8 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center"
                  >
                    <Download className="w-3.5 h-3.5 text-foreground" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-secondary flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
              </div>
            )}
            <div className="p-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{img.label}</span>
              {img.url && (
                <button
                  onClick={() => handleDownload(img.url!, img.label)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  title="Baixar imagem"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
