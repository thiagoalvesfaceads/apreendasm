

# Fix: regenerate-field usando modelo descontinuado

## Problema
A edge function `regenerate-field` usa `gemini-2.0-flash` que foi descontinuado pelo Google (`models/gemini-2.0-flash is no longer available to new users`).

## Solucao

### `supabase/functions/regenerate-field/index.ts`
Trocar o modelo de `gemini-2.0-flash` para `gemini-2.5-flash` na URL da API (linha 49):

```
gemini-2.0-flash  →  gemini-2.5-flash
```

Uma linha alterada. Sem outras mudancas.

