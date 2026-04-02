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