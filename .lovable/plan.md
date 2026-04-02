

# Botões de regeneração por campo no Carrossel (ContentEngine)

## O que muda

Na aba "Carrossel" da `ContentEngine` (linhas 620-661), adicionar botões de ação ao lado de cada campo editável dos slides:

### 1. Título — botão "Regerar"
- Botão pequeno ao lado do label "Título"
- Chama a edge function `generate-content` com um prompt focado: regenerar apenas o título daquele slide, mantendo o contexto (role, body, estratégia)
- Atualiza via `updateSlide(slideNumber, "title", novoTitulo)`

### 2. Corpo — botões "Regerar", "Encurtar", "Alongar"  
- 3 botões pequenos ao lado do label "Corpo"
- **Regerar**: gera um body completamente novo para o slide
- **Encurtar**: pede versão mais concisa do body atual
- **Alongar**: pede versão mais aprofundada/extensa do body atual
- Todos chamam uma nova edge function (ou a existente com parâmetro de ação)

### 3. Prompt Visual — botão "Regerar"
- Botão ao lado do label "Prompt Visual"
- Gera um novo visual_prompt mantendo o contexto do slide

### Implementação

#### Nova edge function: `supabase/functions/regenerate-field/index.ts`
- Recebe: `{ field, action, slide, strategy, tone, niche, format }`
  - `field`: "title" | "body" | "visual_prompt"
  - `action`: "regenerate" | "shorten" | "lengthen" (só para body)
  - `slide`: dados do slide atual (title, body, role, emotional_goal)
  - `strategy`: estratégia completa para contexto
  - `tone`, `niche`: contexto
- Retorna: `{ value: "novo texto gerado" }`
- Usa Google AI (mesma lógica do generate-content)

#### `src/pages/ContentEngine.tsx`
- Adicionar função `regenerateField(slideNumber, field, action)` que:
  1. Mostra loading no botão
  2. Chama `supabase.functions.invoke("regenerate-field", { body: ... })`
  3. Atualiza o slide com `updateSlide(slideNumber, field, novoValor)`
- Adicionar state `regeneratingField` para controle de loading
- Adicionar os botões no JSX da aba carrossel, ao lado de cada label

#### UI dos botões
- Botões pequenos (`size="sm"`, `variant="ghost"`) com ícones:
  - Regerar: `RefreshCw` (w-3 h-3)
  - Encurtar: `Minus` 
  - Alongar: `Plus`
- Desabilitados durante loading com spinner

