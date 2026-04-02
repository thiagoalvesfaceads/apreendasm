

# Fix: Regra do gancho `>` faltando no regenerate-field

## Problema

No `generate-content`, a regra é clara: "Cada card (EXCETO o último) DEVE terminar com uma frase-gancho curta seguida de `>`". Mas no `regenerate-field`, o `FORMAT_RULES_CARD` diz apenas "Se houver uma frase-gancho..." — condicional, não obrigatório. Quando o usuário encurta ou regenera, o modelo pode remover o gancho.

## Solução

### `supabase/functions/regenerate-field/index.ts` — `FORMAT_RULES_CARD`

Adicionar regra explícita obrigatória:

```
GANCHO DE TRANSIÇÃO:
- Se NÃO for o último slide, o body DEVE terminar com uma frase-gancho curta seguida de ">" em parágrafo separado
- Exemplos: "te explico o seguinte >", "e é aqui que muda tudo >", "mas tem um detalhe >"
- Se FOR o último slide (CTA), NÃO incluir gancho
```

Também ajustar a linha existente que diz "Se houver uma frase-gancho..." para "A frase-gancho DEVE estar em seu próprio parágrafo separado e terminar com `>`".

O slide number já é passado no contexto, e o modelo pode inferir se é o último pelo papel (CTA) ou pelo número.

