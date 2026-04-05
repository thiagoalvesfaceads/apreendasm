

# Recalcular créditos para margem real com R$50

## O problema atual

Com 1 crédito = R$0,01 e custos atuais (1-6 créditos por geração), os modelos premium dão **prejuízo**:

| Modelo | Custo API real (3 chamadas) | Créditos cobrados | Receita | Margem |
|--------|---------------------------|-------------------|---------|--------|
| Flash Lite | ~R$0,00 | 0 = R$0,00 | — | OK |
| Flash | ~R$0,01 | 1 = R$0,01 | R$0,00 | **ZERO** |
| GPT-4o Mini | ~R$0,02 | 2 = R$0,02 | R$0,00 | **ZERO** |
| Gemini Pro | ~R$0,17 | 3 = R$0,03 | **-R$0,14** | **PREJUÍZO** |
| GPT-4o | ~R$0,22 | 5 = R$0,05 | **-R$0,17** | **PREJUÍZO** |
| Claude Sonnet | ~R$0,28 | 6 = R$0,06 | **-R$0,22** | **PREJUÍZO** |

## Proposta: aumentar créditos por geração (manter 1cr = R$0,01)

Nova tabela com ~50% de margem nos modelos premium:

| Modelo | Custo API | Créditos novos | Receita | Margem | Gerações com R$50 |
|--------|-----------|---------------|---------|--------|-------------------|
| Flash Lite | ~R$0,00 | **0** (grátis) | — | — | ilimitado |
| Flash | ~R$0,01 | **5** = R$0,05 | R$0,04 | 80% | 1.000 |
| GPT-4o Mini | ~R$0,02 | **10** = R$0,10 | R$0,08 | 80% | 500 |
| Gemini Pro | ~R$0,17 | **30** = R$0,30 | R$0,13 | 43% | 166 |
| GPT-4o | ~R$0,22 | **40** = R$0,40 | R$0,18 | 45% | 125 |
| Claude Sonnet | ~R$0,28 | **50** = R$0,50 | R$0,22 | 44% | 100 |

**Com R$50, o usuário consegue:**
- ~1000 gerações no Flash (ótimo modelo custo-benefício)
- ~500 no GPT-4o Mini
- ~125 no GPT-4o (premium)
- Ilimitado no Flash Lite (básico)

Isso parece uma quantidade **muito boa** para R$50, com margem saudável pra você.

## Créditos iniciais grátis

Atualizar de 100 para **500 créditos** grátis (R$5), o que dá:
- 100 gerações no Flash ou 50 no GPT-4o Mini — suficiente pra testar

## Mudanças técnicas

### 1. `src/types/content.ts` — Labels
```
"gemini-flash-lite": "Gemini Flash Lite — Grátis"
"gemini-flash": "Gemini Flash — 5 créditos"
"gpt-4o-mini": "GPT-4o Mini — 10 créditos"
"gemini-pro": "Gemini Pro — 30 créditos"
"gpt-4o": "GPT-4o — 40 créditos"
"claude-sonnet": "Claude Sonnet 4 — 50 créditos"
```

### 2. `src/hooks/useCredits.ts` — Custos
Atualizar `CREDIT_COSTS["generate-content"]` com os novos valores.

### 3. `supabase/functions/generate-content/index.ts` — MODEL_CONFIG costs
Atualizar o campo `cost` de cada modelo no `MODEL_CONFIG`.

### 4. `supabase/functions/regenerate-field/index.ts` — Custo de regeneração
Atualizar de 1 para **3 créditos** por regeneração (cobre o custo de 1 chamada).

### 5. Memória — Atualizar `mem://features/credits`

