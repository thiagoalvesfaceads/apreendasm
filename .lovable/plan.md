

# Limitar parágrafos do tom "card" — regra corrigida

## Regra de tamanho

- **Maioria dos slides**: máximo 2 parágrafos (+ gancho `>`)
- **Slide do meio** (literal: se 5 slides → slide 3; se 7 → slide 4; se par → o mais próximo do último): até 3 parágrafos
- **Último slide (CTA)**: até 3 parágrafos

## Arquivos a alterar

### 1. `supabase/functions/generate-content/index.ts` (linha ~254)

Substituir "3 a 6 parágrafos narrativos densos" pela nova regra posicional:

```
TAMANHO DO BODY:
- A MAIORIA dos slides deve ter no máximo 2 parágrafos densos
- Apenas o slide central (se 5 slides → slide 3, se 7 → slide 4, se par → o mais próximo do último) pode ter até 3 parágrafos
- O último slide (CTA) pode ter até 3 parágrafos
- O gancho de transição (">") conta como parágrafo separado
- NUNCA exceda esses limites. Priorize impacto por frase, não volume.
```

Manter todo o resto (storytelling, autoridade, negrito, gancho `>`, formatação).

### 2. `supabase/functions/regenerate-field/index.ts` — `FORMAT_RULES_CARD` (linha ~14)

Adicionar a mesma regra de limite ao bloco de formatação para que `Encurtar`, `Alongar` e `Regenerar` respeitem:

```
- Máximo 2 parágrafos para a maioria dos slides; até 3 apenas para o slide central e o último (CTA)
```

O slide number e total de slides já são passados no contexto do prompt, então o modelo saberá qual é o slide central.

