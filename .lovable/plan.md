

## Plano: Corrigir integração MiniMax text (generate-content)

### Problema
A chamada `callMiniMax` retorna "No content in MiniMax response" — a API responde OK mas `data.choices[0].message.content` está vazio/undefined. Provavelmente a estrutura de resposta da MiniMax difere do esperado.

### Solução
Adicionar logging do response body da MiniMax para diagnosticar a estrutura real, e ajustar o parsing conforme necessário.

### Mudanças

**1. `supabase/functions/generate-content/index.ts` — `callMiniMax`**
- Adicionar `console.log("MiniMax raw response:", JSON.stringify(data))` antes de acessar `choices`
- Tratar possíveis variações na estrutura de resposta:
  - `data.choices[0].message.content` (formato OpenAI padrão)
  - `data.choices[0].message.content` pode ser objeto em vez de string
  - A API pode retornar `finish_reason: "stop"` com content em formato diferente
- Ajustar o model name: o código passa `config.apiModel` que é `"MiniMax-M1"` — verificar se esse é o nome correto do modelo na API v2

**2. `supabase/functions/regenerate-field/index.ts`**
- Aplicar as mesmas correções de parsing

### Abordagem
1. Primeiro: adicionar log do response body completo e redeployar
2. Testar e ver a estrutura real
3. Ajustar o parsing conforme a resposta

### Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/generate-content/index.ts` | Adicionar log + corrigir parsing do response MiniMax |
| `supabase/functions/regenerate-field/index.ts` | Mesma correção |

