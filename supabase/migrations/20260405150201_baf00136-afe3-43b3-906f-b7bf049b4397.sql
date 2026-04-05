
-- Tabela de saldo de créditos
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  balance integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own credits" ON public.user_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Log de uso
CREATE TABLE public.usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  ai_model text NOT NULL,
  credits_used integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usage" ON public.usage_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Função atômica para debitar créditos
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

-- Atualizar handle_new_user para dar 100 créditos grátis e aprovar automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, approved)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''), true);
  INSERT INTO public.user_credits (user_id, balance) VALUES (NEW.id, 100);
  RETURN NEW;
END; $$;
