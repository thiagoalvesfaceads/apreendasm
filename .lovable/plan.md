

## Plano: Corrigir o fluxo wizard — botão "Continuar" e tabs progressivas

### Problema
O wizard não está funcionando como esperado:
1. Todas as abas aparecem de uma vez (Estratégia + Carrossel + Legenda)
2. O botão "Continuar" não aparece
3. O progresso mostra "Etapa 5 de 3", ultrapassando o máximo

### Causa raiz
Dois bugs no `ContentEngine.tsx`:

1. **wizardStep ultrapassa maxSteps**: quando `generateImages=false`, `maxSteps=3`, mas o código permite `wizardStep=5`. Isso faz todas as tabs aparecerem.

2. **getNextAction retorna null para steps passados**: a lógica na linha 394 (`if (currentTabStep < wizardStep) return null`) oculta o botão "Continuar" em qualquer aba que não seja a última. Isso é correto quando o wizard funciona passo a passo, mas se por algum motivo o wizardStep avança rápido (ex: dados carregados do paste, sessão anterior, ou backend sem step), o botão desaparece.

### Possível causa adicional
A edge function pode não ter sido redeployada — se o backend ainda roda a versão antiga (sem suporte a `step`), ele retorna tudo de uma vez. O frontend recebe `strategy + carousel + caption` e deveria ignorar os dados extras, mas `handleGenerateStrategy` só usa `data.strategy` e seta `wizardStep(1)`. Contudo, se houve um fluxo via paste ou sessão anterior, isso explica o estado inconsistente.

### Correções

**`src/pages/ContentEngine.tsx`:**

1. **Limitar wizardStep ao maxSteps**: adicionar um `useEffect` ou clamp para garantir que `wizardStep` nunca ultrapasse `maxSteps`

2. **Corrigir getNextAction**: o botão "Continuar" deve aparecer na aba do step mais recente (o último tab), não em abas anteriores. A lógica já faz isso, mas precisa garantir que funcione quando `currentTabStep === wizardStep`

3. **Garantir que a edge function está deployada**: re-deploiar `generate-content` para garantir que aceita o parâmetro `step`

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ContentEngine.tsx` | Clamp wizardStep ≤ maxSteps, validar lógica do botão "Continuar" |
| `supabase/functions/generate-content/index.ts` | Re-deploy (sem mudanças, apenas garantir deploy) |

