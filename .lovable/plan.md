

# Plano: Landing Page, Login/Senha e Política de Privacidade

## Resumo
Criar uma landing page descritiva do projeto (como no Gestor Apreenda), uma página de autenticação com email/senha, e uma página de Política de Privacidade para compliance com Meta.

## Passos

### 1. Criar hook `useAuth`
- Hook que escuta `onAuthStateChange` e expõe `user`, `loading`, `signOut`
- Usado para proteger rotas e redirecionar usuários logados

### 2. Criar página `/landing` (Landing Page)
- Header com logo/nome do app + botão "Entrar"
- Hero section descrevendo o app: "Gerador de conteúdo para redes sociais com IA"
- Cards de features: geração de carrosséis, reels, legendas, estratégia, múltiplos modelos de IA
- Footer com link para Política de Privacidade e contato
- Adaptado ao tema dark/gold do projeto atual

### 3. Criar página `/auth` (Login/Cadastro)
- Formulário com email + senha (login e signup toggle)
- Campo nome completo no cadastro
- Integração com `supabase.auth.signInWithPassword` e `signUp`
- Redireciona para `/` (dashboard) após login
- Sem Google OAuth por enquanto (pode adicionar depois)

### 4. Criar página `/privacy-policy`
- Adaptada para este app (gerador de conteúdo social media)
- Seções: Dados Coletados, Como Usamos, Armazenamento, Terceiros, Direitos do Usuário, Contato
- Menção ao uso de APIs de IA (Google, OpenAI, Anthropic) para geração de conteúdo
- Compliance com regras do Meta App Review

### 5. Atualizar rotas no `App.tsx`
- `/` → Landing (pública)
- `/auth` → Auth (pública)
- `/privacy-policy` → PrivacyPolicy (pública)
- `/app` → Index atual (protegida — redireciona para `/auth` se não logado)
- `/library` → Library (protegida)

### 6. Proteger rotas do app
- Componente `ProtectedRoute` que verifica autenticação
- Redireciona para `/auth` se não autenticado

## Detalhes Técnicos
- Nenhuma tabela de profiles será criada (não há necessidade de dados extras do usuário por enquanto)
- Usa apenas `auth.users` do Supabase para autenticação
- Landing page usa o design system existente (dark theme com gold accent)

