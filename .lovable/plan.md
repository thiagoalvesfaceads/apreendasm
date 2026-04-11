

## Plano: Criar edge function `asaas-webhook` para processar pagamentos

### Resumo
Criar uma edge function que recebe webhooks do Asaas (PAYMENT_CONFIRMED / PAYMENT_RECEIVED), valida o token, identifica o usuário e credita o saldo correspondente ao pacote comprado.

### Pré-requisito: Secret do Asaas
Antes de implementar, preciso configurar o token de webhook do Asaas como secret:
- `ASAAS_WEBHOOK_TOKEN` — token de validação que o Asaas gera ao cadastrar o webhook

### Arquivo a criar

**`supabase/functions/asaas-webhook/index.ts`**

Lógica:
1. CORS headers + OPTIONS handler
2. Valida header `asaas-access-token` contra `ASAAS_WEBHOOK_TOKEN`
3. Aceita apenas eventos `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED`
4. Extrai do payload: `payment.externalReference` (será o `user_id`), `payment.value` (valor em reais)
5. Busca o pacote correspondente na tabela `credit_packages` pelo `price_cents` (converte `value * 100`)
6. Se encontrar o pacote:
   - Incrementa `balance` na `user_credits` do usuário
   - Registra na `usage_log` com `function_name: 'asaas-purchase'`, `ai_model: 'system'`, `credits_used: 0`, metadata com detalhes do pagamento
7. Retorna 200 OK (Asaas espera 200 para confirmar recebimento)
8. Se não encontrar pacote ou usuário, loga erro e retorna 200 mesmo (para não causar retry infinito)

### Fluxo esperado
```text
Asaas → POST /asaas-webhook
  ├─ Valida token
  ├─ Evento = PAYMENT_CONFIRMED?
  │   ├─ Busca user_id via externalReference
  │   ├─ Busca pacote via valor
  │   ├─ Credita saldo (UPDATE user_credits SET balance = balance + credits)
  │   └─ Registra usage_log
  └─ Retorna 200
```

### Migration necessária
Nenhuma — a `user_credits` já tem a coluna `balance` e a `usage_log` aceita inserts via service role.

### Observação sobre externalReference
Ao criar a cobrança no Asaas (futuro), o `externalReference` deve conter o `user_id` do Supabase para que o webhook consiga identificar quem pagou. Isso será implementado quando criarmos a edge function de criar cobrança.

### Passos de execução
1. Solicitar que o usuário adicione o secret `ASAAS_WEBHOOK_TOKEN`
2. Criar a edge function
3. Deploy e testar com curl

