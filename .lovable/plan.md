

## Plano: Corrigir redirecionamento pós-login Google

### Problema
O `redirect_uri` do Google OAuth está configurado como `window.location.origin` (ex: `https://apreendasm.lovable.app`), que é a Landing page. Após o OAuth, o usuário cai na Landing ao invés de `/app`. O redirect automático só funciona na página `/auth` (onde tem o `useEffect` que detecta o user e navega para `/app`).

### Solução
Adicionar lógica na **Landing page** para redirecionar usuários já autenticados para `/app`. Isso garante que, após o retorno do OAuth, o usuário seja redirecionado automaticamente.

### Arquivo a alterar

**`src/pages/Landing.tsx`**
- Importar `useAuth` e `useNavigate`
- Adicionar `useEffect` que verifica se `user` existe e redireciona para `/app`

### O que NÃO muda
- Edge functions, tabelas, auth config
- Página Auth.tsx (já funciona para login direto)

