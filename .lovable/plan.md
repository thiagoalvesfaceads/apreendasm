

# Fase 1: Sistema de Créditos + Auth Social + Tracking de Uso

## Visão Geral
Implementar o modelo estilo Higgsfield: acesso livre, créditos como moeda interna, custo exibido antes de cada ação, dashboard de uso. Auth social (Google + Apple). Pagamento fica para a Fase 2.

## Tabela de Custos (cobrado ao usuário — 2x do real)

| Ação | Custo real estimado | Créditos cobrados |
|------|--------------------|--------------------|
| Gerar texto (Gemini Flash Lite) | ~R$ 0.00 | 0 (gratuito) |
| Gerar texto (Gemini Flash) | ~R$ 0.01 | 1 crédito |
| Gerar texto (GPT-4o) | ~R$ 0.05 | 5 créditos |
| Gerar texto (Claude Sonnet) | ~R$ 0.06 | 6 créditos |
| Gerar 1 imagem | ~R$ 0.36 | 36 créditos |
| Regenerar 1 campo de slide | ~R$ 0.01 | 1 crédito |

**1 crédito = R$ 0.01** (simplifica a conta). Usuário novo ganha 100 créditos grátis (R$ 1.00 — suficiente para testar).

## Mudanças

### 1. Database — Migration

```sql
-- Tabela de saldo
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
-- Usuário lê próprio saldo
CREATE POLICY "Users read own credits" ON public.user_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Log de uso
CREATE TABLE public.usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  ai_model text NOT NULL,
  credits_used integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usage" ON public.usage_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Função atômica para debitar
CREATE OR REPLACE FUNCTION public.debit_credits(p_user_id uuid, p_amount integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_balance integer;
BEGIN
  UPDATE user_credits SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id AND balance >= p_amount
  RETURNING balance INTO current_balance;
  IF NOT FOUND THEN RAISE EXCEPTION 'INSUFFICIENT_CREDITS'; END IF;
  RETURN current_balance;
END; $$;

-- Atualizar handle_new_user para criar créditos iniciais
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, approved)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''), true);
  INSERT INTO public.user_credits (user_id, balance) VALUES (NEW.id, 100);
  RETURN NEW;
END; $$;
```

### 2. Auth Social — Google + Apple

- Ativar Google e Apple via `cloud--configure_auth`
- Instalar `@lovable.dev/cloud-auth-js` e usar `lovable.auth.signInWithOAuth()`
- Adicionar botões "Entrar com Google" e "Entrar com Apple" na página `Auth.tsx`
- Remover lógica de aprovação manual: novos usuários já entram com `approved = true`
- Atualizar `useAuth.ts`: remover `checkProfile` (approved), manter `isAdmin`
- Atualizar `ProtectedRoute.tsx`: remover check de approved

### 3. Edge Functions — Verificar e debitar créditos

**Tabela de preços hardcoded** nas edge functions:

```typescript
const CREDIT_COSTS = {
  "generate-content": {
    "google": 0,      // gemini flash lite = gratuito
    "openai": 5,
    "anthropic": 6,
  },
  "generate-images": 36,  // por imagem
  "regenerate-field": {
    "google": 0,
    "openai": 1,
    "anthropic": 1,
  },
};
```

Em cada edge function:
1. Extrair user_id do JWT (Authorization header)
2. Calcular custo total antes de chamar a IA
3. Se custo > 0: chamar `debit_credits(user_id, custo)` — falha se saldo insuficiente
4. Após sucesso, inserir em `usage_log`
5. Retornar `credits_used` e `balance` no response

### 4. Frontend — Exibir custos e saldo

**Header do ContentEngine** — badge com saldo atual (ex: "💰 64 créditos")

**Formulário de geração** — antes do botão "Gerar":
- Mostrar estimativa: "Esta geração vai custar X créditos" (texto = Y + imagens = Z × 36)
- Modelos gratuitos com badge "Grátis"
- Modelos pagos com badge do custo

**Novo hook `useCredits()`**:
- Busca saldo do usuário
- Função para refresh após cada geração
- Recebe `credits_used` e `balance` do response da edge function

### 5. Dashboard de Uso — nova página `/usage`

- Saldo atual em destaque
- Tabela com histórico de uso (data, função, modelo, créditos)
- Filtro por período
- Totalizador: "Você gastou X créditos nos últimos 30 dias"
- Link na navegação

### 6. Rota e navegação

- Adicionar `/usage` no `App.tsx` com `ProtectedRoute`
- Adicionar link "Uso" na nav do ContentEngine e no Index

## Ordem de implementação

1. Migration (tabelas + funções + trigger atualizado)
2. Auth social (Google + Apple) + remover aprovação
3. Hook `useCredits` + exibir saldo no header
4. Edge functions (verificar/debitar créditos em generate-content, generate-images, regenerate-field)
5. Estimativa de custo no formulário
6. Página `/usage` com dashboard

