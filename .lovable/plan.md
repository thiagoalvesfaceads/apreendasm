

# Transformar /app num Dashboard

## O que será feito

Transformar a página `/app` (Index.tsx) num painel inicial (dashboard) com visão geral e atalhos rápidos, removendo a funcionalidade duplicada de geração/colar conteúdo que já existe no Content Engine.

## Layout do Dashboard

O dashboard terá:

1. **Header** com saudação ("Olá, [nome]") e botão Sair
2. **Cards de atalho rápido** em grid:
   - **Content Engine** — "Gerar novo conteúdo" com ícone Zap, link para `/content-engine`
   - **Biblioteca** — "X conteúdos salvos" (contagem real da tabela `generations`), link para `/library`
   - **Canva** — Status de conexão (conectado/desconectado), link para `/content-engine`
3. **Últimas gerações** — Lista dos 5 últimos conteúdos salvos na biblioteca (da tabela `generations`), com título, formato, data relativa. Clicar abre na biblioteca.
4. Se admin: card extra de "Gerenciar Usuários" com link para `/admin/users`

## Alterações

### `src/pages/Index.tsx`
Reescrever completamente: remover toda a lógica de geração/paste e substituir por um dashboard com:
- Query `generations` para contar total e buscar os 5 mais recentes
- Query `canva_tokens` para verificar status de conexão
- Cards em grid responsivo (2-3 colunas)
- Lista de últimas gerações

### `src/App.tsx`
Nenhuma mudança necessária — a rota `/app` já aponta para `Index`.

## Arquivos alterados
- `src/pages/Index.tsx` — reescrita completa como dashboard

