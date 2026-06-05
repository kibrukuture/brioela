# Loading and Empty States

## Philosophy

No skeletons. No spinners except in one specific case. Both of these patterns communicate the wrong thing: skeletons say "content is broken into anonymous chunks" and spinners say "we have nothing to show you — please wait." Neither is true for an ambient intelligence.

The principle: the interface is always doing something, always alive, always partially complete. A loading state is not an absence — it is the app at an earlier stage of a continuous process.

---

## Loading Patterns

### Pattern 1 — Breath (primary loading state)

Used for: card content that is in-flight, any surface where data will arrive within 0–2 seconds.

The container that will hold content is fully rendered at its final size — correct dimensions, correct position, correct border radius. It breathes: a Reanimated SharedValue cycles the surface opacity between `0.85` and `1.0` on an 1800ms `withRepeat(withTiming())` loop.

What it does not do: it does not mimic the shape of content. It does not produce animated rectangles pretending to be text. It is just the container, alive and waiting.

```ts
const breathOpacity = useSharedValue(0.85)

useIsomorphicLayoutEffect(() => {
  breathOpacity.value = withRepeat(
    withSequence(
      withTiming(1.0, { duration: 900 }),
      withTiming(0.85, { duration: 900 })
    ),
    -1,  // infinite
    false
  )
}, [])

const breathStyle = useAnimatedStyle(() => ({
  opacity: breathOpacity.value,
}))
```

When data arrives: the breath animation is interrupted by the `landing` spring — the content animates in via `FadeInDown` layout animation, and the breath stops immediately.

### Pattern 2 — Presence (generative UI slots)

Used for: generative UI slots that will be populated by the AI decision (the 400ms window from `06-generative-ui.md`).

The slot renders nothing. No animation. No placeholder. The space is sized correctly (via a `minHeight` that matches the expected component height) and simply exists. The generative component slides in with the `landing` spring when the decision arrives. If 400ms passes with no decision, the static fallback renders — also with `landing` spring, no visual disruption.

The slot is not visually distinct from surrounding content. It is not marked, not outlined, not animated. The AI either populates it or it disappears into the static layout.

### Pattern 3 — Glass Sweep (list items pending)

Used for: list content where multiple items are loading simultaneously and Breath on each item would create noise.

A single Skia `SweepGradient` sweeps across the entire list surface — left to right — once, then stops. Like light catching a glass surface briefly. Not a shimmer on a loop. One sweep, then stillness.

Implementation: a Skia Canvas absolutely positioned over the list area, full-width, full-height. A `LinearGradient` with `colors: ['transparent', 'rgba(255,255,255,0.12)', 'transparent']` positioned off the left edge, animated to the right edge via a Reanimated SharedValue on `withTiming(600ms, Easing.out(Easing.cubic))`. Runs once on mount, then the canvas unmounts.

### The Spinner — one specific case only

A spinner exists for exactly one scenario: the user initiates an action with an explicit outcome they are waiting on, and there is no partial content to show in the meantime. The canonical example: an order is being placed and the user needs confirmation before proceeding.

Appearance: a Skia ring (not a Material-style arc, not an ActivityIndicator). The ring is a `Circle` stroke with a `SweepGradient` from the ring color to transparent. It rotates at constant speed via `withRepeat(withTiming(1500ms))`. Maximum size: 24pt. The ring is centered in the button or confirmation area that triggered the action — it replaces the button label while the action is in-flight, then the landing spring brings in the result.

This spinner is never used for background loading, data sync, or AI inference. Those use Breath or Presence.

---

## Empty States

Empty states are the app at its most expressive. This is the AI speaking before there is anything to show. The surface is not broken — it is ready.

### Structure

Three elements only, in order:

**1. Ambient field intensity** — when a screen has no content, the ambient background shader (Layer 1 from `05-skia-layers.md`) increases its amplitude. The space breathes more visibly. The screen feels alive and expectant rather than absent. Each screen that can be empty signals this to the root ambient canvas via a context value.

**2. One line of display text** — Cormorant Garamond, `text-display-sm` (40pt), centered, Regular weight, color `text-text-secondary`. The copy is defined per-feature in each feature's UI spec — not here. The design system only specifies the visual treatment. This is the rarest font in the system appearing at a moment that earns it.

**3. One action** — if there is something the user can do to populate the space. One button, `variant: ghost` or `variant: secondary` (never primary — the empty state is not urgent). No second action. No "or you could also..." option.

No illustrations. No characters. No icons accompanying the text. The Cormorant Garamond line and the ambient field are sufficient.

### What empty states never contain

- Illustrations or spot art
- More than one line of explanatory text (the Cormorant line stands alone)
- More than one action
- Skeleton placeholders suggesting content will arrive
- Progress indicators of any kind
- Decorative icons above the text

### Animation

When content arrives into a previously empty screen, the ambient field intensity drops back to normal (0.3s `withTiming`), the empty state elements fade out via `FadeOut` Reanimated layout animation, and the content enters via `FadeInDown` with `landing` spring. The transition takes ~400ms total and feels like the app coming to life.

---

## Rules

- Breath never runs on more than 3 simultaneous surfaces. If more than 3 containers are loading simultaneously, use Glass Sweep for the list and Breath for the primary card only.
- The spinner is only permitted in the exact case described above. No other use.
- Presence slots are invisible — they are never marked or animated. If you can see a Presence slot, something is wrong.
- Empty state text copy is defined in each feature's UI spec, not here. This file only defines the visual treatment.
- The ambient field intensity interface is exposed by the root ambient canvas and consumed by screens. Feature code calls `setAmbientIntensity(0.8)` on mount when empty, and `setAmbientIntensity(0.3)` when content arrives.
- Never use React Native's `ActivityIndicator`. The design system provides all loading patterns.
