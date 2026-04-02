

# Botão "Gerar no Gemini" na aba Prompts Visuais

## Limitação técnica
Não é possível colar texto automaticamente em sites externos (restrição de segurança do navegador). O que podemos fazer: **copiar todos os prompts para a área de transferência e abrir o Gem** em uma nova aba. O usuário só precisa dar Ctrl+V.

## Alteração

**`src/components/results/VisualPromptsTab.tsx`**

Adicionar um botão ao final da lista de prompts:
- Ícone do Gemini (sparkles ou ExternalLink) + texto "Gerar imagens no Gemini"
- Ao clicar: copia todos os prompts para o clipboard, exibe toast "Prompts copiados! Cole no Gemini (Ctrl+V)", e abre `https://gemini.google.com/gem/1Jh27NXowbrFiqCzDx6YvO_6UfQiTMuQt` em nova aba
- Estilo: botão primário, destaque visual

