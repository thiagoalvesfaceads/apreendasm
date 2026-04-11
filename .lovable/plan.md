

## Plano: Adicionar elementos visuais de credibilidade e segurança

Alteração **somente UI** em `src/pages/Pricing.tsx`. Nenhuma lógica de pagamento é modificada.

### Mudanças

**1. Import de ícones Lucide adicionais**
- Adicionar: `Lock`, `Zap`, `CalendarOff`, `Mail` (para a barra de trust da página)
- Já existentes: `Shield` não é necessário, `Lock` cobre o cadeado

**2. Modal — Header (linha ~350)**
- Após `DialogDescription`, adicionar linha com ícone `Lock` (16px) + "Transação segura e criptografada" em verde (`text-emerald-500`, `text-[12px]`)

**3. Modal — Step Form (cartão, linha ~420-432)**
- Antes do botão "Pagar com cartão": texto centralizado 12px cinza — "Seus créditos são adicionados automaticamente após confirmação."
- Após o botão: bloco com "Pagamento processado por Asaas" + ícones SVG inline das bandeiras (Visa, Mastercard, Elo, Pix) em 12px cinza

**4. Modal — Step PIX (linha ~470-473)**
- Após "Aguardando confirmação...": ícone `Lock` + "Pagamento via Pix — instantâneo e seguro" em verde
- Rodapé: "Processado por Asaas • Regulado pelo Banco Central do Brasil" em 11px cinza

**5. Página /pricing — Trust bar (linha ~331, após o grid)**
- Barra horizontal flex com 4 itens:
  - `Lock` + "Pagamento seguro"
  - `Zap` + "Créditos instantâneos"  
  - `CalendarOff` + "Sem assinatura"
  - `Mail` + "Suporte por e-mail"
- Ícones 16px, texto 12px cinza, gap entre itens, centralizado

### Arquivo alterado
| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/pages/Pricing.tsx` | Apenas UI — ícones, textos, classes CSS |

### O que NÃO muda
- Edge functions, tabelas, RLS, lógica de pagamento
- Nenhum componente externo ou imagem externa

