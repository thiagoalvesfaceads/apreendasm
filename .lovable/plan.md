

## Plano: Corrigir erro Asaas (CPF obrigatório) + Adicionar pagamento por cartão

### Problema 1 — Erro 500
Os logs do Asaas mostram: **"Para criar esta cobrança é necessário preencher o CPF ou CNPJ do cliente."** O Asaas exige CPF/CNPJ para criar cobranças. Atualmente o customer é criado só com nome e email.

### Problema 2 — Só PIX
O usuário quer opção de pagar com cartão de crédito também, não apenas PIX.

### Solução

**1. Frontend — `src/pages/Pricing.tsx`**
- Adicionar campo de **CPF/CNPJ** no modal de pagamento (input com máscara)
- Adicionar seleção de **método de pagamento**: PIX ou Cartão de Crédito
- Para cartão: adicionar campos de número, validade, CVV e nome no cartão
- Enviar `cpfCnpj`, `billingType` ("PIX" ou "CREDIT_CARD") e dados do cartão (se aplicável) para a edge function

**2. Edge function — `supabase/functions/process-payment/index.ts`**
- Receber `cpfCnpj` e `billing_type` do body
- Passar `cpfCnpj` ao criar customer no Asaas
- Se `billing_type === "CREDIT_CARD"`:
  - Primeiro tokenizar o cartão via `POST /creditCard/tokenize` do Asaas
  - Criar cobrança com `billingType: "CREDIT_CARD"` e `creditCardToken`
- Se `billing_type === "PIX"`: manter fluxo atual (QR code)
- Retornar dados diferentes conforme o método (PIX retorna QR code, cartão retorna confirmação direta)

**3. Frontend — Modal adaptativo**
- PIX: mostra QR code + copia-e-cola (como hoje) + polling
- Cartão: mostra formulário de cartão, envia dados, mostra confirmação ou erro

### Arquivos a alterar
| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/process-payment/index.ts` | Receber CPF, billing_type, dados cartão; tokenizar cartão; criar cobrança adequada |
| `src/pages/Pricing.tsx` | Campo CPF, seletor PIX/Cartão, formulário cartão, modal adaptativo |

### O que NÃO muda
- Tabelas, RLS, webhook, sistema de créditos
- Outras edge functions

