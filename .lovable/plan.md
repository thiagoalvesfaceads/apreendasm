

## Plano: Atualizar valores de créditos em todo o sistema

### Resumo
Atualizar os custos de créditos em **6 arquivos** (3 frontend + 2 edge functions + 1 memória). Nenhuma mudança estrutural — apenas valores numéricos e labels.

### Novos valores

| Item | Antes | Depois |
|------|-------|--------|
| Gemini Flash Lite | 0 | 0 |
| Gemini Flash | 5 | 20 |
| Gemini Pro | 30 | 60 |
| GPT-4o Mini | 10 | 15 |
| GPT-4o | 40 | 70 |
| Claude Sonnet 4 | 50 | 90 |
| Imagem (por unidade) | 36 | 80 |
| Regenerar campo | 3 | 8 |

### Arquivos a alterar

**1. `src/hooks/useCredits.ts`** — Tabela `CREDIT_COSTS`: atualizar todos os valores de texto, imagem (36→80) e regeneração (3→8).

**2. `src/types/content.ts`** — Duas atualizações:
- `AI_MODEL_INFO`: campo `cost` de cada modelo
- `AI_MODEL_LABELS`: labels com novo custo em créditos

**3. `src/pages/ContentEngine.tsx`** — Linha 519 e 529: referência hardcoded `* 36` → `* 80` no cálculo de custo de imagens exibido na UI.

**4. `supabase/functions/generate-content/index.ts`** — `MODEL_CONFIG` (linhas 152-159): atualizar `cost` de cada modelo.

**5. `supabase/functions/generate-images/index.ts`** — `COST_PER_IMAGE` (linha ~165): 36 → 80.

**6. `supabase/functions/regenerate-field/index.ts`** — `creditCost` (linha 275): 3 → 8.

**7. `mem://features/credits`** — Atualizar memória do projeto com novos valores.

### O que NÃO muda
- Lógica de débito (`debit_credits`)
- Admin bypass (créditos ilimitados)
- Logging no `usage_log`
- Gateway de pagamento (não existe ainda)

