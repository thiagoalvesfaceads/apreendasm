
## Plano: corrigir a geração de imagens no MiniMax

### Diagnóstico
Encontrei dois problemas objetivos no backend de imagens:

1. `response_format` está errado na chamada do MiniMax  
   Hoje o código envia:
   ```ts
   response_format: "b64_json"
   ```
   Mas os logs mostram claramente que a API aceita apenas:
   - `"url"`
   - `"base64"`

   Erro real nos logs:
   ```text
   invalid params, response_format not 'url' or 'base64'
   ```

2. A função quebra no final por causa de uma variável inexistente  
   Em `supabase/functions/generate-images/index.ts`, o `usage_log` usa:
   ```ts
   image_provider: provider
   ```
   Só que `provider` não existe mais.  
   Isso gera:
   ```text
   ReferenceError: provider is not defined
   ```

Por isso hoje acontece o seguinte:
- o MiniMax não retorna imagem porque a requisição está inválida
- mesmo quando a função continua, ela ainda pode quebrar ao salvar o log
- no frontend isso aparece como “Não foi possível gerar/regenerar”

### Arquivo a corrigir
- `supabase/functions/generate-images/index.ts`

### Mudanças
1. Trocar o payload do MiniMax:
   ```ts
   response_format: "b64_json"
   ```
   para:
   ```ts
   response_format: "base64"
   ```
   ou, alternativamente, `"url"`.

2. Ajustar o parsing da resposta MiniMax para bater com o formato escolhido:
   - se usar `"base64"`, continuar lendo o campo base64
   - se usar `"url"`, usar a URL retornada e fazer upload no bucket como já existe no fallback

3. Corrigir o log de uso:
   - remover `provider`
   - gravar algo estável como:
   ```ts
   image_provider: "minimax"
   ```

4. Revisar a resposta final da edge function para garantir que:
   - erros de MiniMax retornem mensagem útil
   - sucesso parcial continue devolvendo `urls`
   - regeneração unitária e geração em lote usem o mesmo fluxo

### Resultado esperado
Depois dessa correção:
- “Gerar Todas” deve voltar a criar URLs válidas
- “Gerar”/“Regenerar” por card também deve funcionar
- o toast “Não foi possível regenerar” deve sumir quando o MiniMax responder corretamente

### Validação após implementar
1. Testar geração em lote com vários cards
2. Testar regeneração de um único card
3. Confirmar nos logs que:
   - não existe mais erro de `response_format`
   - não existe mais `provider is not defined`
   - a função retorna `urls` preenchidas

### Detalhe técnico
O problema não está no componente `ImagesTab.tsx`.  
A UI está reagindo ao que o backend devolve. O defeito atual está concentrado na edge function `generate-images`.
