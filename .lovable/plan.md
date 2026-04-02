

# Fix: desativar geração automática no modo "Colar JSON"

## Problema
O `generateImages` do formulário principal já está `false`, mas o toggle do modo "Colar JSON" (`pasteGenerateImages`) tem default `true` (linha 105). Quando o conteúdo é colado, as imagens são geradas automaticamente.

## Alteração

**`src/pages/ContentEngine.tsx`** (linha 105):
- Mudar `pasteGenerateImages` default de `true` para `false`

Apenas 1 linha alterada.

