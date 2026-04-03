

# Alterar proporção das imagens Thiago para 3:4

## Problema
As imagens do estilo Carrosséis Thiago estão sendo geradas em 1080x1080 (1:1). O ideal para Instagram é 3:4 (1080x1440).

## Mudanças

### 1. `supabase/functions/generate-content/index.ts`
Substituir todas as referências a `1080x1080px` por `1080x1440px (proporção 3:4)` no `VISUAL_PROMPT_THIAGO_SYSTEM` e nas instruções do visual prompt request para o estilo Thiago.

### 2. `supabase/functions/generate-images/index.ts`
Na linha 25, alterar o fullPrompt do estilo Thiago de `1080x1080px` para `1080x1440px, aspect ratio 3:4 (vertical/portrait)`.

Duas substituições simples de dimensão, sem mudança de lógica.

