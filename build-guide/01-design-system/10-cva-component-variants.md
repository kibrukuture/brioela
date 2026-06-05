# Component Variants — CVA

## What It Is

Class Variance Authority (CVA) is the pattern for building NativeWind components with type-safe variants. Without it, components accumulate conditional class string logic that becomes unreadable and error-prone. With it, every component's full variant API is declared once, TypeScript infers all valid prop combinations, and impossible states are compile-time errors.

Every design system component in Brioela is built with CVA. No exceptions.

---

## Installation

```bash
bun add class-variance-authority
```

---

## Basic Pattern

```ts
import { cva, type VariantProps } from 'class-variance-authority'
import { Pressable, Text } from 'react-native'

const buttonVariants = cva(
  // Base classes — always applied
  'flex-row items-center justify-center rounded-lg',
  {
    variants: {
      variant: {
        primary:   'bg-accent-primary',
        secondary: 'bg-surface-elevated border border-border-visible',
        ghost:     'bg-transparent',
        danger:    'bg-accent-danger',
      },
      size: {
        sm:  'px-3 py-2',
        md:  'px-4 py-3',
        lg:  'px-6 py-4',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size:    'md',
    },
  }
)

type ButtonProps = VariantProps<typeof buttonVariants> & {
  label: string
  onPress: () => void
  disabled?: boolean
}

export function Button({ variant, size, label, onPress, disabled }: ButtonProps) {
  return (
    <Pressable
      className={buttonVariants({ variant, size })}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text className="font-jakarta text-label-lg font-semibold text-text-inverse">
        {label}
      </Text>
    </Pressable>
  )
}
```

---

## Compound Variants

Compound variants apply additional classes only when multiple conditions match simultaneously.

```ts
const cardVariants = cva(
  'rounded-xl border overflow-hidden',
  {
    variants: {
      surface: {
        glass:    'bg-surface-glass border-surface-glass-border',
        elevated: 'bg-surface-elevated border-border-subtle',
        recessed: 'bg-surface-recessed border-border-subtle',
      },
      verdict: {
        none:    '',
        safe:    '',
        caution: '',
        danger:  '',
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    compoundVariants: [
      // Border color shifts when verdict is active
      { verdict: 'safe',    class: 'border-accent-primary' },
      { verdict: 'caution', class: 'border-accent-caution' },
      { verdict: 'danger',  class: 'border-accent-danger'  },
    ],
    defaultVariants: {
      surface: 'glass',
      verdict: 'none',
      size:    'md',
    },
  }
)
```

---

## The `cn` Utility

For merging CVA output with additional one-off classes, use `cn` — a `clsx` + `tailwind-merge` combination that handles Tailwind class conflicts correctly:

```ts
// src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

```bash
bun add clsx tailwind-merge
```

Usage:

```tsx
<View className={cn(cardVariants({ surface: 'glass', size: 'lg' }), 'mt-4')} />
```

---

## Dark Mode in CVA

Dark mode variants are expressed inline with `dark:` prefix in the class string. CVA passes them through unchanged — NativeWind handles the dark mode switching.

```ts
const tagVariants = cva('rounded-full px-2 py-1', {
  variants: {
    type: {
      safe:    'bg-greenFieldSub dark:bg-greenDarkSub text-accent-primary dark:text-accent-primary',
      caution: 'bg-amberFieldSub dark:bg-amberDarkSub text-accent-caution dark:text-accent-caution',
      danger:  'bg-redFieldSub  dark:bg-redDarkSub  text-accent-danger  dark:text-accent-danger',
    }
  }
})
```

---

## Animated Components

For components that need both CVA class variants AND Reanimated animations, separate the two concerns:

```tsx
import Animated from 'react-native-reanimated'

// CVA handles static class selection
const classes = cardVariants({ surface: 'glass', verdict: 'safe' })

// Reanimated handles the dynamic animation
<Animated.View
  className={classes}
  style={animatedStyle}   // spring transform/opacity from useAnimatedStyle
/>
```

Never put animated values inside CVA variants. CVA is for static class logic. Reanimated is for dynamic values. They are separate.

---

## File Structure

All design system component variants live in `src/design-system/variants/`:

```
src/design-system/variants/
  button.ts
  card.ts
  tag.ts
  input.ts
  badge.ts
  icon-button.ts
  ...
```

Feature components that need custom variants define them locally in their own file — they do not belong in the design system unless they are genuinely reused across multiple features.

---

## Rules

- Every design system component uses CVA. No conditional className string building.
- `VariantProps<typeof xVariants>` is always used to type the component props — never manually type the variant strings.
- `defaultVariants` must always be specified. No component renders ambiguously when no variant is passed.
- Never put layout-specific classes (`mt-4`, `w-full`, `flex-1`) in a CVA variant definition — those belong at the call site. CVA variants describe the component's intrinsic appearance, not its placement.
- `cn()` is the only way to merge CVA output with additional classes.
