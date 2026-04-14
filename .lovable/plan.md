

## Plano: Corrigir nome do modelo MiniMax de `MiniMax-M1` para `MiniMax-M2.7`

O erro `"your current token plan not support model, MiniMax-M1"` confirma que o modelo correto é `MiniMax-M2.7`.

### Arquivos a alterar

| Arquivo | Mudança |
|---------|---------|
| `src/types/content.ts` | `apiModel: "MiniMax-M1"` → `"MiniMax-M2.7"` |
| `supabase/functions/generate-content/index.ts` | `apiModel: "MiniMax-M1"` → `"MiniMax-M2.7"` no MODEL_CONFIG |
| `supabase/functions/regenerate-field/index.ts` | `apiModel: "MiniMax-M1"` → `"MiniMax-M2.7"` no MODEL_CONFIG |

Três substituições simples de string. Redeploy das duas edge functions após a mudança.

