
Corrigir o fluxo de Encurtar/Alongar para usar o mesmo provider de IA escolhido na geração original, em vez de sempre depender do Gemini.

## Diagnóstico
O erro não foi causado pelas regras de formatação em si.

Hoje o app está assim:
- `generate-content` respeita `ai_provider` (`google`, `openai`, `anthropic`)
- mas `regenerate-field` ignora isso e sempre usa `GOOGLE_AI_API_KEY`
- então, quando você gera com OpenAI e depois clica em `Encurtar`, o app muda de provider sem querer e cai no rate limit do Gemini

Os logs confirmam isso:
```text
regenerate-field error: Error: RATE_LIMITED
```

## Implementação

### 1. `src/pages/ContentEngine.tsx`
Ao chamar `regenerate-field`, enviar também o provider atual:
- incluir `ai_provider: form.aiProvider` no body da chamada
- se quiser deixar mais robusto, persistir o provider junto do resultado carregado/salvo para não depender só do estado visual do form

### 2. `supabase/functions/regenerate-field/index.ts`
Refatorar a função para ter o mesmo roteador de provider usado em `generate-content`:
- adicionar suporte a:
  - Google
  - OpenAI
  - Anthropic
- ler `ai_provider` do request
- usar o provider informado para `title`, `body`, `shorten`, `lengthen` e `visual_prompt`

Estrutura:
```text
callAI(provider, systemPrompt, userPrompt)
  -> callGoogleAI(...)
  -> callOpenAI(...)
  -> callAnthropic(...)
```

### 3. Preservar o que já foi corrigido
Manter intactas as regras já adicionadas para:
- parágrafos com linha em branco
- `**negrito**`
- gancho final com `>`

Ou seja: trocar apenas o motor de IA da regeneração, não remover a lógica de formatação.

### 4. Tratamento de erro
Padronizar os retornos de `regenerate-field`:
- `429` -> `RATE_LIMITED`
- mensagens claras por provider
- no front, continuar exibindo toast amigável

## Resultado esperado
- Se o conteúdo foi gerado com OpenAI, `Encurtar` e `Alongar` também usam OpenAI
- Se foi gerado com Anthropic, a regeneração usa Anthropic
- Gemini só será usado quando realmente tiver sido o provider escolhido
- o fluxo deixa de quebrar por rate limit indevido do Gemini ao editar textos gerados por outro modelo

## Detalhe técnico
Hoje existe uma inconsistência entre as duas funções:
```text
generate-content:
  aceita ai_provider e roteia corretamente

regenerate-field:
  ignora ai_provider
  lê GOOGLE_AI_API_KEY direto
  sempre chama Gemini
```

A correção é alinhar `regenerate-field` com a arquitetura já existente de `generate-content`.
