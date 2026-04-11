

## Plano: Integração completa Asaas para compra de créditos

### 1. Migration — Criar tabela `payments`

```sql
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  package_id uuid NOT NULL REFERENCES public.credit_packages(id),
  asaas_payment_id text,
  asaas_customer_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all payments"
  ON public.payments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

### 2. Criar edge function `process-payment`

**`supabase/functions/process-payment/index.ts`**

Lógica:
1. Recebe `{ package_id }` (user_id extraído do JWT)
2. Valida JWT, busca email do usuário no `profiles`
3. Busca pacote em `credit_packages`
4. Chama Asaas API (sandbox): `POST https://sandbox.asaas.com/api/v3/customers` para criar/buscar customer pelo email
5. Cria cobrança PIX: `POST https://sandbox.asaas.com/api/v3/payments` com `billingType: "PIX"`, `externalReference: user_id`
6. Busca QR code PIX: `GET https://sandbox.asaas.com/api/v3/payments/{id}/pixQrCode`
7. Insere registro em `payments` com status `pending`
8. Retorna `{ paymentId, pixQrCode, pixCopyPaste, expirationDate }`

### 3. Atualizar edge function `asaas-webhook`

Melhorar para:
- Buscar pagamento na tabela `payments` pelo `asaas_payment_id` (em vez de só por preço)
- Atualizar `payments.status = 'confirmed'`
- Creditar saldo via incremento direto (manter lógica atual)
- Manter fallback por `externalReference` se não encontrar na tabela

### 4. Atualizar `src/pages/Pricing.tsx`

- Botão "Comprar" (habilitado para usuários logados) chama `process-payment`
- Abre modal/dialog com QR code PIX (imagem base64 + texto copiável)
- Instrução: "Escaneie o QR code ou copie o código PIX. Os créditos caem automaticamente."
- Polling: a cada 5s consulta `payments` pelo ID para verificar se status mudou para `confirmed`
- Quando confirmado: fecha modal, atualiza saldo, mostra toast de sucesso
- Para não logados: botão redireciona para `/auth?tab=signup`

### 5. Permitir leitura de `credit_packages` para anônimos

Migration adicional — a RLS atual exige `authenticated`. Adicionar policy para `anon`:
```sql
CREATE POLICY "Anyone can read active packages (anon)"
  ON public.credit_packages FOR SELECT TO anon
  USING (is_active = true);
```
(Necessário para a página /pricing funcionar sem login)

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/...` | Criar tabela `payments` + RLS + policy anon |
| `supabase/functions/process-payment/index.ts` | Criar (novo) |
| `supabase/functions/asaas-webhook/index.ts` | Atualizar |
| `src/pages/Pricing.tsx` | Atualizar com modal PIX + polling |

### Variáveis de ambiente

`ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` já estão configurados como secrets.

### O que NÃO muda
- Sistema de créditos, modelos, custos
- Outras edge functions
- Outras páginas do app

