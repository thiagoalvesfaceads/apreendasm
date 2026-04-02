

# Adicionar botão "Conectar ao Canva" no Content Engine

## O que será feito

Adicionar um botão "Conectar ao Canva" na sidebar do Content Engine que inicia o fluxo OAuth do Canva. O botão verifica se o usuário já está conectado (consultando `canva_tokens`) e mostra o estado apropriado.

## Alterações

### `src/pages/ContentEngine.tsx`

1. **Estado de conexão Canva**: Adicionar estado `canvaConnected` e um `useEffect` que consulta `canva_tokens` para verificar se o usuário já tem tokens válidos. Também detectar `?canva=connected` na URL para atualizar o estado após callback.

2. **Função `handleConnectCanva`**: Redireciona para a URL de autorização do Canva:
   ```
   https://www.canva.com/api/oauth/authorize
     ?client_id={CANVA_CLIENT_ID}
     &redirect_uri=https://apreendasm.lovable.app/canva-callback
     &response_type=code
     &scope=design:content:read design:content:write
     &state={random}
   ```
   O `CANVA_CLIENT_ID` precisa estar disponível no frontend — será adicionado como variável de ambiente `VITE_CANVA_CLIENT_ID`.

3. **Botão na sidebar**: Ao lado dos links existentes (Biblioteca, Sair), adicionar botão com ícone do Canva. Se conectado, mostrar "Canva ✓" em verde; se não, "Conectar Canva".

### Variável de ambiente

- Precisaremos que o `CANVA_CLIENT_ID` esteja disponível no frontend via `VITE_CANVA_CLIENT_ID` (o client ID não é segredo, é público no OAuth). Será necessário adicionar como secret com prefixo `VITE_`.

## Arquivos alterados
- `src/pages/ContentEngine.tsx` — botão + lógica de verificação/conexão

