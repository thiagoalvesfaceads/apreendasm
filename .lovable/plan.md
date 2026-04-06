

# Aplicar o padrão visual do projeto "Apreenda: Estratégia Sustentável"

## O que muda

O projeto referência usa:
- **Fonte**: Montserrat (sem serif/display)
- **Background**: Gunmetal `216 8% 10%` (em vez do atual `240 10% 4%`)
- **Primary/Accent**: Champagne `39 52% 80%` (em vez do gold `40 60% 55%`)
- **Foreground**: Branco puro com opacidades (em vez do bege `40 10% 90%`)
- **Borders/inputs**: Tons de gunmetal mais claros
- **Sem** utilities customizadas como `text-gradient-gold` ou `glow-gold`

## Alterações

### 1. `src/index.css`
- Trocar import do Google Fonts de Inter+Playfair Display para **Montserrat**
- Substituir todas as CSS variables `:root` pelas do projeto referência (gunmetal bg, champagne primary, white foreground, sidebar vars)
- Body: trocar `font-sans` por Montserrat, remover `font-display` dos headings
- Remover utilities `text-gradient-gold`, `glow-gold`, `card-premium` (ou adaptar `card-premium` para o novo esquema)

### 2. `tailwind.config.ts`
- `fontFamily`: trocar `sans` para Montserrat, remover `display` (Playfair)
- Adicionar cores `champagne` e `gunmetal` como atalhos diretos
- Remover cores `gold` e `surface` customizadas
- Remover animações `shimmer` e `pulse-gold` (não existem no referência)
- Adicionar animação `fade-in-up` do referência

### 3. Referências a classes removidas
- Buscar usos de `font-display`, `text-gradient-gold`, `glow-gold`, `card-premium`, `gold`, `surface-elevated`, `surface-overlay` no código e substituir por equivalentes do novo design system (ex: `card-premium` → classes inline com border/bg do novo tema)

## Resultado
A aplicação inteira vai adotar o visual Gunmetal + Champagne com Montserrat, igual ao projeto referência.

