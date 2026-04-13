

## Plano: Mostrar estimativa de custo para admins

Mudança de **1 linha** em `src/pages/ContentEngine.tsx`.

### Mudança

**Linha 512**: remover a condição `!isAdmin &&` que esconde a estimativa de custo para admins.

```
// De:
{!isAdmin && (() => {

// Para:
{(() => {
```

Isso faz a estimativa aparecer para todos os usuários (incluindo admin). A lógica de cobrança real (que isenta admins) não é alterada — fica tudo no backend/hook.

### Arquivo alterado
| Arquivo | Mudança |
|---------|---------|
| `src/pages/ContentEngine.tsx` | Remover `!isAdmin &&` na linha 512 |

