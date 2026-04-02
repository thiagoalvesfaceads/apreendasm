

# Fix: Imagens geradas não aparecem nos cards

## Problema identificado

A edge function `generate-images` está dando **timeout** ao processar 7 imagens sequencialmente. Cada imagem leva ~10-15s para gerar + 2.5s de delay entre elas, totalizando ~2 minutos — excedendo o limite de execução. Os logs de rede mostram "Failed to fetch" nas chamadas do Card Generator.

Além disso, o ContentEngine já chama `generate-images` com `visual_style` antes de navegar, e depois o CardGenerator chama novamente — duplicando o trabalho.

## Solução

### 1. `supabase/functions/generate-images/index.ts` — processar em paralelo com timeout maior

- Processar as imagens em batches de 3 em paralelo (usando `Promise.allSettled`) em vez de 1 por vez sequencialmente
- Reduzir o delay entre batches para 1s
- Isso reduz o tempo total de ~2min para ~40s

### 2. `src/pages/CardGenerator.tsx` — corrigir race condition no rendering

- Ajustar a lógica do `useEffect` de rendering para garantir que re-renderiza corretamente quando `slideImgs` atualiza
- Remover a condição `!loadingImages || allImgsLoaded` que causa render prematuro sem imagens
- Separar: renderizar texto imediatamente, re-renderizar quando imagens carregam

### 3. `src/pages/CardGenerator.tsx` — reutilizar imagens já geradas

- Verificar se o ContentEngine já salvou URLs de imagens no localStorage junto com os slides
- Se já existirem, pular a geração e usar diretamente

## Arquivos alterados
- `supabase/functions/generate-images/index.ts` — paralelizar geração em batches de 3
- `src/pages/CardGenerator.tsx` — corrigir rendering e reutilizar imagens existentes
- `src/pages/ContentEngine.tsx` — salvar URLs de imagens geradas no localStorage junto com slides

