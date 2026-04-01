

# Fix: Tela em branco

## Problema
O arquivo `src/components/ui/sonner.tsx` importa `useTheme` de `next-themes`, um pacote Next.js. Isso causa um erro de runtime que impede o React de renderizar qualquer coisa, resultando em tela branca.

## Solução
Remover a dependência de `next-themes` do `sonner.tsx`. Como o app usa dark mode fixo (definido via CSS variables no `:root`), basta passar `theme="dark"` diretamente ao componente `Sonner`, sem precisar de `useTheme`.

## Arquivo a alterar

**`src/components/ui/sonner.tsx`**
- Remover import de `next-themes`
- Definir `theme="dark"` fixo no componente `Sonner`

