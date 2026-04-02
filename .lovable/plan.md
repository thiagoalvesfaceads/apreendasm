

# Aprimorar tom "Card" — gancho com seta + último card sem imagem

## Alteração

### `supabase/functions/generate-content/index.ts`
Expandir a `cardToneInstruction` (linha 254-256) para incluir duas regras extras:

1. **Gancho de transição com seta**: Cada card (exceto o último) deve terminar com uma frase-gancho curta seguida de ">" que instiga a leitura do próximo card. Exemplos: "te explico o seguinte >", "e é aqui que muda tudo >", "olha o que acontece >"

2. **Último card sem imagem**: O último card (CTA) deve ser puramente textual, centralizado, com texto persuasivo de oferta/chamada. O `visual_prompt` do último slide deve ser vazio ou `"none"`. Sem imagem — apenas copy de alta conversão.

### `src/pages/ContentEngine.tsx` (CardGenerator render)
No componente que renderiza os cards, verificar se o último slide com tom "card" tem `visual_prompt === "none"` ou vazio, e nesse caso não renderizar imagem, centralizando o texto.

Isso pode impactar também `src/components/results/CarouselTab.tsx` — onde o slide é renderizado com `slide.image_url`. Se `visual_prompt` for vazio, o bloco de imagem já não aparece (pois não há URL). Não precisa de mudança no frontend se a lógica de geração de imagem já ignora prompts vazios.

### Resultado
- Cards intermediários terminam com frase-gancho + ">" 
- Último card é só texto persuasivo, sem imagem

