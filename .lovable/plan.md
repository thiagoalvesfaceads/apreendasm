

# Expandir modelos de IA com custos específicos (usando suas APIs)

## Resumo
Trocar a seleção genérica "Google / OpenAI / Anthropic" por modelos específicos com custo visível. Continua usando suas próprias API keys — sem Lovable AI Gateway.

## Modelos disponíveis

| Modelo | ID interno | Provider | API Model | Créditos |
|--------|-----------|----------|-----------|----------|
| Gemini 2.5 Flash Lite | `gemini-flash-lite` | google | `gemini-2.5-flash-lite` | 0 (grátis) |
| Gemini 2.5 Flash | `gemini-flash` | google | `gemini-2.5-flash` | 1 |
| Gemini 2.5 Pro | `gemini-pro` | google | `gemini-2.5-pro` | 3 |
| GPT-4o Mini | `gpt-4o-mini` | openai | `gpt-4o-mini` | 2 |
| GPT-4o | `gpt-4o` | openai | `gpt-4o` | 5 |
| Claude Sonnet 4 | `claude-sonnet` | anthropic | `claude-sonnet-4-20250514` | 6 |

## Mudanças

### 1. `src/types/content.ts`
- Substituir `AIProvider` por `AIModel` com os 6 valores acima
- Criar `AI_MODEL_LABELS` com nome + custo (ex: `"Gemini Flash Lite — Grátis"`)
- Criar `AI_MODEL_INFO` com mapeamento: `{ provider, apiModel, cost }`
- Atualizar `ContentInput` para usar `ai_model` no lugar de `ai_provider`

### 2. `src/components/GenerationForm.tsx`
- Trocar o select de "Modelo de IA" para listar os 6 modelos específicos
- Cada opção mostra nome + badge de custo (ex: "2 cr" ou "Grátis")
- Default: `gemini-flash-lite` (grátis)

### 3. `src/hooks/useCredits.ts`
- Atualizar `CREDIT_COSTS["generate-content"]` com os 6 modelos
- Atualizar `estimateCost` para receber `ai_model` ao invés de `ai_provider`

### 4. `src/hooks/useContentGeneration.ts`
- Enviar `ai_model` ao invés de `ai_provider` na chamada à edge function

### 5. `supabase/functions/generate-content/index.ts`
- Criar mapa `MODEL_CONFIG` que traduz o `ai_model` do request para `{ provider, apiModel, cost }`
- Nas funções `callGoogleAI`, `callOpenAI`, `callAnthropic`: aceitar o modelo como parâmetro (não hardcoded)
- Atualizar `callGoogleAI` para usar o model name dinâmico na URL
- Atualizar `callOpenAI` para usar o model name dinâmico no body
- Manter `callAnthropic` com modelo fixo (só tem 1 opção)
- Atualizar `CREDIT_COSTS` no backend com os 6 valores

### 6. `supabase/functions/regenerate-field/index.ts`
- Mesma mudança: aceitar `ai_model`, mapear para provider + modelo específico
- Atualizar custos (todos continuam 1 crédito por regeneração)

### 7. Re-deploy das 2 edge functions

## Custo real estimado por geração (para calcular sua margem)

| Modelo | Custo API (texto, ~2k tokens) | Créditos cobrados | Sua receita (1cr = R$0,01) |
|--------|-------------------------------|-------------------|---------------------------|
| Gemini Flash Lite | ~R$0,00 (free tier) | 0 | R$0,00 |
| Gemini Flash | ~R$0,001 | 1 = R$0,01 | ~R$0,009 |
| Gemini Pro | ~R$0,02 | 3 = R$0,03 | ~R$0,01 |
| GPT-4o Mini | ~R$0,003 | 2 = R$0,02 | ~R$0,017 |
| GPT-4o | ~R$0,03 | 5 = R$0,05 | ~R$0,02 |
| Claude Sonnet | ~R$0,04 | 6 = R$0,06 | ~R$0,02 |

*Valores aproximados para ~2000 tokens de entrada + ~1500 de saída por chamada. Generate-content faz 2-3 chamadas por geração.*

