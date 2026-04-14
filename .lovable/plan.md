

## Plano: Adicionar MiniMax como provider de geração de imagens

### API MiniMax Image Generation
- **Endpoint**: `POST https://api.minimax.io/v1/image_generation`
- **Model**: `image-01`
- **Auth**: `Authorization: Bearer <MINIMAX_API_KEY>`
- **Response**: `data.image_urls[]` (URLs que expiram em 24h) ou `base64`
- **Aspect ratios**: `1:1`, `3:4`, `9:16`, etc.

### Arquivos a alterar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/generate-images/index.ts` | Adicionar função `generateSingleImageMiniMax`, aceitar param `image_provider`, rotear entre Gemini e MiniMax |
| `src/hooks/useContentGeneration.ts` | Passar `image_provider` no body da chamada (baseado no ai_provider do input, ou novo campo) |
| `src/pages/ContentEngine.tsx` | Adicionar toggle/select para escolher provider de imagem (Gemini vs MiniMax) |

### Detalhes técnicos

**1. `generate-images/index.ts`**
- Nova função `generateSingleImageMiniMax(prompt, index, apiKey, supabase, timestamp, aspectRatio)`:
  - POST para `https://api.minimax.io/v1/image_generation` com `model: "image-01"`, `prompt`, `aspect_ratio: "3:4"` (para Instagram), `response_format: "base64"`, `n: 1`, `prompt_optimizer: true`
  - Decodifica base64 da resposta e faz upload para storage (mesmo padrão do Gemini)
  - Retorna URL pública
- O handler principal recebe novo campo `image_provider?: "gemini" | "minimax"` (default: `"gemini"`)
- Roteia para a função correta baseado no provider
- Usa `MINIMAX_API_KEY` (já configurada como secret)
- Para o estilo `carrosseis_thiago`, mantém Gemini (pois precisa de renderização de texto no canvas)

**2. `src/hooks/useContentGeneration.ts`**
- Passa `image_provider` no body da invocação de `generate-images`, derivado de um novo campo no `ContentInput` ou como parâmetro separado

**3. `src/pages/ContentEngine.tsx`**
- Adicionar select de "Provider de Imagem" ao lado do toggle de gerar imagens, com opções: Gemini (padrão) e MiniMax
- Passar o valor selecionado para o hook

**4. `src/types/content.ts`**
- Adicionar campo opcional `image_provider?: "gemini" | "minimax"` em `ContentInput`

### Custo
- Mantém o mesmo custo de 80 créditos por imagem independente do provider (ou ajustar se necessário)

### O que NÃO muda
- Tabelas, RLS, lógica de créditos/débito
- Geração de texto (content engine)
- Nenhuma nova secret necessária

