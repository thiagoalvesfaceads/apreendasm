

# Centralizar e permitir ajuste de posição da imagem nos cards

## Problema
A imagem no card usa cover-fit com crop centralizado, mas dependendo da imagem, o ponto focal fica cortado (ex: rosto fica pra cima demais). O usuário quer poder ajustar a posição da imagem dentro da área de recorte.

## Solução

Adicionar um controle de **posição vertical (offset Y)** por slide, permitindo mover a imagem para cima/baixo dentro da área de crop.

### Alterações em `src/pages/CardGenerator.tsx`

1. **Novo estado `imageOffsets`** — `Record<number, number>` que armazena o offset Y de cada slide (0 = centralizado, -1 = topo, +1 = base)

2. **Controles de posição na UI** — Dois botões (↑ / ↓) ao lado do botão de upload para ajustar o offset em incrementos de 0.1

3. **Ajuste no `renderCard`** — Usar o offset para deslocar o `sy` (source Y) do `drawImage`, movendo qual parte da imagem é visível dentro do crop:
   - `sy` atual centraliza: `sy = (slideImg.height - sh) / 2`
   - Com offset: `sy = (slideImg.height - sh) / 2 + offset * (slideImg.height - sh) / 2`
   - Clamped entre 0 e `slideImg.height - sh`

4. **Assinatura do `renderCard`** atualizada para receber `offsetY: number`

### UX
- Botões ↑↓ aparecem apenas quando há imagem no slide
- Offset padrão = 0 (centralizado)
- A cada clique, ajusta 10% e re-renderiza o canvas em tempo real

