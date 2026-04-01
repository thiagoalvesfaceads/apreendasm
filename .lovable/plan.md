

# Plano: Sistema de Admin + Aprovação de Usuários

## Resumo
Criar um sistema de roles com aprovação de cadastro. O `talcalves@gmail.com` será admin. Novos usuários ficam "pendentes" até serem aprovados pelo admin. O admin terá uma página para ver e aprovar/rejeitar usuários.

## Passos

### 1. Criar tabelas no banco (migração)
- **`user_roles`**: `id`, `user_id` (ref auth.users), `role` (enum: admin, user) — com unique constraint
- **`profiles`**: `id` (= user_id), `email`, `full_name`, `approved` (boolean, default false), `created_at`
- Trigger `on_auth_user_created` para criar profile automaticamente com `approved = false`
- Função `has_role()` (security definer) para checar roles sem recursão RLS
- RLS em ambas as tabelas
- Insert inicial: dar role `admin` ao `talcalves@gmail.com` e marcar como `approved = true`

### 2. Atualizar `ProtectedRoute`
- Após autenticação, verificar se o usuário está `approved` na tabela `profiles`
- Se não aprovado, mostrar tela de "Aguardando aprovação" em vez do app
- Se admin, permitir acesso sempre

### 3. Criar página `/admin/users`
- Lista todos os profiles com email, nome, data de cadastro, status (aprovado/pendente)
- Botões para aprovar e rejeitar (deletar) usuários
- Acessível apenas para users com role `admin`

### 4. Atualizar rotas em `App.tsx`
- Adicionar rota `/admin/users` protegida (requer admin)

### 5. Adicionar link de admin no app
- No header/nav do Index, se o usuário for admin, mostrar link para "Gerenciar Usuários"

## Detalhes Técnicos

**Enum e tabelas:**
```text
create type public.app_role as enum ('admin', 'user');

profiles: id (uuid PK), email (text), full_name (text), approved (bool default false), created_at
user_roles: id (uuid PK), user_id (uuid), role (app_role), unique(user_id, role)
```

**Trigger:** Cria profile automaticamente no signup usando `auth.users.raw_user_meta_data->full_name` e `email`.

**Seed admin:** Insert `talcalves@gmail.com` como approved + role admin (via SQL que busca o user_id no auth.users).

**RLS:**
- `profiles`: users leem próprio profile; admin lê todos
- `user_roles`: leitura via `has_role()` security definer

