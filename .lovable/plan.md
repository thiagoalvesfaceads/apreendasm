

## Plano: Criar página /pricing com pacotes de créditos

### Resumo
Criar uma nova página `Pricing.tsx` que busca pacotes da tabela `credit_packages` e exibe em cards. Adicionar rota no `App.tsx` (pública, sem `ProtectedRoute`).

### Arquivos a criar/alterar

**1. Criar `src/pages/Pricing.tsx`**
- Busca pacotes ativos via `supabase.from("credit_packages").select("*").eq("is_active", true).order("credits")`
- Usa `useAuth` para detectar login → mostra saldo atual (logado) ou banner de boas-vindas (não logado)
- Grid responsivo com 4 cards (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)
- Card "Criador" destacado com badge "Mais popular" e borda `border-primary`
- Cada card: nome, preço formatado (`(price_cents / 100).toFixed(2)` com vírgula), créditos em destaque, descrição, equivalências calculadas (`credits / 20` gerações Flash, `Math.floor(credits / 650)` carrosséis completos), botão "Em breve" desabilitado
- Header com nav links consistente com Usage page (link Home, voltar)
- Estilo escuro consistente com o app

**2. Alterar `src/App.tsx`**
- Importar `Pricing` e adicionar rota pública `<Route path="/pricing" element={<Pricing />} />`

**3. Alterar `src/pages/Landing.tsx`**
- Adicionar link "Ver pacotes" apontando para `/pricing` na landing page

### O que NÃO muda
- Nenhuma tabela ou migration
- Nenhuma edge function
- Nenhum gateway de pagamento

