

## Plano: Diagnosticar e corrigir resposta MiniMax Image API

### Problema
A API MiniMax retorna HTTP 200 mas o código não encontra a imagem no path `data.data.image_list[0].image_base64`. Nenhum erro HTTP é logado — apenas "No image in MiniMax response". A estrutura real da resposta é desconhecida.

### Solução

**1. Adicionar logging da resposta raw** (para diagnosticar a estrutura):
```typescript
const data = await response.json();
console.log(`MiniMax image raw response keys for prompt ${index}:`, JSON.stringify(Object.keys(data)), JSON.stringify(data).substring(0, 500));
```

**2. Tentar paths alternativos** da resposta MiniMax (baseado na documentação):
- `data.data.image_list[0].image_base64` (atual)
- `data.data[0].b64_json` (formato alternativo)
- `data.image_list[0].image_base64`
- `data.data.image_list[0].b64_json`

O código ficará:
```typescript
const data = await response.json();
console.log(`MiniMax image response for prompt ${index}:`, JSON.stringify(data).substring(0, 500));

let imageData = data?.data?.image_list?.[0]?.image_base64
  || data?.data?.image_list?.[0]?.b64_json
  || data?.data?.[0]?.b64_json
  || data?.image_list?.[0]?.image_base64;

// Also try URL-based response
const imageUrl = data?.data?.image_list?.[0]?.image_url
  || data?.data?.[0]?.url;
```

Se a API retornar URL em vez de base64, fazer fetch da URL e depois upload.

### Arquivo alterado
| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/generate-images/index.ts` | Adicionar log raw + suportar múltiplos formatos de resposta MiniMax |

Redeploy da edge function após a mudança. O primeiro teste mostrará nos logs a estrutura real para refinamento.

