

## Plano: Adicionar botão de download nas imagens geradas

### Problema
Não existe botão para baixar as imagens. O usuário só consegue ver, mas não salvar.

### Solução
Adicionar um botão de download em cada card de imagem (ao lado do botão de regenerar), visível no hover. Ao clicar, faz fetch da imagem e dispara download via `<a>` com `download` attribute.

### Mudanças em `src/components/results/ImagesTab.tsx`

1. Importar `Download` do lucide-react
2. Adicionar função `handleDownload(url, filename)` que faz fetch da URL, cria blob e dispara download
3. Adicionar botão de download no overlay do hover (ao lado do botão de regenerar), com ícone de download

Layout do overlay no hover:
```text
┌──────────────────┐
│  [imagem]        │
│         ↻  ↓    │  ← botões regenerar + download (top-right)
└──────────────────┘
│ Card 1           │
└──────────────────┘
```

### Arquivo alterado
| Arquivo | Mudança |
|---------|---------|
| `src/components/results/ImagesTab.tsx` | Adicionar botão de download com fetch+blob em cada imagem |

