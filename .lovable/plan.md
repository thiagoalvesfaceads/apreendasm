

# Fix: Negrito com `**` e espaçamento entre parágrafos no Card Generator

## Problemas
1. **Negrito não funciona**: O texto com `**palavra**` é renderizado literalmente com os asteriscos no canvas, em vez de aplicar negrito.
2. **Texto muito junto**: Não há espaçamento extra entre parágrafos — as linhas ficam coladas, tornando a leitura cansativa.

## Solução

### 1. `src/pages/CardGenerator.tsx` — função `wrapText` + renderização

**Parágrafos com espaçamento:**
- Na função `wrapText`, ao encontrar um `\n` (quebra de parágrafo), inserir uma linha vazia como marcador.
- Na renderização (`fillText` loop), quando encontrar a linha vazia, avançar `cursorY` com espaço extra (~0.5× lineHeight) em vez de desenhar texto.

**Negrito com `**`:**
- Criar uma função `drawFormattedLine` que processa cada linha procurando padrões `**texto**`.
- Para cada segmento:
  - Texto normal: fonte regular
  - Texto entre `**...**`: fonte bold
- Usa `measureText` para posicionar cada segmento sequencialmente na mesma linha.
- Substituir todos os `ctx.fillText(line, ...)` por chamadas a `drawFormattedLine`.

### Detalhe técnico da renderização de negrito
```text
Entrada: "receba seu **mapa estratégico personalizado**."

Segmentos parseados:
  1. "receba seu "        → font normal
  2. "mapa estratégico personalizado"  → font bold  
  3. "."                  → font normal

Cada segmento é desenhado com fillText na posição X atual,
e X avança por measureText(segmento).width
```

### Resultado
- `**texto**` renderiza em negrito no canvas (sem asteriscos visíveis)
- Parágrafos têm espaçamento visual entre si, melhorando a leitura

