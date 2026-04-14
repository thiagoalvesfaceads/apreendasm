

## Plano: Adicionar MiniMax como provider de IA

### Arquivos a alterar

| Arquivo | Mudança |
|---------|---------|
| `src/types/content.ts` | Adicionar `minimax` ao `AIProvider`, `minimax-m2` ao `AIModel`, entries nos maps |
| `supabase/functions/generate-content/index.ts` | Adicionar `minimax` ao provider type, MODEL_CONFIG, `callMiniMax` (com `response_format: json_object`), case no router |
| `supabase/functions/regenerate-field/index.ts` | Mesmas alterações (sem `response_format` json) |
| `src/hooks/useCredits.ts` | Adicionar `minimax-m2: 25` nos custos |

### Detalhes técnicos

**1. `src/types/content.ts`**
- `AIProvider`: adicionar `"minimax"`
- `AIModel`: adicionar `"minimax-m2"`
- `AI_MODEL_INFO`: `"minimax-m2": { label: "MiniMax M2", provider: "minimax", apiModel: "MiniMax-M1", cost: 25 }`
- `AI_MODEL_LABELS`: `"minimax-m2": "MiniMax M2 — 25 créditos"`
- `AI_PROVIDER_LABELS`: `minimax: "MiniMax M2"`

**2. `generate-content/index.ts`**
- Provider type: `"google" | "openai" | "anthropic" | "minimax"`
- MODEL_CONFIG: `"minimax-m2": { provider: "minimax", apiModel: "MiniMax-M1", cost: 25 }`
- Nova função `callMiniMax` — POST para `https://api.minimax.io/v1/text/chatcompletion_v2`, formato OpenAI-compatível com `response_format: { type: "json_object" }`, retorna `JSON.parse(data.choices[0].message.content)`
- Router: case `"minimax"` usando `MINIMAX_API_KEY`

**3. `regenerate-field/index.ts`**
- Mesma estrutura, mas `callMiniMax` **sem** `response_format` (retorna texto puro como os outros providers nesta function)
- MODEL_CONFIG: `"minimax-m2": { provider: "minimax", apiModel: "MiniMax-M1", cost: 5 }` (custos do regenerate são menores)

**4. `src/hooks/useCredits.ts`**
- Adicionar `"minimax-m2": 25` em `CREDIT_COSTS["generate-content"]`

### Secret
`MINIMAX_API_KEY` já existe configurada — nenhuma ação necessária.

### O que NÃO muda
- Tabelas, RLS, webhook
- Lógica de créditos/débito
- Outras edge functions

