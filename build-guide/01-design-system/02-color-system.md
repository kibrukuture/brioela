# Color System

## Philosophy

The color system has two layers: a static token layer (primitive and semantic) and a dynamic verdict field layer. The static layer handles all standard UI. The dynamic layer handles context-reactive surfaces where the interface adapts its color state based on what the AI has determined. These two layers never overlap.

---

## Three-Level Token Architecture

**Level 1 — Primitive**
Raw values. Never used directly in components. Exist only as the foundation for semantic tokens.

**Level 2 — Semantic**
Usage-specific names. These are what components reference. A component should never know the raw hex value it is using — it should know only the semantic intent (e.g., `surface.glass`, `text.primary`, `verdict.safe`).

**Level 3 — Component**
Per-component overrides when a semantic token alone is insufficient. Rare. Only when a component has a design requirement that cannot be expressed through a semantic token.

---

## Base Palette (Primitives)

These are never referenced directly in components.

```ts
// primitives — internal only, never used in components
const primitive = {
  black:        '#0E0C10',  // warm near-black, faint violet undertone
  blackDark:    '#080609',  // deepest dark for absolute backgrounds
  white:        '#F2F0F5',  // off-white, warm tint — never pure #FFFFFF
  warmGray:     '#C8C5D0',
  midGray:      '#7A7785',
  dimGray:      '#3D3A45',

  greenDeep:    '#0D2B1A',
  greenMid:     '#1A4A2E',
  greenBright:  '#4DB87A',

  amberDeep:    '#2E1E00',
  amberMid:     '#5C3D00',
  amberBright:  '#C49A2B',

  redDeep:      '#2A0000',
  redMid:       '#4A0F0F',
  redBright:    '#B33A3A',

  glassWhite:   'rgba(255, 255, 255, 0.06)',
  glassBorder:  'rgba(255, 255, 255, 0.10)',
  glassShadow:  'rgba(0, 0, 0, 0.40)',
}
```

---

## Semantic Tokens

These are what every component imports and uses.

### Background

| Token | Value | Usage |
|---|---|---|
| `background.primary` | `primitive.black` | Root screen background |
| `background.deep` | `primitive.blackDark` | Modals behind, overlays beneath glass |

### Surface

| Token | Value | Usage |
|---|---|---|
| `surface.glass` | `primitive.glassWhite` | Liquid Glass card background (paired with BackdropBlur) |
| `surface.glass.border` | `primitive.glassBorder` | 1px border on glass surfaces |
| `surface.glass.shadow` | `primitive.glassShadow` | Drop shadow beneath glass elements |
| `surface.elevated` | `rgba(255,255,255,0.10)` | Elevated surface — one level above glass |
| `surface.recessed` | `rgba(0,0,0,0.25)` | Recessed input or inset surface |

### Text

| Token | Value | Usage |
|---|---|---|
| `text.primary` | `primitive.white` | All primary text on dark background |
| `text.secondary` | `primitive.warmGray` | Secondary/supporting text |
| `text.tertiary` | `primitive.midGray` | Captions, timestamps, de-emphasized text |
| `text.disabled` | `primitive.dimGray` | Disabled state text |
| `text.inverse` | `primitive.black` | Text on light/colored surfaces |

### Accent

| Token | Value | Usage |
|---|---|---|
| `accent.primary` | `primitive.greenBright` | Primary positive action (confirm, success, safe) |
| `accent.caution` | `primitive.amberBright` | Caution indicator |
| `accent.danger` | `primitive.redBright` | Danger, hard alert, hard block |

### Border

| Token | Value | Usage |
|---|---|---|
| `border.subtle` | `rgba(255,255,255,0.08)` | Subtle dividers, inner borders |
| `border.visible` | `rgba(255,255,255,0.15)` | Visible borders on cards |
| `border.accent` | `primitive.greenBright` | Highlighted / selected border |

### Verdict Field (Dynamic)

These tokens are not static colors — they define the color space that the Verdict Field system (see below) uses when blooming a background.

| Token | Surface Start | Surface End | Usage |
|---|---|---|---|
| `verdict.safe.start` | `#0E0C10` | `#0D2B1A` | Safe scan — bloom from |
| `verdict.safe.end` | `#0D2B1A` | `#1A4A2E` | Safe scan — bloom to |
| `verdict.caution.start` | `#0E0C10` | `#2E1E00` | Caution scan — bloom from |
| `verdict.caution.end` | `#2E1E00` | `#5C3D00` | Caution scan — bloom to |
| `verdict.danger.start` | `#0E0C10` | `#2A0000` | Danger scan — bloom from |
| `verdict.danger.end` | `#2A0000` | `#4A0F0F` | Danger scan — bloom to |
| `verdict.neutral` | — | — | No bloom — base surface only |

---

## The Verdict Field System

The Verdict Field is a dynamic color bloom applied to specific surfaces when context changes. The surface transitions from a base color field to a verdict-specific color field using a Skia linear gradient whose uniforms are driven by a Reanimated SharedValue.

**How it works technically:**
1. A Skia `LinearGradient` fills the card canvas with `verdict.safe.start` (or caution/danger equivalent)
2. A Reanimated `useSharedValue(0)` is animated from `0` to `1` when verdict arrives
3. The shared value drives the gradient `opacity` uniform
4. Result: the color blooms into the card background as the verdict becomes known

**Spring configurations:**
- Safe verdict bloom: `{ stiffness: 180, damping: 0.85, mass: 1.0 }` — a settling bloom
- Caution verdict bloom: `{ stiffness: 220, damping: 0.90, mass: 1.0 }` — slightly faster
- Danger verdict bloom: `{ stiffness: 600, damping: 1.0, mass: 1.0 }` — snaps in immediately (no bounce on danger)
- Neutral / dismiss: `{ stiffness: 280, damping: 1.0 }` — crisp exit

**What uses the Verdict Field:**
- Scan result surfaces — defined in the scanner feature UI spec
- Any AI-evaluated surface where a safe/caution/danger classification is returned
- Not used for static UI, decorative backgrounds, or content that has no verdict

**What never uses the Verdict Field:**
- Navigation bars, tab bars, settings, any chrome
- Standard cards (no AI verdict involved)
- Decorative or ambient surfaces (those use Skia shaders, not the verdict field)

---

## Dark Mode

This design system is dark-first. There is no light mode variant. The `background.primary` (`#0E0C10`) is always the root surface. Adaptive system colors that must respond to OS dark/light mode (e.g., if a native sheet appears) use `PlatformColor`:

```ts
import { PlatformColor } from 'react-native'

// For any native-controlled surfaces
const adaptiveLabel = PlatformColor('label', '#F2F0F5')
const adaptiveSecondary = PlatformColor('secondaryLabel', '#C8C5D0')
```

For all Brioela-controlled surfaces: always use the semantic tokens directly. `PlatformColor` is only for system-controlled views that impose their own color environment.

---

## NativeWind Usage

Brioela uses NativeWind. All color is expressed as Tailwind class names. The semantic token names above map directly to Tailwind color classes extended in `tailwind.config.ts`:

```ts
// tailwind.config.ts — color extension (excerpt)
theme: {
  extend: {
    colors: {
      background: {
        primary: '#0E0C10',
        deep:    '#080609',
      },
      surface: {
        glass:  'rgba(255,255,255,0.06)',
        // ...
      },
      text: {
        primary:   '#F2F0F5',
        secondary: '#C8C5D0',
        tertiary:  '#7A7785',
        // ...
      },
      accent: {
        primary: '#4DB87A',
        caution: '#C49A2B',
        danger:  '#B33A3A',
      },
    }
  }
}
```

In components, color is always a Tailwind class referencing a semantic token:
```tsx
<View className="bg-background-primary" />
<Text className="text-text-primary" />
<Text className="text-text-secondary" />
<View className="bg-surface-glass border border-surface-glass-border" />
```

Skia fills and Reanimated-driven colors that cannot use Tailwind classes import raw hex values from `src/design-system/colors.ts` — the same source that feeds the Tailwind config.

## Rules

- No raw hex, `rgba()`, or named colors in any component — in NativeWind classes or Skia fills. Always reference a semantic token.
- Arbitrary Tailwind color values (`text-[#FF0000]`, `bg-[rgba(0,0,0,0.5)]`) are banned.
- The Tailwind config and `src/design-system/colors.ts` must stay in sync — both derive from the same primitive values.
- The Verdict Field bloom is not a "color change" — it is an animation. Logic for when to bloom lives in the AI verdict response handler. The component observes a SharedValue and renders accordingly.
- Color names in tokens always describe intent, not appearance. `text-text-secondary` not `text-gray-400`. Never use Tailwind's default palette (gray, slate, zinc, etc.) — only the extended semantic tokens.
