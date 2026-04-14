

## Plano: Corrigir parsing do MiniMax — strip markdown fences

### Problema
O MiniMax M2.7 retorna o JSON envolto em markdown fences (`` ```json ... ``` ``), mesmo com `response_format: { type: "json_object" }`. O `JSON.parse` falha com "Unexpected token '`'".

### Solução
Adicionar limpeza de markdown fences no `callMiniMax` antes do `JSON.parse`, tanto em `generate-content` quanto em `regenerate-field`.

### Mudança (ambos os arquivos)

Na função `callMiniMax`, antes de `JSON.parse(content)`, adicionar strip de fences:

```typescript
if (typeof content === "string") {
  // Strip markdown code fences (```json ... ```)
  content = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
}
return JSON.parse(content);
```

### Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/generate-content/index.ts` | Strip markdown fences antes do JSON.parse em `callMiniMax` |
| `supabase/functions/regenerate-field/index.ts` | Mesma correção |

Redeploy das duas edge functions após a mudança.

