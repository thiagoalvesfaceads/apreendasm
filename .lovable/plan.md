

# Plano: Dropdown de IA (Google, OpenAI, Claude) no formulário

## O que muda

### 1. Adicionar secrets para OpenAI e Anthropic
Solicitar duas novas secrets: `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`.

### 2. Atualizar types (`src/types/content.ts`)
- Novo type `AIProvider = "google" | "openai" | "anthropic"`
- Labels: Google Gemini, OpenAI GPT-4o, Claude Sonnet
- Adicionar `ai_provider: AIProvider` ao `ContentInput`

### 3. Adicionar dropdown no formulário (`GenerationForm.tsx`)
- Select "Modelo de IA" dentro da seção criativa (ao lado do estilo visual)
- Google como default
- Mostrar as 3 opções: Google Gemini, OpenAI GPT-4o, Claude Sonnet

### 4. Atualizar Edge Function `generate-content`
- Receber `ai_provider` no body
- Roteamento:
  - `google` → Gemini API (como está hoje)
  - `openai` → OpenAI Chat Completions API (`gpt-4o`, response_format json)
  - `anthropic` → Anthropic Messages API (`claude-sonnet-4-20250514`, JSON output)
- Mesmos system prompts para todos os providers

### 5. Imagens ficam no Google
A edge function `generate-images` continua usando Google Gemini para geração de imagens (sem mudança).

## Detalhes Técnicos

**OpenAI endpoint:** `https://api.openai.com/v1/chat/completions` com `response_format: { type: "json_object" }`

**Anthropic endpoint:** `https://api.anthropic.com/v1/messages` com header `anthropic-version: 2023-06-01`

**Fallback:** Se a key do provider escolhido não estiver configurada, retorna erro claro pedindo para configurar.

