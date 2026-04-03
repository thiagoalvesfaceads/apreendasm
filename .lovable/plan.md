

# Novo estilo visual: Carrosséis Thiago

## Problema

Os estilos visuais existentes geram imagens genéricas. O usuário quer um estilo inspirado nas referências enviadas, com tipografia grande e impactante, imagens editoriais que complementam o texto, paleta com preto/branco e laranja como cor de destaque, e layouts variados (imagem acima do texto, texto sobre imagem, text-only com fontes enormes).

## Análise das referências

As 10 imagens mostram padrões claros:
- Tipografia display enorme, com palavras-chave em laranja (#E85D04)
- Layouts variados: imagem-topo + texto-embaixo, texto-topo + imagem-embaixo, full-bleed com texto sobreposto, text-only dramático
- Fundos alternando entre branco e preto conforme o tom do slide
- Imagens editoriais (moedas, baú, mãos, estrada) que complementam metaforicamente o texto
- Branding "THIAGO ALCÂNTARA" sempre no topo

## Mudanças

### 1. `src/types/content.ts`
- Adicionar `"carrosseis_thiago"` ao tipo `VisualStyle`
- Adicionar label `"Carrosséis Thiago"` em `VISUAL_STYLE_LABELS`

### 2. `src/pages/ContentEngine.tsx`
- Adicionar `["carrosseis thiago", "Carrosséis Thiago"]` ao array `VISUAL_STYLE_OPTIONS`

### 3. `supabase/functions/generate-content/index.ts`
- Quando `visual_style` for `"carrosseis thiago"`, usar instruções especializadas no `VISUAL_PROMPT_SYSTEM`:
  - Imagens devem ser metafóricas, não literais
  - Composição que deixe espaço para tipografia grande
  - Estilo editorial, fotografia de estoque premium, iluminação dramática
  - Alternância de mood (slides claros vs escuros)
  - Sujeitos concretos e simbólicos (objetos, mãos, paisagens, close-ups)
  - Jamais incluir texto na imagem gerada
- O prompt visual deve indicar se a imagem funciona melhor como fundo (full-bleed) ou como elemento contido (com espaço para texto acima/abaixo)

### 4. `supabase/functions/generate-images/index.ts`
- Quando `visual_style` for `"carrosseis thiago"`, ajustar o `fullPrompt` com instruções específicas: editorial premium, sem texto, composição com espaço negativo para sobreposição de tipografia

### Detalhes do prompt especializado

O novo estilo instrui a IA a gerar imagens pensando na relação imagem-texto:
- Cada prompt inclui uma tag de layout sugerido (`full-bleed`, `contained-top`, `contained-center`)
- Imagens com espaço negativo estratégico para acomodar tipografia grande
- Referências visuais concretas: "close-up de mãos segurando objeto", "paisagem com ponto de fuga central", "objeto simbólico em fundo escuro"
- Coerência de paleta entre slides (tons quentes dourados + preto)

