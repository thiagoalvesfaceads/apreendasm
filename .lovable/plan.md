

# Redesign do Content Engine — Layout Full-Screen

## Problema atual

O Content Engine usa um layout sidebar estreita (w-72) com o formulário espremido e uma área principal quase vazia quando não há resultado. O usuário quer o layout da imagem de referência (image-5.png): formulário centralizado em tela cheia, sem sidebar.

## O que será feito

Reescrever o layout do `ContentEngine.tsx` para usar **tela inteira centralizada**:

### Layout sem resultado (formulário)
- **Header/Nav** no topo: links (Usuários, Content Engine, Biblioteca, Sair) + botão Canva — em linha, alinhados à direita
- **Tabs Gerar / Colar Conteúdo** centralizadas abaixo do header
- **Título** "Content Engine MASTER" centralizado com badge dourado
- **Formulário** centralizado (max-w-2xl), campos em grid responsivo:
  - Ideia Bruta: textarea largo
  - Formato: botões toggle (Reels / Carrossel) — não select
  - Objetivo + Consciência: lado a lado em 2 colunas
  - Tom Principal: select
  - Nicho + Oferta: lado a lado
  - Número de Cards: botões numéricos (5-10) — não select
  - Seção de IA: card com Modelo de IA, toggle Gerar Imagens, Estilo Visual
- **Botão Gerar** largo no final

### Layout com resultado
- Tabs de resultado (Estratégia, Carrossel, etc.) no topo
- Conteúdo centralizado como já está

### Botão Canva
- Aparece no header/nav junto com os outros links, visível tanto no Content Engine quanto acessível

## Arquivos alterados
- `src/pages/ContentEngine.tsx` — reescrita do layout (mesma lógica, novo template)

