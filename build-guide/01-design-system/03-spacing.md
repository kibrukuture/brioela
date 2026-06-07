# Spacing System

## Base Grid

All spacing in Brioela is on a **4pt base grid**. Every margin, padding, gap, and size value is a multiple of 4. No exceptions. No arbitrary values. If a value is not in the scale below, it does not exist.

This grid applies to: padding, margin, gap, width, height (when fixed), border radius, icon sizes, and safe area insets.

---

## Spacing Scale

| Token | Value | Usage pattern |
|---|---|---|
| `space.1` | 4pt | Micro gap — icon-to-label, tight chip padding |
| `space.2` | 8pt | Small internal padding — tag padding, icon margin |
| `space.3` | 12pt | Default compact padding — list item padding vertical |
| `space.4` | 16pt | Base unit — standard padding, default gap |
| `space.5` | 20pt | Slightly generous — button vertical padding |
| `space.6` | 24pt | Section internal padding, card padding |
| `space.8` | 32pt | Section gap, between card groups |
| `space.10` | 40pt | Large section gap |
| `space.12` | 48pt | Screen-level padding top/bottom |
| `space.16` | 64pt | Large vertical rhythm gap |
| `space.20` | 80pt | Hero spacing — between major screen sections |
| `space.24` | 96pt | Maximum spacing — header to first content block |

No values between the above. If the design needs "a bit more than 24" the answer is `space.8` (32pt).

---

## Brioela Generative UI Spacing Tokens

There are two spacing layers:

- **Design-system implementation scale** — numeric 4pt tokens like `space.1`, `space.4`, `space.12`, mapped to NativeWind classes.
- **Brioela Generative UI grammar scale** — ordinal tokens like `space_xs`, `space_sm`, `space_md`, emitted by AI inside `BrioelaGenerativeUiDocument`.

The AI must never emit numeric spacing tokens, Tailwind classes, or metaphor names.

Allowed in Brioela Generative UI documents:

```typescript
type BrioelaGenerativeUiSpacingToken =
  | "space_xs"
  | "space_sm"
  | "space_md"
  | "space_lg"
  | "space_xl"
  | "space_2xl"
```

Forbidden in Brioela Generative UI documents:

```text
space.1
space.4
p-4
gap-6
intimate
breath
cathedral
```

Renderer mapping:

| Brioela Generative UI token | Design-system token | Value | Typical use |
|---|---|---|---|
| `space_xs` | `space.2` | 8pt | tight inline gap |
| `space_sm` | `space.3` | 12pt | compact grouping |
| `space_md` | `space.4` | 16pt | default internal spacing |
| `space_lg` | `space.6` | 24pt | generous section spacing |
| `space_xl` | `space.8` | 32pt | major section spacing |
| `space_2xl` | `space.12` | 48pt | editorial negative space |

Rule:

```text
AI emits ordinal spacing tokens. Renderer maps them to numeric design-system tokens.
```

This keeps AI vocabulary simple and consistent while preserving the 4pt implementation grid.

---

## Safe Areas

Safe area insets are handled via `react-native-safe-area-context`. The `SafeAreaView` or `useSafeAreaInsets()` hook is used on every screen root. Screen content padding is never hardcoded for a specific device — always derived from safe area insets plus a spacing token.

Pattern:
```ts
const insets = useSafeAreaInsets()
// top padding = safe area top + space.4 (16pt)
// bottom padding = safe area bottom + space.6 (24pt)
```

---

## Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `radius.sm` | 8pt | Small UI elements — tags, chips, small buttons |
| `radius.md` | 12pt | Standard cards, inputs |
| `radius.lg` | 16pt | Large cards, modals, bottom sheets |
| `radius.xl` | 24pt | Full-feature cards, hero containers |
| `radius.2xl` | 32pt | Large modal surfaces |
| `radius.full` | 9999pt | Pill shapes — fully rounded buttons, avatar rings |

---

## Icon Sizes

| Token | Value | Usage |
|---|---|---|
| `icon.xs` | 12pt | Inline icon within text |
| `icon.sm` | 16pt | Compact UI — tab bar if needed, tight labels |
| `icon.md` | 20pt | Default icon size in most UI contexts |
| `icon.lg` | 24pt | Standard interactive icon — tap targets |
| `icon.xl` | 32pt | Large icons — section headers, feature icons |
| `icon.2xl` | 48pt | Hero icons — empty states, onboarding |

Minimum tap target: 44pt × 44pt (Apple HIG minimum). Icons smaller than 44pt must have a transparent tap target area padded to 44pt.

---

## Layout Constants

| Token | Value | Usage |
|---|---|---|
| `layout.screenPaddingH` | 20pt | Horizontal screen-edge padding |
| `layout.cardPaddingH` | 16pt | Horizontal padding inside cards |
| `layout.cardPaddingV` | 16pt | Vertical padding inside cards |
| `layout.sectionGap` | 32pt | Vertical gap between major screen sections |
| `layout.itemGap` | 12pt | Vertical gap within a list or group |
| `layout.tabBarHeight` | 56pt | Tab bar total height (excluding safe area) |
| `layout.headerHeight` | 44pt | Navigation header height (excluding safe area) |

---

## NativeWind Usage

Brioela uses NativeWind (Tailwind CSS for React Native). There are no `StyleSheet.create` calls anywhere in the codebase. All spacing is expressed as Tailwind class names.

The spacing scale maps to Tailwind's default scale via the `tailwind.config.ts` `theme.extend.spacing` block. Every token above has a corresponding Tailwind class:

| Token | Value | Tailwind class |
|---|---|---|
| `space.1` | 4pt | `p-1`, `m-1`, `gap-1` |
| `space.2` | 8pt | `p-2`, `m-2`, `gap-2` |
| `space.3` | 12pt | `p-3`, `m-3`, `gap-3` |
| `space.4` | 16pt | `p-4`, `m-4`, `gap-4` |
| `space.5` | 20pt | `p-5`, `m-5`, `gap-5` |
| `space.6` | 24pt | `p-6`, `m-6`, `gap-6` |
| `space.8` | 32pt | `p-8`, `m-8`, `gap-8` |
| `space.10` | 40pt | `p-10`, `m-10`, `gap-10` |
| `space.12` | 48pt | `p-12`, `m-12`, `gap-12` |
| `space.16` | 64pt | `p-16`, `m-16`, `gap-16` |
| `space.20` | 80pt | `p-20`, `m-20`, `gap-20` |
| `space.24` | 96pt | `p-24`, `m-24`, `gap-24` |

Border radius maps via `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full` — all extended in `tailwind.config.ts` to match the token values above.

## Rules

- No `StyleSheet` anywhere in the codebase. NativeWind className strings only.
- No arbitrary Tailwind values (`p-[17px]`, `m-[13]`) — if the value is not in the scale above, use the next token up.
- Brioela Generative UI documents use only `space_xs` through `space_2xl`; they never emit numeric design tokens or Tailwind classes.
- When implementing a screen, start from the grid: outer padding → section gaps → item gaps → internal padding. Never guess a pixel value.
- If an exact value is needed for a Skia canvas dimension or gesture threshold, it goes in a named constant in the relevant file with a comment explaining why. These are the only permitted exceptions.
