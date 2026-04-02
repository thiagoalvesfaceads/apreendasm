

# Preservar estado do Content Engine ao navegar para o Card Generator

## Problema
Quando o usuário vai para `/card-generator` e volta, o estado do Content Engine (resultado gerado, imagens, formulário) é perdido porque está todo em `useState` — reseta ao desmontar o componente.

## Solução
Salvar o estado completo do Content Engine no `sessionStorage` ao navegar para o Card Generator, e restaurá-lo ao voltar.

## Alterações

### `src/pages/ContentEngine.tsx`

1. **Ao clicar em "Criar Cards Visuais"**: antes de navegar, salvar no `sessionStorage`:
   - `content_engine_result` → o objeto `result` completo
   - `content_engine_images` → as imagens geradas
   - `content_engine_form` → o estado do formulário
   - `content_engine_tab` → a tab ativa

2. **No `useEffect` de inicialização**: verificar se existe estado salvo no `sessionStorage`. Se sim, restaurar `result`, `images`, `form` e `activeTab`, e limpar o `sessionStorage`.

Isso garante que ao voltar (botão "Content Engine" no Card Generator), o usuário vê exatamente o que tinha antes — sem precisar regenerar.

