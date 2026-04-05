

# Remover créditos iniciais gratuitos

## Problema
A última migração dá 500 créditos grátis para novos usuários. Você quer que créditos só venham via pagamento.

## Mudança

### 1. Nova migração — zerar créditos iniciais
Alterar `handle_new_user()` para dar **0 créditos** ao invés de 500:

```sql
INSERT INTO public.user_credits (user_id, balance) VALUES (NEW.id, 0);
```

### 2. Atualizar memória
Remover menção a "500 créditos grátis" do `mem://features/credits`.

Apenas 1 migração SQL. Nenhuma mudança no frontend.

