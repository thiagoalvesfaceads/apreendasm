

# Fix: Modelo Gemini 2.0 Flash descontinuado

## Diagnóstico
O erro **não** foi causado pelas mudanças de formatação. O problema é que o modelo `gemini-2.0-flash` usado na função `generate-content` foi descontinuado pelo Google:

> "This model models/gemini-2.0-flash is no longer available to new users."

A função `regenerate-field` já usa `gemini-2.5-flash` (por isso funciona), mas `generate-content` ainda usa `gemini-2.0-flash`.

## Solução

### `supabase/functions/generate-content/index.ts`
Atualizar o modelo na função `callGoogleAI`:
- **De:** `gemini-2.0-flash`
- **Para:** `gemini-2.5-flash`

Uma única linha a alterar na URL da API (linha ~107).

