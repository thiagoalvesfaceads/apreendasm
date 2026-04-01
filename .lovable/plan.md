

# Plano: Implementar Geração de Imagens com Nano Banana 2

## O que será feito

### 1. Criar bucket de Storage (`generated-images`)
Migração SQL para criar bucket público para armazenar as imagens geradas.

### 2. Criar Edge Function `generate-images`
- Recebe lista de prompts visuais
- Chama `google/gemini-3.1-flash-image-preview` via AI Gateway com `modalities: ["image", "text"]`
- Faz upload das imagens base64 para o bucket via Supabase client (service role)
- Retorna URLs públicas

### 3. Atualizar `useContentGeneration.ts`
- Implementar `regenerateImages()` — gera imagens para todos os slides
- Implementar `regenerateSlide(slideNumber)` — regenera imagem de um slide
- Se `generate_images` estiver ativo no formulário, chamar automaticamente após gerar conteúdo
- Adicionar estado `isGeneratingImages` para loading separado

### 4. Atualizar UI
- `ImagesTab` exibe imagens do bucket com loading state
- `CarouselTab` mostra thumbnail da imagem em cada slide (se disponível)
- Loading indicator durante geração de imagens

## Detalhes Técnicos

**Modelo:** `google/gemini-3.1-flash-image-preview` (Nano Banana 2)

**Edge Function** (`supabase/functions/generate-images/index.ts`):
- Processa prompts sequencialmente com delay de 2s entre cada (evitar rate limit)
- Extrai base64 de `data.choices[0].message.images[0].image_url.url`
- Upload para `generated-images/{timestamp}_{index}.png`
- Retorna array de URLs públicas

**Storage:**
- Bucket `generated-images` público
- RLS: permitir leitura anônima, escrita via service role na Edge Function

**Frontend:**
- `regenerateImages()` chama `supabase.functions.invoke('generate-images', { body: { prompts } })`
- Atualiza `result.carousel.slides[i].image_url` com URLs retornadas

