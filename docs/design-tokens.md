# Loquia — design tokens

Fonte: `:root` e `[data-loq-theme="dark"]` no protótipo. Converter para CSS variables (já é o formato), `tailwind.config` e `tokens.ts`.

## Cor

| Token | Light | Dark | Uso |
|---|---|---|---|
| canvas | #F7F5F1 | #131118 | fundo da página |
| canvas-blur | rgba(247,245,241,.86) | rgba(19,17,24,.88) | header sticky |
| surface | #FFFFFF | #1B1823 | cartões, campos |
| track | #F1EFEA | #262130 | trilhas, barras |
| ink | #1D1926 | #F4F2F7 | texto primário |
| ink-hover | #2E2839 | #E3DEEC | hover de botão sólido |
| muted | #706A78 | #A39CAF | texto secundário |
| faint | #A29CA8 | #7C7589 | rótulos mono |
| dim | #C9C4CE | #514A5E | separadores fracos |
| disabled | #B4AFBA | #6A6478 | desabilitado |
| border | #E4E0E7 | #322C3D | borda padrão |
| border-strong | #D8D3DC | #443C52 | borda de ênfase |
| inverse-surface | #1D1926 | #0E0C13 | sidebar, player, toast |
| inverse-fg | #F7F5F1 | #F4F2F7 | texto sobre inverse |
| iris | #5B4AE6 | #8E82EE | ação primária |
| iris-strong | #4737C4 | #B3A8FF | texto de ênfase |
| iris-soft | #ECE9FF | #241E3D | fundo de destaque |
| iris-line | #C6BDF5 | #3B3266 | borda de destaque |
| iris-tint | #FBFAFF | #1E1A2B | linha ativa |
| sage | #337965 | #5FBFA0 | sucesso |
| sage-soft | #F0F6F4 | #15251F | fundo sucesso |
| amber | #9A6416 | #D9A24A | atenção |
| amber-soft | #FBF6EE | #251C10 | fundo atenção |
| amber-ink | #7A4F12 | #E5BE7E | texto sobre amber-soft |
| danger | #B13D4C | #E6798A | erro/destrutivo |
| danger-soft | #FDF4F4 | #2A1418 | fundo erro |

Dark não é inversão: superfícies ganham matiz roxa, accents sobem em luminosidade para manter contraste AA.
`color-scheme` declarado em ambos os temas.

## Tipografia
Manrope Variable 400/500/600/700/800 — interface. Geist Mono 400/500 — timestamps, JSON, rótulos de sistema, preview.
Escala usada: 38/34/32/29/26/22/19/17/16/15/14.5/13.5/13/12.5/11.5/10.5 px. Títulos com `letter-spacing` −.02 a −.04em; rótulos mono +.1em uppercase.
Fluido via `clamp()`: h1 `clamp(26px,3.2vw,38px)`, hero `clamp(36px,5vw,66px)`.

## Espaço, raio, sombra, motion
- Espaçamento base 4; usados 2,3,4,5,6,7,8,9,10,11,12,14,16,18,20,22,24,26,28,30,32,36,40,44,56,72,88,110.
- Raio: 6 (foco), 7–8 (chip mono), 10 (campo), 12–14 (bloco menor), 16–18 (cartão), 20–22 (cartão grande), 999 (pill).
- Sombra: `--shadow-card` + elevação `0 20px 40px -28px rgba(29,25,38,.34)` no hover; modal `0 40px 90px -40px rgba(29,25,38,.6)`.
- Motion: `.16s` estados, `.18–.28s` entradas, easing `cubic-bezier(.2,.7,.3,1)`; keyframes `loq-in`, `loq-rise`, `loq-sheen`, `loq-pulse`; tudo desligado em `prefers-reduced-motion`.
- Breakpoints alvo: 320, 375, 430, 768, 1024, 1280, 1440. Layout por `repeat(auto-fit,minmax(...,1fr))` em vez de media queries.
- Z-index: 30 header app, 40 header marketing, 70 player, 80/81 drawer, 90/91 export+palette, 94 mini recorder, 96/97 diálogos, 98 offline, 99 toast.
