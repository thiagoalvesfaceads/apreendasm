
Corrigir o fluxo de Encurtar/Alongar para preservar a diagramação do tom "card", em vez de transformar o body em um bloco único de texto.

1. `supabase/functions/regenerate-field/index.ts`
- Reforçar o prompt de regeneração do `body` com regras condicionais baseadas no texto atual:
  - tom `card`
  - presença de parágrafos (`\n` / `\n\n`)
  - presença de `**negrito**`
  - gancho final com `>`
- Adicionar um bloco de “REGRAS OBRIGATÓRIAS DE FORMATAÇÃO” para `shorten`, `lengthen` e `regenerate`:
  - manter múltiplos parágrafos com linha em branco entre eles
  - nunca juntar tudo em um bloco só
  - ao encurtar, reduzir dentro da estrutura atual
  - ao alongar, aprofundar sem virar parede de texto
  - preservar `**...**` quando já existir
  - preservar o gancho final com `>` quando já existir

2. `src/components/results/CarouselTab.tsx`
- Ajustar a exibição do body para respeitar quebras de linha com `whitespace-pre-wrap`, assim os parágrafos aparecem corretamente também nas visualizações fora do editor.

3. Resultado esperado
- Depois de clicar em Encurtar/Alongar, o card continua com respiro visual.
- O texto mantém parágrafos separados, sem ficar embolado.
- Se o original tiver `**negrito**` e gancho com `>`, isso continua no retorno.

## Detalhe técnico
```text
Detectar no body atual:
- hasParagraphs = /\n\s*\n/.test(slide.body)
- hasBold = /\*\*.+?\*\*/.test(slide.body)
- hasHook = slide.body.trimEnd().endsWith(">")
- isCardTone = tone === "card"

Esses sinais viram instruções condicionais no prompt da edge function.
```
