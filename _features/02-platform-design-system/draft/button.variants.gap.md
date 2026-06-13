# Gap snapshot: design-system/variants/button.variants.ts

Target: `mobile/design-system/variants/button.variants.ts`

**Status:** Not in repo. Spec: `build-guide/01-design-system/10-cva-component-variants.md`. Package `class-variance-authority` is in `mobile/package.json` but **zero** `cva(` usages in `mobile/`.

```typescript
import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'flex-row items-center justify-center rounded-lg',
  {
    variants: {
      variant: {
        primary: 'bg-accent-primary',
        secondary: 'bg-surface-elevated border border-stroke-visible',
        ghost: 'bg-transparent',
        danger: 'bg-accent-danger',
      },
      size: {
        sm: 'px-3 py-2',
        md: 'px-4 py-3',
        lg: 'px-6 py-4',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)
```

**Companion (also missing):** `mobile/components/Button/Button.tsx` — Pressable + `buttonVariants` + `haptic.impact.medium()` per `09-mobile-patterns.md`.
