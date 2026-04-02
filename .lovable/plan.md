

# Implementar Biblioteca — Salvar e Listar Conteúdos Gerados

## O que será feito

1. **Criar tabela `generations` no banco** com colunas: `id`, `user_id`, `title`, `format`, `niche`, `content` (JSONB com todo o GeneratedContent), `created_at`. RLS permitindo cada usuário ver/inserir/deletar apenas seus próprios registros.

2. **Adicionar botão "Salvar na Biblioteca"** no `ResultsView.tsx` (ao lado de "Exportar"). Ao clicar, salva o conteúdo gerado na tabela `generations` vinculado ao usuário logado.

3. **Implementar a página Biblioteca** (`Library.tsx`): lista os conteúdos salvos em cards com título, formato, nicho e data. Ao clicar num card, abre o `ResultsView` com o conteúdo salvo. Opção de deletar.

## Detalhes técnicos

### Migration SQL
```sql
CREATE TABLE public.generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT '',
  format text NOT NULL DEFAULT 'carousel',
  niche text NOT NULL DEFAULT '',
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own generations"
  ON public.generations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own generations"
  ON public.generations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own generations"
  ON public.generations FOR DELETE TO authenticated
  USING (user_id = auth.uid());
```

### ResultsView — botão Salvar
- Importar `supabase` client e `useAuth`
- Botão "Salvar" que faz `INSERT` na tabela `generations` com `title`, `format`, `niche` e `content` (o objeto `GeneratedContent` completo como JSON)
- Toast de sucesso/erro

### Library — página funcional
- Query `SELECT * FROM generations WHERE user_id = auth.uid() ORDER BY created_at DESC`
- Cards com título, formato (badge), nicho, data relativa
- Click abre o conteúdo no `ResultsView` (modo leitura)
- Botão de deletar com confirmação

### Arquivos alterados
- `supabase/migrations/` — nova migration
- `src/components/ResultsView.tsx` — botão salvar
- `src/pages/Library.tsx` — reescrever com funcionalidade real
- `src/integrations/supabase/types.ts` — será atualizado automaticamente

