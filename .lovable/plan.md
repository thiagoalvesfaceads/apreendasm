

# Adicionar botão "Gerar imagens no Gemini" na página ContentEngine

## Problema
A página `ContentEngine.tsx` renderiza a aba "Prompts Visuais" inline (linhas 685-725), sem usar o componente `VisualPromptsTab`. O botão foi adicionado apenas ao componente não utilizado.

## Solução
Adicionar o botão "Gerar imagens no Gemini" diretamente em `src/pages/ContentEngine.tsx`, logo após a lista de cards de prompts (antes do fechamento da div na linha 725).

O botão vai:
1. Copiar todos os prompts para o clipboard
2. Mostrar toast "Prompts copiados! Cole no Gemini (Ctrl+V)"
3. Abrir o Gem `https://gemini.google.com/gem/1Jh27NXowbrFiqCzDx6YvO_6UfQiTMuQt` em nova aba

### Arquivo: `src/pages/ContentEngine.tsx`
Inserir antes da linha 725 (`</div>`):
```tsx
<Button
  className="w-full gap-2 mt-2"
  onClick={() => {
    const allPrompts = (result.carousel?.slides || result.reels?.scene_suggestions || [])
      .map((s: any, i: number) => s.visual_prompt ? `Card ${s.slide_number || i + 1}: ${s.visual_prompt}` : s)
      .join("\n\n");
    copy(allPrompts);
    toast.success("Prompts copiados! Cole no Gemini (Ctrl+V)");
    window.open("https://gemini.google.com/gem/1Jh27NXowbrFiqCzDx6YvO_6UfQiTMuQt", "_blank");
  }}
>
  <Sparkles className="w-4 h-4" />
  Gerar imagens no Gemini
</Button>
```

Também importar `Sparkles` de `lucide-react` se ainda não estiver importado.

