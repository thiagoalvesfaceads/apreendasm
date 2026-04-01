

# Fix: Usar modelo imagen-3.0-generate-002 com GOOGLE_AI_API_KEY

## Problema
O modelo `gemini-2.0-flash-preview-image-generation` não existe na API v1beta, causando 404 em todos os prompts.

## Solução
Trocar para `imagen-3.0-generate-002` usando a `GOOGLE_AI_API_KEY` já configurada nas secrets.

## Alterações em `supabase/functions/generate-images/index.ts`

1. **Endpoint**: Trocar para `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GOOGLE_AI_API_KEY}`
2. **Payload**: Trocar formato para:
```json
{
  "instances": [{ "prompt": "..." }],
  "parameters": { "sampleCount": 1, "aspectRatio": "1:1" }
}
```
3. **Parse da resposta**: Extrair imagem de `predictions[0].bytesBase64Encoded` em vez de `candidates[0].content.parts`
4. **Manter**: Upload ao bucket `generated-images`, retorno de URLs públicas, tratamento de erros 429, delay entre requests

Nenhum outro arquivo precisa ser alterado.

