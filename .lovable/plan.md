

# Plano: Usar sua API Key do Google AI Studio para gerar imagens

## Problema
Seu saldo de AI no Lovable está em $1/$1 (esgotado) e pausado. Por isso a geração de imagens retorna erro 402.

## Solução
Configurar sua própria API key do Google AI Studio na Edge Function `generate-images`, chamando a API do Google diretamente em vez do gateway Lovable.

## Passos

### 1. Adicionar seu secret
Usar a ferramenta de secrets para você inserir sua `GOOGLE_AI_API_KEY` (obtida em [aistudio.google.com/apikey](https://aistudio.google.com/apikey)).

### 2. Atualizar Edge Function `generate-images`
- Trocar o endpoint de `ai.gateway.lovable.dev` para `generativelanguage.googleapis.com`
- Usar a API nativa do Gemini com `responseModalities: ["TEXT", "IMAGE"]`
- Autenticar com `?key=${GOOGLE_AI_API_KEY}` em vez de Bearer token
- Manter toda a lógica de upload para o bucket e retorno de URLs

### 3. Atualizar Edge Function `generate-content` (opcional)
- Também pode usar sua key para geração de texto, economizando créditos Lovable

## Detalhes Técnicos

**Endpoint Google:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`

**Payload:**
```text
{
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
}
```

**Resposta:** imagem em `response.candidates[0].content.parts[].inlineData.data` (base64)

