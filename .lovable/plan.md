

## Plano: Corrigir QR Code PIX não aparecendo

### Problema
O pagamento PIX é criado com sucesso no Asaas, mas o QR code retorna `null`. Isso acontece porque o Asaas precisa de alguns segundos para gerar o QR code após a criação do pagamento. A edge function busca o QR code imediatamente, antes de estar pronto.

Além disso, o frontend mostra a tela de PIX mesmo quando não tem QR code nem código copia-e-cola, resultando numa tela vazia com apenas "Aguardando confirmação...".

### Solução

**1. Edge function — `supabase/functions/process-payment/index.ts`**
- Adicionar retry com delay ao buscar o QR code PIX: tentar até 3 vezes com 2 segundos de espera entre cada tentativa
- Logar o resultado da chamada de QR code para debug

**2. Frontend — `src/pages/Pricing.tsx`**
- Se o QR code e o copia-e-cola vierem `null`, mostrar uma mensagem de fallback com opção de tentar buscar o QR code novamente (botão "Gerar QR Code")
- Fazer uma chamada separada ao endpoint de QR code do Asaas via uma nova edge function simples, ou armazenar o `paymentId` e permitir retry

### Arquivos a alterar
| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/process-payment/index.ts` | Retry com delay na busca do QR code |
| `src/pages/Pricing.tsx` | Fallback quando QR/copia-e-cola são null, com opção de retry |

### O que NÃO muda
- Tabelas, RLS, webhook, cartão de crédito
- Outras edge functions

