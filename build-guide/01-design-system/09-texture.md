# Texture System

## What It Is

Texture is a Skia shader layer that adds micro-variation to flat surfaces — making them feel like a material rather than a screen. The effect is subliminal: users do not notice it consciously, but its absence makes the interface feel flat and digital. Its presence makes surfaces feel physical.

No PNG files. No image assets. The texture is generated in real-time by a Skia SkSL shader running on the GPU, rendered at native screen pixel density, infinitely sharp on any display.

---

## How It Works

The texture shader runs as a second pass on the ambient background canvas (Layer 1 from `05-skia-layers.md`). It uses a high-spatial-frequency hash function to generate per-pixel micro-variation.

The key distinction from the ambient field shader: the ambient field uses **low frequency** (slow, large-scale drift) to make the background feel alive. The texture layer uses **high frequency** (fine grain, static) to make surfaces feel material.

**SkSL source — `src/design-system/shaders/texture.glsl.ts`:**

```glsl
uniform vec2 resolution;
uniform float seed;        // changes on app launch, stays fixed for session
uniform float amplitude;   // light mode: 0.012 / dark mode: 0.018
uniform vec3 baseColor;    // the surface color in linear RGB

vec4 main(vec2 fragCoord) {
  vec2 uv = fragCoord / resolution;

  // High-frequency hash — generates grain pattern
  float n1 = fract(sin(dot(uv * 800.0 + seed, vec2(127.1, 311.7))) * 43758.5453);
  float n2 = fract(sin(dot(uv * 600.0 + seed * 1.3, vec2(269.5, 183.3))) * 12345.6789);
  float grain = (n1 + n2) * 0.5;

  // Apply grain as signed deviation from base color
  vec3 color = baseColor + (grain - 0.5) * amplitude;
  return vec4(clamp(color, 0.0, 1.0), 1.0);
}
```

The `seed` is a random float generated once at app startup and stored in memory. It gives each session a unique grain pattern — like a fresh sheet of paper — while keeping the grain completely static during a session (no animation cost).

---

## Amplitude Values

| Mode | Amplitude | Effect |
|---|---|---|
| Light mode | `0.012` | Barely perceptible warm paper grain on cream background |
| Dark mode | `0.018` | Slightly more visible on dark surfaces — needed for the same perceptual impact |

Do not increase these values. The grain is not meant to be noticed. If you can notice it immediately, it is too strong.

---

## Where It Applies

**Background surface only.** The texture shader runs once on the root ambient canvas that sits behind all screen content. It does not run per-component, per-card, or per-screen. It is one global layer.

Glass card surfaces (BackdropBlur + translucent overlay) inherit visual texture from the background bleeding through the blur — the texture appears in the glass naturally without being separately applied to each card.

---

## Performance

- The shader runs on the GPU — zero JS thread involvement.
- The grain is static (no per-frame `seed` update) — the GPU renders it once and caches the output.
- Total GPU cost: negligible. High-frequency hash functions are trivial for a modern mobile GPU.
- The same Skia `Canvas` that renders the ambient field (Layer 1) renders this texture as a second `RuntimeEffect` pass — no additional canvas, no additional render surface.

---

## Light vs Dark Mode Behavior

In **light mode**: the base color is `#F8F6F2` (warm cream) in linear RGB `vec3(0.973, 0.965, 0.949)`. The grain adds micro warm/cool variation over this, making the background feel like textured cream paper.

In **dark mode**: the base color is `#0E0C10` in linear RGB `vec3(0.055, 0.047, 0.063)`. The higher amplitude compensates for the lower luminance — you need more grain deviation for it to be perceptible on a dark surface.

The shader receives the correct `baseColor` and `amplitude` uniforms based on the current color scheme. These are fed in at mount and updated when the color scheme changes — driven by a Reanimated SharedValue that reads `useColorScheme()`.

---

## Rules

- No image files (PNG, JPG, WebP) for texture. Skia shader only.
- The texture layer is rendered at the root level — never inside a feature component.
- `amplitude` values are constants defined in this file. Never adjust them per-feature or per-screen.
- The `seed` is generated once on app launch (`Math.random()` outside the Skia shader, passed in as a uniform). Store it in module scope, not in component state.
- Never animate the grain. Static grain = paper. Animated grain = television noise. Wrong.
