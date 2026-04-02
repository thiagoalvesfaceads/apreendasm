

# Fix: OpenAI não preserva formatação (negrito, parágrafos) na geração inicial

## Diagnóstico

O problema está no `CAROUSEL_SYSTEM` prompt em `generate-content`. O Gemini naturalmente retorna texto com `**negrito**` e parágrafos separados por `\n\n`, mas o OpenAI não faz isso por padrão — ele retorna um bloco corrido.

A instrução de tom "card" (`cardToneInstruction`) pede "3 a 6 parágrafos narrativos densos" e "frase-gancho com `>`", mas **não instrui explicitamente** o modelo a:
- Usar `**negrito**` nas frases de impacto
- Separar parágrafos com `\n\n` no JSON

## Solução

### `supabase/functions/generate-content/index.ts`

Adicionar regras de formatação explícitas no `cardToneInstruction` (dentro do prompt do carrossel, quando `tone === "card"`):

1. Instruir que o body de cada slide DEVE usar `**negrito**` em frases-chave e palavras de impacto
2. Instruir que os parágrafos DEVEM ser separados por `\n\n` (duas quebras de linha) dentro do campo body do JSON
3. Reforçar que o gancho final com `>` deve estar em um parágrafo separado

Trecho a adicionar no `cardToneInstruction`:

```
FORMATAÇÃO OBRIGATÓRIA DO BODY:
- Separe cada parágrafo com duas quebras de linha (\n\n) dentro do campo "body" do JSON
- Use **negrito** (markdown) nas frases de maior impacto emocional, insights-chave e palavras de autoridade
- NUNCA retorne o body como um bloco único de texto corrido
- O gancho de transição final (com ">") deve estar em seu próprio parágrafo separado
```

Isso garante que **todos os providers** (Google, OpenAI, Anthropic) gerem o body com a mesma diagramação visual.

### Resultado esperado
- Cards gerados pelo OpenAI terão parágrafos separados, negrito e gancho — idênticos ao Gemini
- Nenhuma mudança no Gemini ou Anthropic (que já podem funcionar, mas agora terão instrução explícita)

