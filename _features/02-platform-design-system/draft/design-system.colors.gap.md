# Gap snapshot: design-system/colors.ts

Target: `mobile/design-system/colors.ts`

**Status:** Not in repo. Production uses `mobile/theme/colors.ts` (iOS/Android system palette). Spec: `build-guide/01-design-system/02-color-system.md`.

```typescript
/**
 * Primitive palette — never referenced directly in components.
 * Semantic tokens map to Tailwind via tailwind.config + global.css.
 * Skia/Reanimated code imports semantic or primitive values from here.
 */
export const primitive = {
  cream: '#F8F6F2',
  creamDeep: '#EDE9E3',
  white: '#FFFFFF',
  warmBlack: '#1C1917',
  stone600: '#78716C',
  stone400: '#A8A29E',
  stone300: '#C4BDB8',
  nearBlack: '#0E0C10',
  nearBlackDeep: '#080609',
  offWhite: '#F2F0F5',
  greenDeep: '#2D7A4F',
  greenBright: '#4DB87A',
  greenField: '#DCFCE7',
  greenFieldSub: '#F0FDF4',
  greenDark: '#1A4A2E',
  greenDarkSub: '#0D2B1A',
  amberDeep: '#92400E',
  amberBright: '#C49A2B',
  amberField: '#FEF3C7',
  amberFieldSub: '#FFFBEB',
  amberDark: '#5C3D00',
  amberDarkSub: '#2E1E00',
  redDeep: '#991B1B',
  redBright: '#B33A3A',
  redField: '#FFE4E6',
  redFieldSub: '#FFF1F2',
  redDark: '#4A0F0F',
  redDarkSub: '#2A0000',
} as const

export type VerdictLevel = 'safe' | 'caution' | 'danger' | 'neutral'

export const semantic = {
  light: {
    background: { primary: primitive.cream, deep: primitive.creamDeep },
    surface: {
      glass: 'rgba(255,255,255,0.72)',
      glassBorder: 'rgba(0,0,0,0.06)',
      elevated: 'rgba(255,255,255,0.90)',
      recessed: 'rgba(0,0,0,0.04)',
    },
    text: {
      primary: primitive.warmBlack,
      secondary: primitive.stone600,
      tertiary: primitive.stone400,
      disabled: primitive.stone300,
      inverse: primitive.cream,
    },
    accent: {
      primary: primitive.greenDeep,
      caution: primitive.amberDeep,
      danger: primitive.redDeep,
    },
  },
  dark: {
    background: { primary: primitive.nearBlack, deep: primitive.nearBlackDeep },
    surface: {
      glass: 'rgba(255,255,255,0.06)',
      glassBorder: 'rgba(255,255,255,0.10)',
      elevated: 'rgba(255,255,255,0.10)',
      recessed: 'rgba(0,0,0,0.25)',
    },
    text: {
      primary: primitive.offWhite,
      secondary: '#C8C5D0',
      tertiary: '#7A7785',
      disabled: '#3D3A45',
      inverse: primitive.warmBlack,
    },
    accent: {
      primary: primitive.greenBright,
      caution: primitive.amberBright,
      danger: primitive.redBright,
    },
  },
} as const

export function verdictBloomColors(
  level: VerdictLevel,
  mode: 'light' | 'dark',
): { start: string; end: string } | null {
  if (level === 'neutral') return null
  const map = {
    light: {
      safe: { start: primitive.cream, end: primitive.greenField },
      caution: { start: primitive.cream, end: primitive.amberField },
      danger: { start: primitive.cream, end: primitive.redField },
    },
    dark: {
      safe: { start: primitive.nearBlack, end: primitive.greenDark },
      caution: { start: primitive.nearBlack, end: primitive.amberDark },
      danger: { start: primitive.nearBlack, end: primitive.redDark },
    },
  } as const
  return map[mode][level]
}
```

**Conflict:** `build-guide/03-foundation/05-mobile-setup.md` `global.css` sample uses teal `#14B8A6` for `--accent-primary`; `02-color-system.md` uses sage `#2D7A4F`. **02-color-system wins** per design-system folder authority.
