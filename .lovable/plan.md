

# Fix: botão Gemini bloqueado pelo navegador

## Problema
O `window.open()` é chamado depois de `await navigator.clipboard.writeText()`. Quando o clipboard demora, o navegador perde o contexto de "ação do usuário" e bloqueia o pop-up.

## Solucao

### `src/pages/ContentEngine.tsx`
No onClick do botão "Gerar imagens no Gemini", inverter a ordem:
1. **Primeiro** `window.open(url, "_blank")` — ainda dentro do contexto síncrono do clique
2. **Depois** `navigator.clipboard.writeText(...)` — pode ser async sem problema

Mesma mudanca em `src/components/results/VisualPromptsTab.tsx` se o botão existir lá também.

### Resultado
Pop-up nunca será bloqueado porque `window.open` executa sincronamente no handler do clique.

