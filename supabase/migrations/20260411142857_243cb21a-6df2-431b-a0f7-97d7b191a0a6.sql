
-- 1. Criar tabela credit_packages
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

CREATE POLICY "Anyone can read active packages"
  ON public.credit_packages FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage packages"
  ON public.credit_packages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 2. Popular pacotes
INSERT INTO public.credit_packages (name, credits, price_cents, description) VALUES
  ('Starter', 500, 500, '~25 gerações básicas'),
  ('Criador', 2000, 1800, '~3 carrosséis completos com imagem'),
  ('Pro', 5000, 4000, 'Uso intenso, criador profissional'),
  ('Agência', 15000, 9900, 'Múltiplos perfis e clientes');

-- 3. Adicionar welcome_credits_granted
ALTER TABLE public.user_credits
  ADD COLUMN IF NOT EXISTS welcome_credits_granted boolean NOT NULL DEFAULT false;

-- 4. Atualizar handle_new_user com 100 créditos + log
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

-- 5. Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
