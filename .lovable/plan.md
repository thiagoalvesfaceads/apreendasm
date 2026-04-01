

# Plano: Conectar IA Real ao Content Engine MASTER

## Problema
O hook `useContentGeneration.ts` usa funções mock que retornam apenas "Carregando..." em todos os campos. Não há chamada real a nenhum modelo de IA.

## Solução
Ativar o **Lovable Cloud** e criar uma **Edge Function** que usa o AI Gateway para gerar o conteúdo estratégico real via Gemini. O frontend chamará essa função em vez dos mocks.

## Passos

### 1. Ativar Lovable Cloud
Necessário para criar Edge Functions com acesso ao `LOVABLE_API_KEY`.

### 2. Criar Edge Function `generate-content`
Uma Edge Function que recebe o `ContentInput` e faz duas chamadas à IA:

- **Chamada 1 — Estratégia**: Prompt estruturado pedindo `pain_desire_tension`, `big_idea`, `lead_type`, `angle`, `promise`, `cta_strategy` em JSON.
- **Chamada 2 — Conteúdo**: Com a estratégia como contexto, gera o conteúdo completo (Reels ou Carousel) em JSON.

Ambas as chamadas usam o AI Gateway (`/ai/chat/completions`) com `response_format: json_object` e prompts detalhados em português com as regras de copy definidas no briefing original.

### 3. Atualizar `useContentGeneration.ts`
Substituir os mocks por chamadas `fetch` à Edge Function, com tratamento de erro e loading state.

### 4. Tratamento de erros
Exibir toast de erro se a geração falhar (timeout, parse JSON, etc.).

## Detalhes Técnicos

**Edge Function** (`supabase/functions/generate-content/index.ts`):
- Recebe POST com `ContentInput`
- Chama AI Gateway (Gemini Flash) com system prompt + user prompt
- Usa `--json` para output estruturado
- Retorna `{ strategy, reels?, carousel? }` parseado

**Prompts da IA** (embutidos na Edge Function):
- System prompt define o papel de estrategista de conteúdo
- User prompt inclui todos os campos do input + regras de copy + estrutura JSON esperada
- Separação em 2 chamadas para qualidade (estratégia primeiro, depois conteúdo baseado na estratégia)

**Frontend** (`useContentGeneration.ts`):
- `generate()` chama `supabase.functions.invoke('generate-content', { body: input })`
- Parse da resposta e set do resultado
- Error handling com toast

