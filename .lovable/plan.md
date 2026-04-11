

## Plano: Criar tabela de pacotes e lógica de boas-vindas no banco

### 1. Migration — Criar tabela `credit_packages`

```sql
CREATE TABLE public.credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credits integer NOT NULL,
  price_cents integer NOT NULL,
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa autenticada pode ler pacotes ativos
CREATE POLICY "Anyone can read active packages"
  ON public.credit_packages FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins podem gerenciar pacotes
CREATE POLICY "Admins can manage packages"
  ON public.credit_packages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

### 2. Migration — Popular os 4 pacotes

```sql
INSERT INTO public.credit_packages (name, credits, price_cents, description) VALUES
  ('Starter', 500, 500, '~25 gerações básicas'),
  ('Criador', 2000, 1800, '~3 carrosséis completos com imagem'),
  ('Pro', 5000, 4000, 'Uso intenso, criador profissional'),
  ('Agência', 15000, 9900, 'Múltiplos perfis e clientes');
```

### 3. Migration — Adicionar `welcome_credits_granted` à `user_credits`

```sql
ALTER TABLE public.user_credits
  ADD COLUMN welcome_credits_granted boolean NOT NULL DEFAULT false;
```

### 4. Migration — Atualizar função `handle_new_user`

Substitui a função existente para:
- Dar 100 créditos iniciais (em vez de 0)
- Marcar `welcome_credits_granted = true`
- Registrar na `usage_log` com function_name `welcome-bonus`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, approved)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''), true);

  INSERT INTO public.user_credits (user_id, balance, welcome_credits_granted)
  VALUES (NEW.id, 100, true);

  INSERT INTO public.usage_log (user_id, function_name, ai_model, credits_used, metadata)
  VALUES (NEW.id, 'welcome-bonus', 'system', 0,
    '{"description": "Bônus de boas-vindas"}'::jsonb);

  RETURN NEW;
END;
$$;
```

### 5. Recriar trigger (se não existir)

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 6. Atualizar memória do projeto

Adicionar referência aos pacotes e boas-vindas no `mem://features/credits`.

### O que NÃO muda
- Nenhuma tela ou componente frontend
- Lógica de débito existente
- Edge functions existentes

