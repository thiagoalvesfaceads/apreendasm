

# Plano: Mover "Colar Conteúdo" para a tela inicial (/app)

## Problema atual
- O Content Engine é uma página separada (`/content-engine`) com layout de sidebar, que parece "pequeno do lado"
- A funcionalidade de "Colar Conteúdo" só aparece lá, mas deveria estar acessível na tela principal (`/app`)

## O que será feito

### 1. Adicionar aba "Colar Conteúdo" na página Index (`src/pages/Index.tsx`)
- Duas abas no topo da área de formulário: **"Gerar"** (formulário atual via `GenerationForm`) e **"Colar Conteúdo"**
- Na aba "Colar Conteúdo": textarea grande, toggle de gerar imagens, seletor de estilo visual, botão "Carregar Conteúdo"
- Ao carregar o JSON, exibir resultado usando o mesmo `ResultsView` já existente
- Reutilizar o hook `useContentGeneration` para gerar imagens dos prompts visuais

### 2. Manter o Content Engine como está
- A rota `/content-engine` continua funcionando normalmente para quem preferir o layout com sidebar

### Detalhes técnicos
- Editar apenas `src/pages/Index.tsx`
- Adicionar states para o modo (gerar/colar), JSON colado, e toggle de imagens
- Função `handleLoadPasted` faz parse, valida `strategy` + `carousel`/`reels`, e seta o resultado no state existente
- Se tiver `visual_prompt` nos slides e toggle ligado, chama `generateImages` do hook existente
- Visual consistente com o tema escuro atual

