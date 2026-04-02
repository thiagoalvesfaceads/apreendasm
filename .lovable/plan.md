

# Fix: crash ao abrir geração salva da biblioteca

## Problema
`ResultsView` acessa `content.input.format` sem verificação. Gerações salvas no banco podem não ter o campo `input`, causando `Cannot read properties of undefined (reading 'format')`.

## Solução

### `src/components/ResultsView.tsx`
- Adicionar fallback para `content.input`: se não existir, inferir o formato a partir de `content.carousel` ou `content.reels`
- Criar um `input` padrão quando ausente para não quebrar o restante do componente

### `src/pages/Library.tsx`
- Ao abrir uma geração, garantir que o `content` tenha `input` preenchido, usando `format` e `niche` da própria row do banco como fallback

Mudança principal em `ResultsView.tsx` (linha 52):
```typescript
const format = content.input?.format || (content.carousel ? "carousel" : "reels");
const tabs = TAB_CONFIG[format];
```

E ajustar as outras referências a `content.input.format` e `content.input.niche` para usar optional chaining com fallbacks.

