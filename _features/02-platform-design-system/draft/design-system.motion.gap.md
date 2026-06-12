# Gap snapshot: design-system/motion.ts

Target: `mobile/design-system/motion.ts`

**Status:** Not in repo. Spec: `build-guide/01-design-system/04-motion.md`.

```typescript
/** Named spring configs — every animation imports from here; no inline springs in feature code. */
export const spring = {
  landing: { stiffness: 200, damping: 0.82, mass: 1.0 },
  dismiss: { stiffness: 280, damping: 1.0, mass: 1.0 },
  light: { stiffness: 400, damping: 0.65, mass: 0.8 },
  micro: { stiffness: 600, damping: 0.90, mass: 1.0 },
  snap: { stiffness: 800, damping: 1.0, mass: 1.0 },
  slow: { stiffness: 120, damping: 0.88, mass: 1.2 },
} as const

export type SpringName = keyof typeof spring

/** Verdict bloom springs — paired with haptic.verdict.* */
export const verdictSpring = {
  safe: { stiffness: 180, damping: 0.85, mass: 1.0 },
  caution: { stiffness: 220, damping: 0.90, mass: 1.0 },
  danger: { stiffness: 600, damping: 1.0, mass: 1.0 },
} as const
```

**Production:** `react-native-reanimated` 4.4.0 installed; no centralized `spring` export. Feature code uses ad-hoc animation configs (e.g. `ZoomInRotate` in `theme-toggle.tsx`).
