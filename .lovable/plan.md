

# Adicionar tom "Card" ao Content Engine

## O que é
Novo tom principal chamado **"Card"** que gera copy mais profunda e extensa por slide — no estilo do Alfredo Soares nas imagens: parágrafos narrativos densos, storytelling progressivo, cada card com várias frases/parágrafos (não só uma frase curta).

## Alterações

### 1. `src/types/content.ts`
- Adicionar `"card"` ao tipo `ContentTone`
- Adicionar `card: "Card"` ao `TONE_LABELS`

### 2. `src/pages/ContentEngine.tsx`
- Adicionar `["card", "Card"]` ao `TONE_OPTIONS` (linha 28)
- Adicionar `card: "card"` ao `TONE_MAP` (linha 20)

### 3. `src/components/GenerationForm.tsx`
- Já usa o tipo `ContentTone` dinamicamente, deve funcionar sem mudança

### 4. `supabase/functions/generate-content/index.ts`
- No `CAROUSEL_SYSTEM`, adicionar instrução condicional para tom "card": quando o tom for "card", o `body` de cada slide deve ser longo (3-6 parágrafos), narrativo, com storytelling, como post de LinkedIn/Instagram de autoridade. Cada card é um micro-texto completo.
- No prompt do carrossel (linha ~240), passar o tom e adicionar instrução extra quando `tone === "card"`:
  - "Cada slide deve ter um body extenso com 3 a 6 parágrafos narrativos. Use storytelling, frases de impacto, progressão emocional. O estilo é de posts de autoridade no Instagram — como se cada card fosse um micro-post completo. Não use frases genéricas. Cada parágrafo deve ter peso próprio."

### Resultado
- Novo tom "Card" aparece no select de tom principal
- Quando selecionado, a IA gera body muito mais denso e narrativo por slide, no estilo das imagens do Alfredo Soares

