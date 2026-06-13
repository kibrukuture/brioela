# Icon System

## Library

**Phosphor Icons** — `phosphor-react-native`

Chosen because it has a six-weight axis (Thin, Light, Regular, Bold, Fill, Duotone) that maps directly onto the typographic system. The icon weight matches the font weight of adjacent text. Cormorant Garamond moments call for Thin or Light icons. Plus Jakarta Sans SemiBold headings call for Regular or Bold icons. No other icon library offers this range in a single cohesive set.

1400+ icons. Actively maintained. React Native support is first-class.

```bash
bun add phosphor-react-native
```

---

## Weight System

| Icon weight | Paired with | Typical context |
|---|---|---|
| `thin` | Cormorant Garamond display text | Large emotive moments, hero headers |
| `light` | Plus Jakarta Sans Regular labels | Secondary UI, supporting info |
| `regular` | Plus Jakarta Sans Medium headings | Standard UI — most common weight |
| `bold` | Plus Jakarta Sans SemiBold / Bold | Active states, primary actions, high emphasis |
| `fill` | Bold (active/selected state only) | Active tab, selected item, toggled on |
| `duotone` | N/A | Not used in Brioela — too decorative |

The rule: **Duotone is never used.** Fill is used only for active/selected states, never as a default appearance.

---

## Icon Size Tokens (from `03-spacing.md`)

| Token | Value | Usage |
|---|---|---|
| `icon.xs` | 12pt | Inline within body text |
| `icon.sm` | 16pt | Tight UI, compact labels |
| `icon.md` | 20pt | Default — most UI contexts |
| `icon.lg` | 24pt | Standard interactive icon, navigation |
| `icon.xl` | 32pt | Section headers, feature callouts |
| `icon.2xl` | 48pt | Hero icons — large empty states |

---

## Active / Inactive State Pattern

Active state: the icon transitions from `regular` weight to `fill` weight.

The transition is a Reanimated opacity crossfade — the `regular` variant fades out while the `fill` variant fades in. The two icons are absolutely positioned on top of each other. The crossfade uses spring config `micro` (near-instant, crisp settle).

```tsx
import { House } from 'phosphor-react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { spring } from '@/design-system/motion'

type NavIconProps = {
  isActive: boolean
  size?: number
  color?: string
}

export function NavIcon({ isActive, size = 24, color }: NavIconProps) {
  const fillOpacity = useSharedValue(isActive ? 1 : 0)

  useIsomorphicLayoutEffect(() => {
    fillOpacity.value = withSpring(isActive ? 1 : 0, spring.micro)
  }, [isActive])

  const fillStyle = useAnimatedStyle(() => ({ opacity: fillOpacity.value }))
  const regularStyle = useAnimatedStyle(() => ({ opacity: 1 - fillOpacity.value }))

  return (
    <View className="relative" style={{ width: size, height: size }}>
      <Animated.View style={[{ position: 'absolute' }, regularStyle]}>
        <House size={size} weight="regular" color={color} />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, fillStyle]}>
        <House size={size} weight="fill" color={color} />
      </Animated.View>
    </View>
  )
}
```

---

## Icon Color

Icons always use semantic color tokens — never raw hex.

| Context | Token | Class |
|---|---|---|
| Default icon | `ink.secondary` | `text-ink-secondary` |
| Active icon | `accent.primary` | `text-accent-primary` |
| Danger icon | `accent.danger` | `text-accent-danger` |
| Caution icon | `accent.caution` | `text-accent-caution` |
| Inverse (on dark surface) | `ink.inverse` | `text-ink-inverse` |

The `color` prop on Phosphor icons accepts a hex string. Pass it from the semantic token constants in `src/design-system/colors.ts`.

---

## Tap Targets

All interactive icons must have a minimum tap target of 44pt × 44pt regardless of the icon's visual size. Pad with transparent area:

```tsx
<Pressable className="w-11 h-11 items-center justify-center" onPress={onPress}>
  <MagnifyingGlass size={20} weight="regular" color={colors.text.secondary} />
</Pressable>
```

---

## Rules

- Only `phosphor-react-native` — no mixing of icon libraries.
- `Duotone` weight is never used.
- `Fill` weight is only for active/selected state — never as a default appearance.
- Icon weight must match the visual weight of adjacent text. Mismatched weights break the typographic system.
- All interactive icons have a 44pt × 44pt minimum tap target.
- Icon color always comes from a semantic token in `src/design-system/colors.ts`. Never a raw hex value passed directly.
