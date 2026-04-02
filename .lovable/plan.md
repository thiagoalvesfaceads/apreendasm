

# Card sem imagem — redesenho automático com texto centralizado

## O que muda

### 1. `src/pages/CardGenerator.tsx` — função `renderCard`
Quando `slideImg` é `null`, em vez de simplesmente não desenhar nada no espaço restante, o card será redesenhado:
- **Título com fonte maior** (~54px em vez de 46px)
- **Body com fonte maior** (~38px em vez de 32px)
- **Texto centralizado verticalmente** no canvas: calcular a altura total do bloco de texto (título + body), depois posicionar o cursorY para que o bloco fique centrado entre o header e o rodapé do card

### 2. `src/pages/CardGenerator.tsx` — botão X no upload
Atualmente o botão de remover imagem (X) só aparece na barra de botões embaixo do card. A mudança:
- Adicionar um **botão X sobreposto no canto superior direito** do container do canvas, visível apenas quando o slide tem imagem
- Ao clicar, chama `removeImage(slide.slide_number)` — o card é automaticamente re-renderizado sem imagem (já funciona pelo `useEffect` existente)
- Manter o botão X existente na barra inferior também

### Lógica de centralização (dentro de `renderCard`)
```text
Se slideImg === null:
  1. Usar fontes maiores (título 54px, body 38px)
  2. Calcular altura total do texto (título + body)
  3. Posicionar cursorY = (CANVAS_H - alturaTotal) / 2
  4. Renderizar título e body centralizados
```

### Resultado
- Botão X aparece sobre a imagem do card para remover rapidamente
- Card sem imagem é redesenhado com texto maior e centralizado, preenchendo bem o espaço

