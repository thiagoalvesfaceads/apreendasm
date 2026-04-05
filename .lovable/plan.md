

# Trocar "cr" por "créditos" nos labels de modelo

## Mudança
Atualizar `AI_MODEL_LABELS` em `src/types/content.ts` para usar "créditos" ao invés de "cr":

```
"gemini-flash-lite": "Gemini Flash Lite — Grátis"        (sem mudança)
"gemini-flash":      "Gemini Flash — 1 crédito"
"gemini-pro":        "Gemini Pro — 3 créditos"
"gpt-4o-mini":       "GPT-4o Mini — 2 créditos"
"gpt-4o":            "GPT-4o — 5 créditos"
"claude-sonnet":     "Claude Sonnet 4 — 6 créditos"
```

Nota: "1 crédito" (singular) vs "X créditos" (plural).

Apenas 1 arquivo alterado: `src/types/content.ts`, linhas 139-146.

