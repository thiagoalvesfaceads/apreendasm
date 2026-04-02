

# Fix: "Encurtar" repetido causa contaminação do body com metadados

## Diagnóstico

Dois problemas distintos:

### 1. Modelo ecoa o template de metadados
O `userPrompt` do `regenerate-field` envia o contexto assim:
```
SLIDE #1
Papel: hook
Título atual: O Colapso do Modelo SaaS
Corpo atual: Em um dia, **US$ 300 bilhões...
...
Encurte o CORPO do slide acima.
```

Após múltiplas iterações de "Encurtar", o modelo (especialmente OpenAI) começa a incluir as labels de contexto ("SLIDE #1", "Papel:", "Título atual:", "Corpo atual:") na resposta. Esse texto inteiro é salvo como o novo `body`, e na próxima iteração, o body contaminado vira o novo contexto — criando um loop de degradação.

### 2. Regras de formatação são condicionais
As regras de `**negrito**`, parágrafos e gancho só são adicionadas se o body **atual** já os contém. Após um encurtamento que perde o negrito, a próxima iteração não pede mais negrito — e ele nunca volta.

## Solução

### `supabase/functions/regenerate-field/index.ts`

**A. Reforçar system prompts de shorten/lengthen:**
Adicionar instrução explícita nos system prompts de `shorten` e `lengthen`:
- "Responda APENAS com o texto do body. NÃO inclua labels como 'SLIDE #', 'Papel:', 'Título atual:', 'Corpo atual:', 'Objetivo emocional:', 'Prompt visual:', 'ESTRATÉGIA', etc."
- "SEMPRE use **negrito** em frases de impacto"
- "SEMPRE separe parágrafos com linhas em branco"

**B. Tornar regras de formatação incondicionais para tom "card":**
Quando o tom for "card", SEMPRE aplicar as regras de formatação (parágrafos com `\n\n`, `**negrito**`, gancho com `>`), independente de o body atual já conter ou não esses elementos. Isso evita que a formatação se perca após iterações.

**C. Reestruturar o userPrompt:**
Separar claramente o texto a editar do contexto auxiliar, usando delimitadores explícitos:
```
---TEXTO A ENCURTAR---
{slide.body}
---FIM DO TEXTO---

Contexto (NÃO incluir na resposta):
- Slide: #{slide.slide_number}, Papel: {slide.role}
- Título: {slide.title}
- Tom: {tone}, Nicho: {niche}
```

Isso torna muito mais difícil para o modelo confundir contexto com conteúdo.

## Resultado esperado
- "Encurtar" pode ser clicado N vezes sem contaminar o body com metadados
- Formatação (negrito, parágrafos, gancho) se mantém em todas as iterações
- Funciona consistentemente em Google, OpenAI e Anthropic

