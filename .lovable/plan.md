

# Fix: desativar geração automática no CardGenerator

## Problema
No `CardGenerator.tsx` (linha 302-307), existe um `useEffect` que gera imagens automaticamente quando os slides são carregados e não há imagens em cache. Isso gasta créditos toda vez que o usuário abre a página.

## Alteração

**`src/pages/CardGenerator.tsx`** — remover o `useEffect` das linhas 302-307 que chama `generateImages()` automaticamente. As imagens só serão geradas quando o usuário clicar no botão "Regenerar Imagens" manualmente.

1 bloco removido (6 linhas).

