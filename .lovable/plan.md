

## Plano: Remover integração Canva

### O que será removido

1. **`src/pages/CanvaCallback.tsx`** — página inteira deletada
2. **`supabase/functions/canva-auth-url/index.ts`** — edge function deletada
3. **`supabase/functions/canva-callback/index.ts`** — edge function deletada
4. **`src/App.tsx`** — remover import do CanvaCallback e a rota `/canva-callback`
5. **`src/pages/ContentEngine.tsx`** — remover estado `canvaConnected`/`canvaLoading`, useEffect de verificação, função `handleConnectCanva`, e o botão "Conectar Canva" no header (linhas 63-92 e 334-344)
6. **`src/pages/Index.tsx`** — remover estado `canvaConnected`, query `canva_tokens`, card do Canva no dashboard, e import `Palette`

### O que NÃO será tocado
- `src/pages/CardGenerator.tsx` — usa `canvas` (HTML Canvas API), nada a ver com Canva
- `src/components/ui/sidebar.tsx` — usa `offcanvas`, nada a ver com Canva
- Tabela `canva_tokens` no banco — pode ser removida depois via migration se quiser

### Arquivos alterados
| Arquivo | Ação |
|---------|------|
| `src/pages/CanvaCallback.tsx` | Deletar |
| `supabase/functions/canva-auth-url/index.ts` | Deletar |
| `supabase/functions/canva-callback/index.ts` | Deletar |
| `src/App.tsx` | Remover import e rota |
| `src/pages/ContentEngine.tsx` | Remover estado, useEffect, handler e botão |
| `src/pages/Index.tsx` | Remover card Canva e query relacionada |

