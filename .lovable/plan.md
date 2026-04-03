

# Gerar imagens COM texto no estilo Carrosséis Thiago

## Problema
Os prompts visuais do estilo Thiago não incluem as frases/títulos dos slides. O sistema instrui explicitamente "NUNCA inclua texto na imagem". O usuário quer que a IA gere o card completo — imagem editorial + tipografia grande integrada.

## Mudanças

### 1. `supabase/functions/generate-content/index.ts` — VISUAL_PROMPT_THIAGO_SYSTEM

Reescrever o system prompt para:
- **INCLUIR** o título e frase-chave do slide no prompt visual
- Instruir a IA a gerar um card completo: fundo editorial + tipografia grande estilo Thiago
- Definir estilo tipográfico: fonte bold/display, palavras-chave em laranja (#E85D04), resto em branco sobre fundo escuro ou preto sobre fundo claro
- Manter as instruções de fotografia editorial (iluminação dramática, tons dourados, etc.)
- Incluir branding "THIAGO ALCÂNTARA" no topo de cada card
- Cada prompt deve especificar: o texto exato a renderizar, posição do texto (topo/centro/embaixo), layout (texto sobre imagem, imagem-topo + texto-embaixo, etc.)

Formato do visual_prompt passará a incluir o texto do slide:
```
"Crie um card 1080x1080px com fundo escuro. Imagem editorial: [descrição da cena]. 
Tipografia sobreposta: título '[TÍTULO DO SLIDE]' em fonte bold grande, 
palavra-chave em laranja #E85D04, restante em branco. Branding 'THIAGO ALCÂNTARA' no topo."
```

### 2. `supabase/functions/generate-images/index.ts` — fullPrompt para Thiago

Quando `visual_style === "carrosseis_thiago"`:
- **Remover** as instruções "NO text, NO letters, NO words"
- **Remover** "Do not include any text in the image"
- Substituir por instruções que reforcem: renderizar o texto exatamente como especificado no prompt, com tipografia grande, legível, e integrada ao design
- Adicionar instrução de aspecto 1:1, 1080x1080px

### 3. Fluxo no `generate-content` — visual prompt request

Atualizar o `visualPromptRequest` para o estilo Thiago para que envie o **texto completo** (título + body resumido) de cada slide junto com as instruções visuais, para que o prompt final contenha as frases reais a serem renderizadas.

## Risco
Modelos de IA ainda cometem erros em tipografia (letras trocadas, layout irregular). A qualidade vai depender do modelo Gemini. Se os resultados não ficarem bons, podemos revisitar a abordagem de sobrepor texto no CardGenerator.

