

# Adicionar controle de escala da imagem nos cards

## Problema
Hoje só é possível mover a imagem para cima/baixo (offset Y). O usuário quer também poder aumentar ou diminuir a área da imagem dentro do card.

## Solução

### `src/pages/CardGenerator.tsx`

1. **Novo state `imageScales`** — `Record<number, number>` com valor default `1.0` (escala 100%). Range: `0.5` a `1.5` (50% a 150% do tamanho calculado automaticamente).

2. **Atualizar `renderCard`** — receber parâmetro `scale` além de `offsetY`. Aplicar o scale no cálculo de `imgW` e `imgH`:
   - `imgW = (CANVAS_W - imgPadding * 2) * scale`
   - `imgH` ajustado proporcionalmente
   - Centralizar horizontalmente quando `scale < 1`

3. **Botões de + e −** ao lado dos botões de mover imagem (ChevronUp/Down), usando ícones `ZoomIn` / `ZoomOut` ou `Plus` / `Minus`:
   - "−" diminui scale em 0.1 (min 0.5)
   - "+" aumenta scale em 0.1 (max 1.5)

4. **Passar `imageScales`** no `useEffect` de renderização, junto com `imageOffsets`.

Mudança contida em um único arquivo. Sem impacto em outros componentes.

