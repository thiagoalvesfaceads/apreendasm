

# Fix: Botão Canva abrindo numa nova aba

## Problema
O `window.location.href` tenta navegar para `canva.com` dentro do iframe do preview, que bloqueia a navegação. O mesmo problema pode ocorrer na versão publicada dependendo do contexto.

## Solução
Trocar `window.location.href = data.url` por `window.open(data.url, '_blank')` no `handleConnectCanva`. Isso abre o fluxo OAuth do Canva numa nova aba do navegador.

Após o utilizador autorizar no Canva, será redirecionado para `https://apreendasm.lovable.app/canva-callback`, que troca o código por tokens e salva na base de dados. Depois basta voltar à aba do Content Engine e atualizar — o estado `canvaConnected` será recalculado automaticamente via a query a `canva_tokens`.

## Alteração
- **`src/pages/ContentEngine.tsx`** linha 81: trocar `window.location.href = data.url` por `window.open(data.url, '_blank')`

## Nota
Para o fluxo funcionar completamente, o `CANVA_CLIENT_ID` e `CANVA_CLIENT_SECRET` precisam estar configurados como secrets, e o redirect URI `https://apreendasm.lovable.app/canva-callback` precisa estar registado na app do Canva.

