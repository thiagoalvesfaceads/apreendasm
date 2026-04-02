

# Fix: Encurtar/Alongar não mantém gancho com seta ">"

## Problema
Os prompts de `shorten` e `lengthen` na edge function `regenerate-field` não mencionam a regra do tom "Card": cada slide (exceto o último) deve terminar com uma frase-gancho curta seguida de `>` para instigar continuação.

## Solução

### `supabase/functions/regenerate-field/index.ts`
Adicionar a instrução do gancho com seta nos 3 prompts de body (`regenerate`, `shorten`, `lengthen`):

> "IMPORTANTE: Se este NÃO for o último slide, o texto DEVE terminar com uma frase-gancho curta seguida de '>' (ex: 'te explico o seguinte >'). Essa frase instiga a leitura do próximo card."

Essa regra será condicional no user prompt — o slide já envia `slide_number` e o total de slides pode ser inferido, ou simplesmente instruir a IA a manter o gancho se o texto original já tiver um `>` no final.

Abordagem mais simples: verificar se o body atual do slide termina com `>` e, se sim, adicionar ao prompt do sistema a instrução de manter esse padrão.

### Detalhe técnico
No bloco `userPrompt` (já existente), adicionar uma linha condicional:
```
${slide.body?.trimEnd().endsWith(">") ? "REGRA: O texto atual termina com uma frase-gancho + '>'. Mantenha esse padrão no resultado." : ""}
```

Isso garante que ao encurtar ou alongar, a IA preserva o gancho com seta quando ele existia no original.

