

# Integração OAuth do Canva — Edge Function + Página de Callback

## Visão geral
Criar o fluxo completo de OAuth do Canva: uma Edge Function que troca o authorization code por tokens e uma página frontend que orquestra o processo.

## 1. Tabela para armazenar tokens

Nova migration para criar `canva_tokens`:

```sql
CREATE TABLE public.canva_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.canva_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own canva tokens"
  ON public.canva_tokens FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can upsert own canva tokens"
  ON public.canva_tokens FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own canva tokens"
  ON public.canva_tokens FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
```

## 2. Edge Function `canva-callback`

Arquivo: `supabase/functions/canva-callback/index.ts`

- Recebe POST com `{ code, user_id }` (ou extrai user do JWT)
- Faz POST para `https://api.canva.com/rest/v1/oauth/token` com:
  - `grant_type: authorization_code`
  - `code`
  - `redirect_uri: https://apreendasm.lovable.app/canva-callback`
  - Authorization header: Basic base64(CANVA_CLIENT_ID:CANVA_CLIENT_SECRET)
- Faz upsert na tabela `canva_tokens` com access_token, refresh_token, expires_at
- Retorna JSON de sucesso
- Inclui CORS headers em todas as respostas

## 3. Página Frontend `/canva-callback`

Arquivo: `src/pages/CanvaCallback.tsx`

- Extrai `code` e `state` dos query params
- Mostra spinner/loading
- Chama a Edge Function via `supabase.functions.invoke("canva-callback", { body: { code } })`
- Em caso de sucesso, redireciona para `/content-engine?canva=connected`
- Em caso de erro, mostra mensagem e link para tentar novamente

## 4. Rota no App.tsx

Adicionar rota `/canva-callback` dentro de `ProtectedRoute` (o usuário precisa estar logado para vincular o token ao seu user_id).

## Arquivos alterados
- `supabase/migrations/` — nova migration (canva_tokens)
- `supabase/functions/canva-callback/index.ts` — nova edge function
- `src/pages/CanvaCallback.tsx` — nova página
- `src/App.tsx` — nova rota

