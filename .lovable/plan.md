

# Card Generator — Nova Página /card-generator

## Visão geral

Criar uma página que recebe os slides do Content Engine via `localStorage`, renderiza cada card no formato 1080x1440px usando HTML Canvas, gera imagens via edge function, e permite download individual ou em lote.

## Arquivos a criar/editar

### 1. `src/pages/CardGenerator.tsx` (novo)

Página principal com a lógica:

- **Leitura dos dados**: ao montar, lê `localStorage.getItem("card_generator_slides")` (JSON com array de slides: `slide_number`, `title`, `body`, `visual_prompt`)
- **Foto de perfil**: carrega do Supabase Storage `generated-images/profile/thiago.jpg` via `getPublicUrl`
- **Geração de imagens**: chama `supabase.functions.invoke("generate-images")` com os `visual_prompt` de cada slide
- **Canvas rendering**: para cada card, usa um `<canvas>` de 1080x1440:
  - Fundo `#000000`
  - Avatar circular (60px) com borda azul `#3b82f6` no topo esquerdo
  - Nome "Thiago Alcântara Alves" em branco bold + ícone verificado azul (desenhado no canvas)
  - "@thiagoalcantaraalves" em cinza abaixo
  - Contador "1/N" em pill cinza transparente no canto superior direito
  - Texto do card em branco, fonte grande, frases curtas
  - Imagem gerada embaixo do texto com bordas arredondadas (clip path)
- **Botão "Baixar PNG"**: `canvas.toDataURL("image/png")` → download link
- **Botão "Baixar Todos"**: itera todos os canvas e baixa sequencialmente com pequeno delay

### 2. `src/App.tsx` (editar)

Adicionar rota protegida `/card-generator` importando `CardGenerator`.

### 3. `src/pages/ContentEngine.tsx` (editar)

Após gerar carrossel (quando `result.carousel` existe), adicionar botão **"Criar Cards Visuais"** na área de resultados que:
- Salva `result.carousel.slides` em `localStorage.setItem("card_generator_slides", JSON.stringify(...))`
- Navega para `/card-generator` via `useNavigate`

## Detalhes técnicos

- A foto de perfil (`profile/thiago.jpg`) precisa ser uploaded manualmente ao bucket `generated-images`. O código apenas referencia a URL pública.
- Canvas usa `CanvasRenderingContext2D` para desenhar. Para carregar imagens externas (avatar, imagem gerada), usa `new Image()` com `crossOrigin = "anonymous"`.
- Para bordas arredondadas na imagem, usa `ctx.clip()` com `roundRect`.
- Download usa `document.createElement('a')` com `href = canvas.toDataURL()`.

