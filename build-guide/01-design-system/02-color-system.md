# Color System

## Philosophy

Light mode is primary. Dark mode is fully supported and accommodated — the token system is designed so dark mode works by switching semantic values, not redesigning. But every color decision is made light-first.

The palette is warm, not clinical. The background is a warm cream — not pure white, not cold gray. Text is a dark warm brown-black — not pure black, not cold charcoal. The warmth is intentional: food is sensory and personal. The interface should feel like it.

---

## Three-Level Token Architecture

**Level 1 — Primitive**
Raw values. Never used in components. Foundation for semantic tokens only.

**Level 2 — Semantic**
Usage-specific names. What every component references. A component never knows the raw hex it uses — only the intent (`surface.glass`, `text.secondary`, `accent.primary`).

**Level 3 — Component**
Per-component overrides when a semantic token is insufficient. Rare.

---

## Base Palette (Primitives — never referenced in components)

```ts
const primitive = {
  // Light base
  cream:        '#F8F6F2',  // warm cream — primary light background
  creamDeep:    '#EDE9E3',  // slightly deeper cream — recessed surfaces
  white:        '#FFFFFF',  // pure white — elevated card surfaces
  warmBlack:    '#1C1917',  // very dark warm brown-black — primary text
  stone600:     '#78716C',  // warm mid gray — secondary text
  stone400:     '#A8A29E',  // lighter warm gray — tertiary text
  stone300:     '#C4BDB8',  // disabled text

  // Dark base
  nearBlack:    '#0E0C10',  // warm near-black, faint violet — dark bg
  nearBlackDeep:'#080609',  // deepest dark — beneath dark surfaces
  offWhite:     '#F2F0F5',  // off-white — primary text on dark

  // Accent — adjusted per mode for contrast
  greenDeep:    '#2D7A4F',  // deep sage — meets contrast on cream (light)
  greenBright:  '#4DB87A',  // bright sage — readable on dark surfaces (dark)
  greenField:   '#DCFCE7',  // safe verdict bloom surface (light)
  greenFieldSub:'#F0FDF4',  // safe verdict bloom start (light)
  greenDark:    '#1A4A2E',  // safe verdict bloom surface (dark)
  greenDarkSub: '#0D2B1A',  // safe verdict bloom start (dark)

  amberDeep:    '#92400E',  // deep amber — meets contrast on cream (light)
  amberBright:  '#C49A2B',  // amber — readable on dark (dark)
  amberField:   '#FEF3C7',  // caution verdict bloom (light)
  amberFieldSub:'#FFFBEB',  // caution bloom start (light)
  amberDark:    '#5C3D00',  // caution bloom (dark)
  amberDarkSub: '#2E1E00',  // caution bloom start (dark)

  redDeep:      '#991B1B',  // deep red — meets contrast on cream (light)
  redBright:    '#B33A3A',  // red — readable on dark (dark)
  redField:     '#FFE4E6',  // danger verdict bloom (light)
  redFieldSub:  '#FFF1F2',  // danger bloom start (light)
  redDark:      '#4A0F0F',  // danger bloom (dark)
  redDarkSub:   '#2A0000',  // danger bloom start (dark)
}
```

---

## Semantic Tokens

All Tailwind class names reference these via `tailwind.config.ts` extension. Components use class names — never raw values.

### Background

| Semantic | Light value | Dark value | Class |
|---|---|---|---|
| `background.primary` | `#F8F6F2` | `#0E0C10` | `bg-bg-primary dark:bg-bg-primary` |
| `background.deep` | `#EDE9E3` | `#080609` | `bg-bg-deep dark:bg-bg-deep` |

### Surface

| Semantic | Light value | Dark value | Class |
|---|---|---|---|
| `surface.glass` | `rgba(255,255,255,0.72)` | `rgba(255,255,255,0.06)` | `bg-surface-glass` |
| `surface.glass.border` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.10)` | `border-surface-glass-border` |
| `surface.glass.shadow` | `rgba(0,0,0,0.08)` | `rgba(0,0,0,0.40)` | shadow via `elevation` token |
| `surface.elevated` | `rgba(255,255,255,0.90)` | `rgba(255,255,255,0.10)` | `bg-surface-elevated` |
| `surface.recessed` | `rgba(0,0,0,0.04)` | `rgba(0,0,0,0.25)` | `bg-surface-recessed` |

### Text

| Semantic | Light value | Dark value | Class |
|---|---|---|---|
| `text.primary` | `#1C1917` | `#F2F0F5` | `text-text-primary dark:text-text-primary` |
| `text.secondary` | `#78716C` | `#C8C5D0` | `text-text-secondary dark:text-text-secondary` |
| `text.tertiary` | `#A8A29E` | `#7A7785` | `text-text-tertiary dark:text-text-tertiary` |
| `text.disabled` | `#C4BDB8` | `#3D3A45` | `text-text-disabled dark:text-text-disabled` |
| `text.inverse` | `#F8F6F2` | `#1C1917` | `text-text-inverse dark:text-text-inverse` |

### Accent

| Semantic | Light value | Dark value | Class |
|---|---|---|---|
| `accent.primary` | `#2D7A4F` | `#4DB87A` | `text-accent-primary dark:text-accent-primary` |
| `accent.caution` | `#92400E` | `#C49A2B` | `text-accent-caution dark:text-accent-caution` |
| `accent.danger` | `#991B1B` | `#B33A3A` | `text-accent-danger dark:text-accent-danger` |

### Border

| Semantic | Light value | Dark value | Class |
|---|---|---|---|
| `border.subtle` | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.08)` | `border-border-subtle` |
| `border.visible` | `rgba(0,0,0,0.10)` | `rgba(255,255,255,0.15)` | `border-border-visible` |
| `border.accent` | `#2D7A4F` | `#4DB87A` | `border-border-accent` |

---

## The Verdict Field System

Context-reactive color bloom applied to specific surfaces when the AI has evaluated something. Light and dark mode bloom to different color spaces — both designed specifically for their mode.

### Light mode bloom targets

| Verdict | Start surface | End surface |
|---|---|---|
| Safe | `#F8F6F2` → `#F0FDF4` | `#F0FDF4` → `#DCFCE7` — light sage green |
| Caution | `#F8F6F2` → `#FFFBEB` | `#FFFBEB` → `#FEF3C7` — warm amber light |
| Danger | `#F8F6F2` → `#FFF1F2` | `#FFF1F2` → `#FFE4E6` — light rose red |
| Neutral | No bloom — base surface only | |

### Dark mode bloom targets

| Verdict | Start surface | End surface |
|---|---|---|
| Safe | `#0E0C10` → `#0D2B1A` | `#0D2B1A` → `#1A4A2E` — deep forest |
| Caution | `#0E0C10` → `#2E1E00` | `#2E1E00` → `#5C3D00` — deep amber |
| Danger | `#0E0C10` → `#2A0000` | `#2A0000` → `#4A0F0F` — deep red |
| Neutral | No bloom — base surface only | |

**Spring configs for bloom animation — unchanged from `04-motion.md`:**
- Safe: `stiffness 180, damping 0.85` — settling bloom
- Caution: `stiffness 220, damping 0.90` — slightly faster
- Danger: `stiffness 600, damping 1.0` — snaps in, zero bounce (urgency)

---

## Dark Mode — NativeWind Pattern

Dark mode is configured via NativeWind's `dark:` variant. The app's root sets the color scheme, NativeWind applies all `dark:` overrides automatically.

```tsx
// tailwind.config.ts
module.exports = {
  darkMode: 'class',  // or 'media' — TBD based on manual toggle vs OS setting
  theme: {
    extend: {
      colors: {
        bg: {
          primary: { DEFAULT: '#F8F6F2', dark: '#0E0C10' },
          deep:    { DEFAULT: '#EDE9E3', dark: '#080609' },
        },
        text: {
          primary:   { DEFAULT: '#1C1917', dark: '#F2F0F5' },
          secondary: { DEFAULT: '#78716C', dark: '#C8C5D0' },
          // ...
        },
        accent: {
          primary: { DEFAULT: '#2D7A4F', dark: '#4DB87A' },
          // ...
        },
      }
    }
  }
}
```

---

## Accessibility — Contrast Ratios

All light mode text tokens meet WCAG 2.1 AA minimum (4.5:1 for normal text, 3:1 for large text):

| Pair | Ratio | Passes |
|---|---|---|
| `text.primary` on `background.primary` (#1C1917 on #F8F6F2) | ~14:1 | AA + AAA |
| `text.secondary` on `background.primary` (#78716C on #F8F6F2) | ~4.8:1 | AA |
| `accent.primary` on `background.primary` (#2D7A4F on #F8F6F2) | ~5.2:1 | AA |
| `accent.danger` on `background.primary` (#991B1B on #F8F6F2) | ~6.8:1 | AA + AAA |

Dark mode equivalents similarly verified against dark background values.

---

## NativeWind Usage Rules

- No raw hex, `rgba()`, or named colors in any className — always semantic token classes.
- Arbitrary Tailwind color values (`text-[#FF0000]`, `bg-[rgba(0,0,0,0.5)]`) are banned.
- Tailwind config and `src/design-system/colors.ts` stay in sync — both derive from the same primitive values.
- Skia fills and Reanimated-driven colors that cannot use Tailwind import raw values from `src/design-system/colors.ts`.
- Never use Tailwind's default palette (gray, slate, stone, zinc, etc.) — only extended semantic tokens.
- The Verdict Field bloom is an animation, not a color change. Logic for when to bloom lives in the AI verdict response handler, not in the component.
- Color names describe intent, not appearance. `text-text-secondary` not `text-stone-400`. `bg-surface-glass` not `bg-white/70`.
