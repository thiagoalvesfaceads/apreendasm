

# Melhoria: Gerar prompts visuais a partir da copy final

## Problema

Hoje, o `generate-content` gera o `visual_prompt` de cada slide **junto com o texto** numa única chamada. Isso faz com que os prompts visuais sejam genéricos e desconexos do conteúdo real dos cards — a IA está tentando criar tudo ao mesmo tempo.

## Solução

Adicionar uma **segunda etapa** no fluxo: após gerar o conteúdo textual (estratégia + slides), fazer uma chamada adicional à IA para gerar visual prompts **baseados na copy final** de cada slide.

### Fluxo novo

```text
1. generate-content → estratégia + slides (texto)
2. [NOVO] Para cada slide, gerar visual_prompt usando título + body + estratégia como contexto
```

### Implementação

**`supabase/functions/generate-content/index.ts`**:

1. Adicionar um novo system prompt `VISUAL_PROMPT_SYSTEM` especializado em criar prompts visuais a partir de copy finalizada — com instruções de cena, composição, iluminação, estilo, coerência entre slides
2. Após receber o JSON do carrossel, fazer uma segunda chamada à IA enviando todos os slides (título, body, role, emotional_goal) + estratégia + visual_style, pedindo um array de visual_prompts
3. Substituir os visual_prompts originais pelos novos, mais contextuais
4. Para slides com `visual_prompt: "none"` (CTA), manter como está

### Detalhes técnicos

- A segunda chamada recebe o contexto completo: estratégia, tom, nicho, estilo visual, e **todo o texto final** de cada slide
- O prompt instrui a IA a criar imagens que complementem visualmente a narrativa, não que repitam o texto
- Mantém coerência estética entre slides (mesma paleta, ambiente, sujeito)
- Não afeta o fluxo de Reels (scene_suggestions continuam como estão)
- Custo: uma chamada extra por geração de carrossel (trade-off aceitável pela qualidade)

