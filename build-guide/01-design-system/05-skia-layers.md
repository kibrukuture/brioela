# Skia Layers

## Overview

React Native Skia (`@shopify/react-native-skia`) is the GPU rendering layer. It handles everything that standard React Native views cannot: real-time shaders, custom gradients, particle systems, glow effects, blur-based glass surfaces, and holographic effects. It runs entirely on the GPU — no JS thread involvement during rendering.

Skia is not used for every animation. It is used specifically where GPU rendering is required:
- Effects that require custom shader logic (noise, distortion, iridescence)
- Blur-based transparency (Liquid Glass surfaces)
- Radial/sweep gradient rings and glow
- Ambient background fields that breathe
- Map overlay dots with glow and pulse

Everything else — layout animation, spring transitions, element enter/exit — is Reanimated.

---

## Skia + Reanimated Integration

Reanimated SharedValues feed directly into Skia component props as animated values. No wrapper needed:

```ts
import { useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia'

const pulse = useSharedValue(1.0)
// drive the circle's radius directly
<Circle cx={cx} cy={cy} r={pulse} />
```

This is the core integration pattern. The SharedValue updates on the UI thread; Skia reads it directly on the GPU thread. Zero bridge crossing.

---

## Layer 1 — Ambient Background Field

**What it is:** A Skia canvas positioned behind all screen content. At rest, it renders a FractalNoise-based gradient that gives the dark background a subtle sense of depth and life. It is nearly invisible — the effect is felt, not noticed.

**Implementation:** Skia `RuntimeEffect` with a custom SkSL shader. The shader uses `fractalNoise()` (equivalent of Perlin noise in SkSL) to generate organic, slowly-shifting color variation across the background surface.

**Animation:** A Reanimated `useSharedValue` cycles from `0.0` to `1.0` on a `withRepeat(withTiming(8000))` — an 8-second cycle. This uniform drives the noise offset, causing the field to slowly drift. At idle: very low amplitude, very slow. On state changes: amplitude increases briefly (driven by a second SharedValue), then returns to idle.

**Performance:** The shader runs entirely on the GPU. The Reanimated clock drives only one float uniform per frame. Zero JS involvement during rendering.

**SkSL pattern:**
```glsl
uniform float time;
uniform float amplitude;
uniform vec3 baseColor;   // light: vec3(0.973, 0.965, 0.949) / dark: vec3(0.055, 0.047, 0.063)

vec4 main(vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution;
  float noise = fract(sin(dot(uv + time * 0.03, vec2(12.9898, 78.233))) * 43758.5453);
  float field = mix(0.0, amplitude, noise);
  return vec4(baseColor + field * 0.03, 1.0);
}
```

The `baseColor` uniform adapts to light/dark mode — in light mode it is the warm cream base, in dark mode the near-black base. The ambient field overlays the same slight variation over both.

---

## Layer 2 — Glow Ring

**What it is:** A circular scanning ring rendered on a Skia canvas. The ring is a `RoundedRect` or `Circle` stroke filled with a `SweepGradient`. The gradient rotates and the ring closes or opens in response to state.

**Animation states:**
- Idle / searching: ring stroke at partial arc, SweepGradient rotating via `startAngle` SharedValue on `withRepeat(withTiming(1200))`
- Lock acquired: ring closes to full 360° via spring animation on `endAngle` SharedValue (spring config: `micro`)
- Post-lock pulse: radial glow expands from ring center via radius SharedValue (spring config: `snap`, then fade via `withTiming(200)`)
- Dismiss: ring scale and opacity animate out via spring `dismiss`

**Glow effect:** Implemented via Skia `Paint` with `BlurMaskFilter` and a `RadialGradient` fill on a slightly larger, fully-transparent outer circle. The outer gradient blooms from the ring's color to transparent.

**Layer positioning:** The ring canvas is absolutely positioned over the camera view. It does not interfere with hit testing below it (Skia canvases are non-interactive by default).

---

## Layer 3 — Liquid Glass Card Surface

**What it is:** Every card, bottom sheet, and modal uses a Liquid Glass surface. This is a translucent blur that shows what is behind it, tinted with a warm near-transparent overlay.

**Implementation:** Skia `BackdropFilter` with `Blur` filter applied to the card background:

```ts
import { BackdropFilter, Blur, RoundedRect } from '@shopify/react-native-skia'

// Light mode: white glass on cream — rgba(255,255,255,0.72)
// Dark mode:  white glass on near-black — rgba(255,255,255,0.06)
// The color value is passed in via a prop driven by useColorScheme()

<BackdropFilter filter={<Blur sigmaX={20} sigmaY={20} />}>
  <RoundedRect r={16} color={glassSurfaceColor} />
</BackdropFilter>
```

Border: 1px `RoundedRect` with `style="stroke"`. Light mode border: `rgba(0,0,0,0.06)`. Dark mode border: `rgba(255,255,255,0.10)`.

**Bloom integration:** The Verdict Field color system (see `02-color-system.md`) blooms *behind* the BackdropFilter. The blur samples the tinted background — the color comes through the glass. The card does not change color directly; the environment behind it does.

**Appearance animation:** When a glass card appears, the BackdropFilter `sigmaX`/`sigmaY` uniforms animate from `0` to `20` via spring (`landing`). The card arrives as transparent and sharpens into glass. Combined with the card's Y-position spring animation (landing from below), this produces the Liquid Glass emergence effect.

---

## Layer 4 — Map Signal Dots

**What it is:** An overlay Skia canvas on top of the Mapbox map view. Renders colored dots at geo-coordinate positions corresponding to Ground finds, healthy food places, and product sightings. Each dot is a radial gradient circle with an outer glow.

**Dot anatomy:** Inner fill (solid color), outer `RadialGradient` from the solid color to transparent (the glow). The outer gradient radius is larger than the inner fill radius.

**Pulse animation:** Each dot has a `useSharedValue(1.0)` for its scale. The pulse runs on `withRepeat(withSequence(withTiming(1.4, { duration: 1000 }), withTiming(1.0, { duration: 800 })))`. Signal freshness (time since last confirmed find) controls the pulse speed and amplitude. Fresh = faster and larger pulse. Old = barely moves.

**Performance:** All dots on the canvas share one Skia `Canvas` and one `Paint`. Skia renders them in a single GPU draw call. Efficient for up to ~200 visible dots simultaneously.

---

## Layer 5 — Holographic Surface

**What it is:** A premium shader applied to specific high-significance surfaces — not general UI. Creates an iridescent, rainbow-shifting shimmer that responds to device orientation (accelerometer input).

**Trigger condition:** Applied only to surfaces that mark a genuine milestone. Definition of which surfaces is in each feature's UI spec. Not applied to general cards, scan results, or ambient content.

**Implementation:** Skia SkSL runtime effect using an iridescence technique:

```glsl
uniform vec2 resolution;
uniform float tiltX;  // device accelerometer X
uniform float tiltY;  // device accelerometer Y

vec4 main(vec2 fragCoord) {
  vec2 uv = fragCoord / resolution;
  float hue = uv.x + uv.y * 0.5 + tiltX * 0.3 + tiltY * 0.2;
  // HSV to RGB conversion for rainbow gradient
  vec3 color = 0.5 + 0.5 * cos(6.28318 * (hue + vec3(0.0, 0.333, 0.667)));
  return vec4(color * 0.15, 0.15);  // low opacity overlay
}
```

`tiltX` and `tiltY` are sourced from the device accelerometer and fed into Skia uniforms via Reanimated SharedValues updated from the sensor stream. The shimmer shifts as the device tilts.

**Layering:** Rendered as an overlay on top of the card surface at low opacity (0.10–0.20). It does not obscure content — it is an ambient glow on the surface.

---

## SkSL Notes

SkSL (Skia Shading Language) is similar to GLSL with minor differences:
- Fragment position is `vec2 fragCoord` (passed to `main`)
- Canvas resolution available via uniform or constant
- `Skia.RuntimeEffect.Make(skslSource)` compiles the shader
- `useValue` from `@shopify/react-native-skia` or Reanimated SharedValues feed uniforms
- Shaders are compiled once on mount — no per-frame JS involvement

All custom SkSL shader source strings live in `src/design-system/shaders/` as `.glsl.ts` files (template literal strings exported as constants). Never inline a shader in a component.

---

## Rules

- Skia canvases are absolutely positioned and do not participate in React Native layout. Size them explicitly.
- Never put interactive elements (buttons, touchables) inside a Skia canvas. Interactive elements go in the React Native view layer above or below.
- All SharedValues that drive Skia uniforms are created in the component that owns the canvas — not passed as props from parents. This keeps the GPU update path as short as possible.
- Shader source strings are constants in `src/design-system/shaders/`. Components import the constant — they do not define shaders inline.
- The ambient background canvas (Layer 1) is rendered once at the root level via the navigation container wrapper. It is not re-mounted per screen.
- `@shopify/react-native-skia` is a peer dependency of `react-native-reanimated`. Both must be present. Do not add one without the other.
