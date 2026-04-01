

# Plano: Adicionar página Content Engine MASTER

## Problema com o código fornecido

O código original tem falhas de segurança críticas:
- Chama a API da Anthropic **diretamente do browser** (expõe chave ou nem funciona sem header de auth)
- Expõe chave do Gemini no frontend via `VITE_GEMINI_API_KEY`

O projeto **já possui** edge functions (`generate-content` e `generate-images`) que fazem exatamente isso de forma segura. Vamos reutilizá-las.

## O que será feito

### 1. Criar `src/pages/ContentEngine.tsx`
- Layout sidebar + área principal conforme o código fornecido (visual dark/violet)
- Formulário na sidebar com os mesmos campos (ideia, formato, objetivo, consciência, tom, estilo visual, nicho, oferta, cards, toggle de imagens)
- **Em vez de chamar APIs diretamente**, usar `supabase.functions.invoke("generate-content")` e `supabase.functions.invoke("generate-images")` — as mesmas edge functions já existentes
- Mapear os valores do formulário para o formato esperado pelas edge functions (ex: "carrossel" → "carousel", "frio" → "cold")
- Tabs de resultado: Estratégia, Carrossel/Reels, Legenda, Prompts Visuais, Imagens
- Funcionalidades de copiar texto e regenerar imagens individuais

### 2. Adicionar rota em `App.tsx`
- Rota `/app/content-engine` dentro do bloco protegido (nested sob `/app`)
- Nota: as rotas atuais não usam nested routes, então será `/content-engine` como rota protegida independente

### 3. Adicionar link na navegação do Index.tsx
- Botão "Content Engine" no topBar junto com Usuários, Biblioteca e Sair

## Detalhes técnicos
- Nenhuma nova edge function necessária — reutiliza as existentes
- Nenhuma variável de ambiente nova — as chaves já estão configuradas no backend
- O seletor de modelo de IA será incluído (usa o campo `ai_provider` já suportado pela edge function)
- Mapeamento de labels PT-BR → valores internos EN que a edge function espera

