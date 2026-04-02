

# Edição inline de slides + regeneração individual de imagem

## O que muda

### 1. Tornar slides editáveis na aba "Carrossel" (`ContentEngine.tsx`)
- Cada slide terá campos editáveis inline para **título**, **body** e **visual_prompt**
- Ao clicar no texto, ele vira um `textarea`/`input` editável. Ao sair (blur), salva no `result`
- Adicionar botão de regenerar imagem individual em cada slide (já existe `handleRegenerateSlide` — basta conectar com o prompt editado)

### 2. Edição do prompt visual na aba "Prompts Visuais"
- Tornar cada prompt editável inline (textarea com blur-save)
- Mudança no prompt reflete automaticamente no `result.carousel.slides[n].visual_prompt`

### 3. Regeneração individual na aba "Imagens"
- Já existe `handleRegenerateSlide` — ele usa o `visual_prompt` do slide atual
- Como o prompt é editável, regenerar usará o prompt atualizado automaticamente

### 4. Geração sob demanda (1 por 1) na aba "Imagens"
- Desativar geração automática de todas as imagens por padrão
- Na aba "Imagens", cada slide mostra um botão "Gerar" quando não tem imagem, e "Regenerar" quando já tem
- Manter botão "Gerar Todas" como opção, mas não automático

## Arquivos alterados

- **`src/pages/ContentEngine.tsx`**:
  - Criar função `updateSlideField(slideNumber, field, value)` que atualiza `result.carousel.slides` no state
  - Na seção "Carrossel" (linha ~607): trocar texto estático por inputs editáveis para `title`, `body`, `visual_prompt`
  - Na seção "Prompts Visuais" (linha ~647): trocar texto do prompt por textarea editável
  - Na seção "Imagens" (linha ~686): adicionar botão "Gerar" individual para slides sem imagem
  - Mudar `form.generateImages` default para `false`

