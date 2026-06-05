# Motion System

## Philosophy

Everything in Brioela has mass. Nothing slides linearly. Nothing fades on a flat duration curve. All motion is physics-based: spring constants, damping ratios, and mass define how elements move — not millisecond durations.

The exception is ambient/organic animation (breathing backgrounds, pulsing signals). These use time-based cycles driven by Skia shader uniforms rather than springs, because they are not in response to user input — they are environmental.

**The primary rule:** motion must communicate state, not decorate. An element moves because something changed. If nothing changed, nothing moves.

---

## Stack Decision — Which Tool for What

### React Native Reanimated 3
**Use for:** all interactive animations — elements entering, exiting, transitioning in response to user action or AI verdict. Layout animations. Shared element transitions. Driving Skia shader uniforms via SharedValue.

Everything Reanimated does runs on the UI thread via worklets. There is no bridge round-trip. 60fps is the floor, 120fps on ProMotion displays.

### Moti
**Use for:** simple declarative spring animations where the Reanimated worklet API is more ceremony than needed. Moti wraps Reanimated with a Framer Motion-inspired declarative API (`from`, `animate`, `exit`). Good for: element mounting/unmounting with spring, state-driven style transitions on a single element.

Do not use Moti for: anything requiring direct SharedValue control, anything driving Skia uniforms, gesture-driven animations. Use Reanimated directly for those.

**Note:** Framer Motion is a web-only library. It is not usable in React Native. Moti is the correct library for React Native. They are completely separate.

### React Native Skia (Reanimated + Skia)
**Use for:** GPU-rendered animations — ambient background shaders, glow effects, particle systems, holographic surfaces, Liquid Glass blur, scan ring effects, map dot pulses. Reanimated SharedValues feed directly into Skia component props as animated values — no `createAnimatedComponent` wrapper needed.

Details of what Skia renders and how are in `05-skia-layers.md`.

---

## Spring Configuration Library

Named spring configs in `src/design-system/motion.ts`. Every animation uses one of these. No inline spring configs in feature code.

### Landing

Heavy elements entering the screen — cards, modals, bottom sheets.

```ts
export const spring = {
  landing: {
    stiffness: 200,
    damping: 0.82,
    mass: 1.0,
  },
```

Character: settles with one very small overshoot, then rests. Like a card placed on a table by a careful hand.

### Dismiss

Elements leaving the screen.

```ts
  dismiss: {
    stiffness: 280,
    damping: 1.0,
    mass: 1.0,
  },
```

Character: no bounce on exit. Clean, immediate departure. Overdamped.

### Light

Small elements entering — tags, chips, inline indicators, floating hints.

```ts
  light: {
    stiffness: 400,
    damping: 0.65,
    mass: 0.8,
  },
```

Character: bouncy but controlled. Energetic without being cartoonish.

### Micro

Immediate feedback — button presses, toggle states, selection confirmation.

```ts
  micro: {
    stiffness: 600,
    damping: 0.90,
    mass: 1.0,
  },
```

Character: almost instant with a crisp, subtle settle.

### Snap

Hard, no-bounce responses — danger verdicts, hard blocks, critical state changes that must not animate playfully.

```ts
  snap: {
    stiffness: 800,
    damping: 1.0,
    mass: 1.0,
  },
```

Character: overdamped, zero bounce, maximum urgency.

### Slow

Deliberate, weighty transitions — full-screen state changes, mode switches.

```ts
  slow: {
    stiffness: 120,
    damping: 0.88,
    mass: 1.2,
  },
```

Character: unhurried, confident. Used sparingly — only when the UI is communicating a significant state shift.

```ts
}
```

---

## Layout Animations (Reanimated)

When elements enter/exit from a list or stack, use Reanimated's `Layout` animations:

- **Entering:** `FadeInDown.springify().stiffness(200).damping(0.82)` — matches the `landing` spring
- **Exiting:** `FadeOut.duration(180)` — exits don't need spring, they just go
- **Layout shift:** `Layout.springify().stiffness(280).damping(0.85)` — when sibling elements reflow

Apply these via the `entering`, `exiting`, and `layout` props on `Animated.View` (Reanimated's wrapper).

---

## Shared Element Transitions

Used when the same element (e.g., a scan result card, a photo) needs to animate from one screen position to another during navigation. Implemented via Reanimated's `SharedTransition` API:

```ts
// On source screen
<Animated.View sharedTransitionTag="scan-card" />

// On destination screen
<Animated.View sharedTransitionTag="scan-card" />
```

The transition uses the `landing` spring config by default. Override per use case if needed.

Shared element transitions are only used when there is a clear spatial relationship between origin and destination. Do not use them decoratively.

---

## Accessibility

Before any animated value fires, check:

```ts
import { AccessibilityInfo } from 'react-native'
const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled()
```

When `reduceMotion` is true:
- Replace all spring animations with instant state changes (duration 0)
- Ambient Skia shader animations pause or run at 10% of their normal speed
- Layout animations are disabled

The `useReduceMotion()` hook from Reanimated 3 handles this automatically when used — prefer it over manual `AccessibilityInfo` calls.

---

## Rules

- No `Animated` from React Native core — use `react-native-reanimated` only.
- No `useEffect` or `useLayoutEffect` for animation triggers. Use `useIsomorphicLayoutEffect` from `usehooks-ts` when a layout-phase side effect is needed.
- No `setTimeout` delays before animation start. Use `withDelay` in Reanimated's worklet API if a delay is needed.
- No `duration`-based animations for UI interactions — only springs.
- Time-based `withTiming` is permitted only for: (a) exit animations where spring bounce is wrong, (b) Skia shader uniform cycling (ambient/organic animations), (c) opacity fades where spring makes no physical sense.
- Never animate non-animated values. If a value needs to animate, it is a `useSharedValue`. If it is a React state, it is not an animation.
- All animation code goes in the component or hook where it is used. No centralized animation manager.
