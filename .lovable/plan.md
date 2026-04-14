

## Plano: Fluxo wizard passo a passo no Content Engine

### Conceito
Transformar a geração de conteúdo de "tudo de uma vez" para um wizard onde cada aba é gerada, revisada e aprovada antes de prosseguir. O usuário controla o ritmo: gera → revisa/edita → aprova → próxima etapa.

### Fluxo do wizard

```text
[Formulário] → Gerar
      ↓
[1. Estratégia] → editar/regenerar → Continuar
      ↓
[2. Carrossel/Reels] → editar/regenerar → Continuar
      ↓
[3. Legenda] → editar/regenerar → Continuar
      ↓ (só se generateImages ativo)
[4. Prompts Visuais] → editar/regenerar → Continuar
      ↓
[5. Imagens] → gerar/regenerar → Salvar
```

Cada aba só aparece quando a anterior foi aprovada. Botão "Continuar" na parte inferior de cada aba gera o conteúdo da próxima.

### Mudanças no backend (`generate-content/index.ts`)

Adicionar parâmetro `step` para controlar o que é gerado:

| Step | Gera | Recebe |
|------|------|--------|
| `strategy` | Só estratégia | Ideia, formato, nicho, etc. |
| `content` | Carrossel/Reels (sem caption) | Estratégia aprovada + contexto |
| `caption` | Legenda + CTA | Estratégia + conteúdo aprovado |
| `visual_prompts` | Prompts visuais | Slides aprovados + estratégia |

Se `step` não for enviado, mantém o comportamento atual (tudo de uma vez) para compatibilidade.

### Mudanças no frontend (`ContentEngine.tsx`)

1. **Novo estado `wizardStep`**: controla qual etapa está ativa (1-5)
2. **Estado `approvedData`**: acumula dados aprovados (strategy, content, caption, prompts)
3. **Tabs dinâmicas**: só mostram abas até o step atual
4. **Botão "Continuar"**: no rodapé de cada aba, dispara a geração da próxima etapa
5. **Botão "Regenerar"**: regenera a etapa atual (consome créditos)
6. **Abas "Prompts Visuais" e "Imagens"**: só aparecem se `generateImages` está ativo
7. **Edição manual**: o usuário pode editar campos antes de clicar "Continuar" (a versão editada é usada na próxima etapa)

### Lógica de créditos

- Etapa 1 (Estratégia): cobra os créditos do modelo selecionado
- Etapa 2 (Conteúdo): cobra novamente os créditos do modelo
- Etapa 3 (Legenda): cobra créditos do modelo
- Etapa 4 (Prompts Visuais): cobra créditos do modelo
- Etapa 5 (Imagens): cobra créditos de imagem (já existente)
- Regenerar qualquer etapa: cobra créditos novamente

**Nota**: como antes era 1 chamada = 1 custo, agora serão ~3-4 chamadas. Os custos por chamada seriam menores proporcionalmente, ou posso manter o custo só na primeira etapa e as subsequentes sem custo extra. Preciso da sua preferência aqui.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/generate-content/index.ts` | Aceitar `step` param, gerar parcialmente |
| `src/pages/ContentEngine.tsx` | Wizard flow, tabs progressivas, botão "Continuar" |

### UX

- Loading spinner só na aba sendo gerada
- Abas já aprovadas ficam clicáveis para revisão (mas não editáveis após aprovação, ou editáveis com botão "Reaprovar"?)
- Barra de progresso opcional no topo mostrando as etapas

