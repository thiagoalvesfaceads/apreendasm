

# Fix: Canva OAuth 400 Error — Add PKCE Support

## Problema

O Canva Connect API **exige PKCE** (Proof Key for Code Exchange) no fluxo OAuth. A edge function `canva-auth-url` não envia os parâmetros `code_challenge` e `code_challenge_method`, causando o erro 400.

## Solução

Implementar PKCE completo no fluxo OAuth, dividido em duas partes:

### 1. `canva-auth-url` — gerar code_verifier e code_challenge

- Gerar um `code_verifier` aleatório (string de 43-128 caracteres)
- Derivar o `code_challenge` via SHA-256 + base64url
- Adicionar `code_challenge` e `code_challenge_method=S256` nos parâmetros da URL
- Retornar o `code_verifier` junto com a URL na resposta (o frontend precisará enviá-lo de volta no callback)

### 2. `canva-callback` — enviar code_verifier no token exchange

- Receber o `code_verifier` do frontend junto com o `code`
- Incluir `code_verifier` no body do POST para `https://api.canva.com/rest/v1/oauth/token`

### 3. `src/pages/ContentEngine.tsx` — armazenar code_verifier temporariamente

- Quando o botão Canva é clicado, guardar o `code_verifier` retornado em `sessionStorage`
- No `CanvaCallback.tsx`, ler o `code_verifier` de `sessionStorage` e enviá-lo junto com o `code` para a edge function

### 4. `src/pages/CanvaCallback.tsx` — enviar code_verifier

- Ler `code_verifier` de `sessionStorage`
- Incluir no body da chamada à edge function `canva-callback`

## Arquivos alterados
- `supabase/functions/canva-auth-url/index.ts` — adicionar PKCE (code_challenge)
- `supabase/functions/canva-callback/index.ts` — adicionar code_verifier no token exchange
- `src/pages/ContentEngine.tsx` — guardar code_verifier em sessionStorage
- `src/pages/CanvaCallback.tsx` — ler e enviar code_verifier

