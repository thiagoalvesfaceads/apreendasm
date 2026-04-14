

## Plano: Adicionar botão "Baixar Todas" na aba Imagens do ContentEngine

### Problema
Os cards individuais já têm botões, mas falta um botão de download na aba de imagens — especificamente um "Baixar Todas" no topo (ao lado do "Gerar Todas") e um botão de download individual em cada card.

### Mudanças em `src/pages/ContentEngine.tsx`

1. **Importar `Download`** do lucide-react (linha 6)

2. **Adicionar função `handleDownloadImage`** — fetch → blob → download do navegador

3. **Adicionar função `handleDownloadAll`** — itera todas as imagens válidas e baixa cada uma

4. **Botão "Baixar Todas"** ao lado do "Gerar Todas" (linha ~899), visível apenas quando há imagens geradas

5. **Botão de download por card** ao lado do "Regenerar/Gerar" (linha ~923), visível apenas quando a imagem existe

### Layout
```text
                            [Baixar Todas ⬇] [Gerar Todas ↻]
┌────────┐  ┌────────┐  ┌────────┐
│ imagem │  │ imagem │  │ imagem │
│Card 1  │  │Card 2  │  │Card 3  │
│[Regen] [⬇]│[Regen] [⬇]│[Gerar]  │
└────────┘  └────────┘  └────────┘
```

### Arquivo alterado
| Arquivo | Mudança |
|---------|---------|
| `src/pages/ContentEngine.tsx` | Import Download, funções de download, botões no topo e por card |

