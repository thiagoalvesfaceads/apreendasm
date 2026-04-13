

## Plano: Renderizar markdown bold (`**texto**`) como HTML `<strong>` nos resultados

### Problema
Os componentes de resultado exibem `**texto**` literalmente em vez de renderizar como negrito. O canvas do CardGenerator trata isso corretamente, mas os componentes React de preview não convertem markdown bold para HTML.

### Solução
Criar uma função utilitária `renderMarkdownBold` que converte `**texto**` em `<strong>texto</strong>` e usar nos componentes que exibem texto gerado pela IA.

### Mudanças

**1. Criar `src/lib/formatText.tsx`**
- Função `renderMarkdownBold(text: string): React.ReactNode` que faz split no padrão `**...**` e retorna array de strings e `<strong>` elements

**2. `src/components/results/CarouselTab.tsx`**
- Linha 70: título `{slide.title}` → `{renderMarkdownBold(slide.title)}`
- Linha 71: body `{slide.body}` → `{renderMarkdownBold(slide.body)}`

**3. `src/components/results/CaptionTab.tsx`**
- Linha 34: caption → `{renderMarkdownBold(caption)}`
- Linha 37: cta → `{renderMarkdownBold(cta)}`

**4. `src/components/results/ReelsTab.tsx`**
- Linha 35: hook
- Linha 44: script
- Linha 77: editing_notes

### O que NÃO muda
- CardGenerator (canvas) — já funciona
- Edge functions, lógica de geração
- Nenhuma tabela ou RLS

