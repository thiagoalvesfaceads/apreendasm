

## Plano: Simplificar para apenas MiniMax + remover "Colar Conteúdo" + mostrar custo nos botões de regeneração

### 1. Remover modo "Colar Conteúdo" (`src/pages/ContentEngine.tsx`)
- Remover estado `mode`, `pasteJson`, `pasteGenerateImages`, `pasteVisualStyle`
- Remover funções `handleLoadPasted` e `handleGenerateImagesForPaste`
- Remover o seletor de tabs "Gerar / Colar Conteúdo" e todo o bloco JSX do modo paste
- Remover ícone `ClipboardPaste` do import

### 2. Manter apenas MiniMax 2.7 (texto e imagem)

**Frontend — `src/types/content.ts`**
- `AIProvider` = `"minimax"` apenas
- `AIModel` = `"minimax-m2"` apenas
- `AI_MODEL_INFO`, `AI_MODEL_LABELS`, `AI_PROVIDER_LABELS` reduzidos a uma entrada
- Remover `ImageProvider` (não há mais escolha — sempre MiniMax)
- Remover `IMAGE_PROVIDER_LABELS`

**Frontend — `src/pages/ContentEngine.tsx`**
- Remover do estado `aiModel` e `imageProvider` (fixar internamente como `"minimax-m2"`)
- Remover `AI_MODEL_OPTIONS` e qualquer dropdown/seletor de modelo de IA no formulário
- Remover seletor de "Provedor de Imagem" se existir
- No `body` enviado para edge functions, fixar `ai_model: "minimax-m2"`

**Frontend — `src/components/GenerationForm.tsx`**
- Remover estado `aiModel`, dropdown "Modelo de IA (Texto)" e imports relacionados (`AI_MODEL_LABELS`, `AI_MODEL_INFO`)
- Fixar no submit: `ai_provider: "minimax"`, `ai_model: "minimax-m2"`

**Frontend — `src/hooks/useCredits.ts`**
- `CREDIT_COSTS["generate-content"]` = apenas `{ "minimax-m2": 25 }`
- Manter `generate-images: 80` e `regenerate-field: 8`

**Backend — `supabase/functions/generate-content/index.ts`**
- Remover `callGoogleAI`, `callOpenAI`, `callAnthropic`
- `MODEL_CONFIG` = só `"minimax-m2"`
- `callAI` simplificado para chamar apenas MiniMax
- Default `ai_model = "minimax-m2"`
- Remover bloco "Block Claude for welcome-only users" (não há mais Claude)

**Backend — `supabase/functions/regenerate-field/index.ts`**
- Mesma limpeza: remover Google/OpenAI/Anthropic callers
- `MODEL_CONFIG` reduzido a `"minimax-m2"`
- Default `ai_model = "minimax-m2"`

**Backend — `supabase/functions/generate-images/index.ts`**
- Remover branch de Gemini (`generateSingleImage` para Thiago e estilos não-Thiago)
- Usar `generateSingleImageMiniMax` para todos os estilos (incluindo `carrosseis_thiago`)
- Remover dependência de `GOOGLE_AI_API_KEY`

### 3. Mostrar custo em todos os botões de gerar/regenerar

**Custos a exibir (de `useCredits.ts`):**
- Geração de texto: **25 créditos** (MiniMax)
- Regeneração de campo (título/corpo/encurtar/alongar/prompt visual): **8 créditos** cada
- Geração/regeneração de imagem: **80 créditos** por imagem

**Botões a atualizar em `src/pages/ContentEngine.tsx`:**
- Botão principal "Gerar Conteúdo" → `Gerar Conteúdo · 25 cr` (somar 80×N se "Gerar imagens" estiver ligado)
- Botões "Regerar" (título), "Regerar/Encurtar/Alongar" (corpo), "Regerar" (prompt visual) → adicionar `· 8 cr` ao label
- Botão "Regenerar imagem" do slide → `· 80 cr`
- Botão "Gerar imagens" (em massa) no painel de imagens → `· {N×80} cr`

**Botões em `src/components/GenerationForm.tsx`:**
- Botão "Gerar Conteúdo MASTER" → mostrar custo dinâmico (`25 + (generate_images ? cards × 80 : 0)`)

**Botões em `src/components/results/ImagesTab.tsx` e `CarouselTab.tsx`:**
- "Regenerar todas" → `· {N×80} cr`
- "Regenerar" individual (ícone) → tooltip `Regenerar · 80 cr`
- Em `CarouselTab` o botão de regenerar slide → tooltip `Regenerar imagem · 80 cr`

### 4. O que NÃO muda
- Geração de imagens continua existindo (só muda o provider para MiniMax)
- Estrutura de banco, créditos, autenticação, biblioteca, pagamentos — tudo intacto
- Secrets `GOOGLE_AI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` continuam armazenados (sem uso, mas sem remover)

### Arquivos alterados
| Arquivo | Ação |
|---------|------|
| `src/pages/ContentEngine.tsx` | Remover modo paste, seletor IA, mostrar custo nos botões |
| `src/components/GenerationForm.tsx` | Remover seletor IA, mostrar custo no botão |
| `src/components/results/ImagesTab.tsx` | Mostrar custo nos botões de regenerar |
| `src/components/results/CarouselTab.tsx` | Mostrar custo no botão de regenerar slide |
| `src/types/content.ts` | Reduzir AIModel/AIProvider a MiniMax |
| `src/hooks/useCredits.ts` | Simplificar tabela de custos |
| `supabase/functions/generate-content/index.ts` | Remover Google/OpenAI/Anthropic |
| `supabase/functions/regenerate-field/index.ts` | Remover Google/OpenAI/Anthropic |
| `supabase/functions/generate-images/index.ts` | Usar só MiniMax (remover Gemini) |

