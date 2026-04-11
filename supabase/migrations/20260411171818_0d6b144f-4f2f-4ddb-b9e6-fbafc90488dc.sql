CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, approved)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''), true);

  INSERT INTO public.user_credits (user_id, balance, welcome_credits_granted)
  VALUES (NEW.id, 50, true);

  INSERT INTO public.usage_log (user_id, function_name, ai_model, credits_used, metadata)
  VALUES (NEW.id, 'welcome-bonus', 'system', 0,
    '{"description": "Bônus de boas-vindas — 50 créditos"}'::jsonb);

  RETURN NEW;
END;
$function$;