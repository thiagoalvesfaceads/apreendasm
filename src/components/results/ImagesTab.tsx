import { ImageIcon, RefreshCw } from "lucide-react";

interface ImagesTabProps {
  images: { label: string; url?: string }[];
  onRegenerateAll?: () => void;
  onRegenerateSingle?: (index: number) => void;
}

export function ImagesTab({ images, onRegenerateAll, onRegenerateSingle }: ImagesTabProps) {
  const hasAnyImages = images.some((img) => img.url);

  if (!hasAnyImages) {
    return (
      <div className="card-premium p-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-primary/50" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground/80">Nenhuma imagem gerada</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Ative "Gerar Imagens Automaticamente" no formulário ou clique em regenerar.
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
                {onRegenerateSingle && (
                  <button
                    onClick={() => onRegenerateSingle(i)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-foreground" />
                  </button>
                )}
              </div>
            ) : (
              <div className="aspect-square bg-secondary flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
              </div>
            )}
            <div className="p-3">
              <span className="text-xs text-muted-foreground">{img.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
