
O que aconteceu:
- O que foi alterado antes não é o formulário que você está usando em `/content-engine`.
- A tela atual usa `src/pages/ContentEngine.tsx`, e nela os preços estão hardcoded ainda como:
  - Gemini Flash = `1 cr`
  - Gemini Pro = `3 cr`
  - GPT-4o Mini = `2 cr`
  - GPT-4o = `5 cr`
  - Claude = `6 cr`
- Já `src/types/content.ts` foi atualizado, mas esse arquivo não controla a UI dessa página.
- Também confirmei que o backend já está com `handle_new_user()` configurado para criar `user_credits.balance = 0`, então novos usuários não deveriam ganhar créditos grátis.

Como corrigir de forma certa:
1. Atualizar `src/pages/ContentEngine.tsx`
   - Trocar a constante `AI_MODEL_OPTIONS` para refletir os novos valores:
     - Flash Lite = Grátis
     - Flash = 5 créditos
     - GPT-4o Mini = 10 créditos
     - Gemini Pro = 30 créditos
     - GPT-4o = 40 créditos
     - Claude Sonnet = 50 créditos
   - Idealmente parar de duplicar esses valores e passar a reutilizar a fonte central de verdade (`src/types/content.ts` e/ou `src/hooks/useCredits.ts`).

2. Eliminar inconsistência entre arquivos
   - Hoje existem pelo menos 3 fontes diferentes de preço:
     - `src/pages/ContentEngine.tsx`
     - `src/types/content.ts`
     - `src/hooks/useCredits.ts`
   - Vou consolidar isso para evitar que aconteça de novo.

3. Revisar exibição de custo na tela
   - Garantir que o dropdown, o resumo “Esta geração vai custar X créditos” e qualquer outro texto da tela usem a mesma tabela central.

4. Validar a lógica de novos usuários
   - O banco já está com saldo inicial `0`.
   - Vou revisar se existe algum outro fluxo antigo criando saldo em outro lugar, mas pelo código lido até agora não há outro ponto de grant automático além de `handle_new_user()`.

5. Ajustar memória do projeto
   - O índice de memória ainda está desatualizado e fala:
     - “New users get 100 free credits”
     - “OpenAI = 5cr / Anthropic = 6cr”
   - Vou alinhar isso com a regra atual para não induzir futuras mudanças erradas.

Detalhe técnico importante:
- A raiz do problema não é cache.
- É código antigo ainda ativo em `src/pages/ContentEngine.tsx`.
- `GenerationForm.tsx` já mostra os labels novos, mas essa tela aparentemente não está sendo usada na rota atual.

Resultado esperado depois da implementação:
- O seletor da página `/content-engine` vai mostrar os valores corretos.
- O custo calculado vai bater com o débito real do backend.
- Novos usuários continuarão entrando com saldo `0`.
- A base de preços ficará centralizada para evitar divergência futura.
