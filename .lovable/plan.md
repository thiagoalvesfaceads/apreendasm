

# Mover o quadrado inteiro da imagem (não só o crop interno)

## Problema
Os botões ↑↓ atuais mudam o crop *dentro* da área da imagem, mas o quadrado da imagem em si fica sempre colado logo abaixo do texto. O usuário quer poder descer/subir o **bloco inteiro** da imagem no card.

## Solução

Mudar o significado do `offsetY` para deslocar a **posição Y do quadrado da imagem** no canvas, em vez de alterar o crop interno.

### Alteração em `src/pages/CardGenerator.tsx`

**Na função `renderCard`** (~linha 204):
- Atualmente: `const imgY = cursorY;`
- Novo: `const imgY = cursorY + offsetY;` onde `offsetY` é em pixels (ex: incrementos de 20px)
- O crop interno volta a ser sempre centralizado (remover o ajuste de `sy`)
- Clampar `imgY` entre `cursorY` e `CANVAS_H - imgPadding - imgH` para não sair do canvas

**Nos botões ↑↓** (~linhas de onClick):
- Mudar incremento de `0.1` para `20` (pixels)
- Mudar limites de `[-1, 1]` para `[-200, 400]` (range em pixels)

**No crop da imagem** (~linha 216-222):
- Reverter o `sy` para centralizado fixo: `sy = (slideImg.height - sh) / 2`
- Remover uso de `offsetY` no cálculo de crop

### Resultado
- Botões ↑↓ movem o bloco visual inteiro para cima/baixo
- A imagem dentro do bloco fica sempre centralizada (cover-fit)
- O espaço entre texto e imagem fica ajustável

