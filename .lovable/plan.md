

# Fix: Cards 2 e 4 não renderizam negrito corretamente

## Problema

O modelo AI às vezes retorna marcações de negrito inconsistentes — por exemplo, `*"texto"*` (asterisco simples) em vez de `**texto**` (duplo). O código de renderização no canvas (`drawFormattedLine`, `measureFormattedWidth`, `wrapText`) só reconhece `**...**`, então variações são exibidas como texto cru.

## Solução

Adicionar uma função de normalização de markdown em `src/pages/CardGenerator.tsx` que é aplicada ao body de cada slide **antes** da renderização no canvas:

1. Converter `*texto*` (itálico simples) para `**texto**` (negrito) — no contexto de cards, toda ênfase deve ser negrito
2. Limpar padrões malformados como `**"texto"**` → `**texto**`  
3. Remover asteriscos órfãos que não fecham

### Arquivo: `src/pages/CardGenerator.tsx`

Criar função `normalizeMarkdownBold(text: string): string` que:
- Converte `*texto*` (não-duplo) para `**texto**`
- Remove aspas internas desnecessárias dentro de negritos
- É chamada no body do slide antes de passar para `wrapText` e `drawFormattedLine`

Aplicar também no `measureFormattedWidth` para manter consistência entre medição e desenho.

