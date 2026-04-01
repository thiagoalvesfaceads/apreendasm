

# Plano: Adicionar aba "Colar Conteúdo" no Content Engine

## O que será feito

Adicionar um modo de entrada alternativo na sidebar do Content Engine — duas abas no topo da sidebar: **"Gerar"** (formulário atual) e **"Colar Conteúdo"** (novo).

### Aba "Colar Conteúdo"
- Textarea grande com placeholder "Cole aqui o JSON gerado pelo Claude..."
- Botão "Carregar Conteúdo"
- Ao clicar, valida o JSON, extrai `strategy`, `carousel`/`reels` e popula o `result` state
- Se o JSON tiver slides com `visual_prompt`, mostra toggle para gerar imagens automaticamente e dispara `handleGenerateImages`
- Detecção automática do formato (carousel vs reels) baseada nas chaves do JSON

### Alterações em `src/pages/ContentEngine.tsx`
1. Novo state `sidebarMode` com valores `"generate"` | `"paste"`
2. Novo state `pasteJson` para o textarea
3. Duas abas visuais no topo da sidebar para alternar entre os modos
4. No modo "paste": textarea + toggle de gerar imagens + botão "Carregar Conteúdo"
5. Função `handleLoadPasted` que faz `JSON.parse`, valida campos mínimos, seta `result`, e opcionalmente gera imagens
6. Os tabs de resultado (Estratégia, Carrossel, Legenda, etc.) continuam funcionando exatamente igual — já renderizam baseados no `result` state

### Validação do JSON
- Verifica se tem `strategy` e pelo menos `carousel` ou `reels`
- Se inválido, mostra erro claro no sidebar
- Detecta formato automaticamente para montar as tabs corretas

Nenhuma alteração em outros arquivos — tudo contido no `ContentEngine.tsx`.

