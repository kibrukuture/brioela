# Design System — Overview

## What This Folder Covers
The complete visual and interaction language for Brioela. Typography, color, spacing, motion, generative UI rules, emotive design principles. Every feature UI is built from this system — nothing is designed inline in a feature file.

## Status
[x] complete — all seven system files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-typography.md` | Three font families, type scale, weight tables, letter spacing rules, OTF loading via expo-font config plugin |
| `02-color-system.md` | Three-level token architecture, primitive palette, all semantic tokens, Verdict Field dynamic color bloom system |
| `03-spacing.md` | 4pt base grid, full spacing scale, border radius scale, icon sizes, layout constants |
| `04-motion.md` | Stack decision (Reanimated vs Moti vs Skia), six named spring configs, layout animations, shared element transitions, reduceMotion accessibility |
| `05-skia-layers.md` | Five named Skia layers, SkSL shader patterns, Reanimated+Skia integration pattern |
| `06-generative-ui.md` | Decision object type, component registry pattern, Zod prop validation, 400ms progressive render rule, what is never generative |
| `07-design-philosophy.md` | Ambient intelligence principle, two brain cell standard, zero form policy, depth/glass grammar, restraint as a design value |

## Specs This Folder Draws From
- `brioela-specs/00-product-philosophy-and-ux.md` — ambient principle, two brain cell UX standard, voice/camera first, zero form policy
- `brioela-specs/39-generative-ui.md` — generative UI pattern: AI selects from component registry, typed JSON props, 400ms performance rule, what is never generative

## Key Decisions From Specs
- Generative UI: AI selects from a predefined component registry — never writes JSX, always typed JSON props
- Generative layer never blocks — static content renders first, generative enhances within 400ms or degrades invisibly
- Generative UI implementation approach (library vs custom build) is not yet determined — see `06-generative-ui.md`
- Allergen warnings, medical flags, navigation, settings: NEVER generative — always visually identical
- "Two brain cell" standard: no screen requiring more than 10 words to understand; no action requiring more than one tap to locate
- Voice first, camera second, text only when unavoidable. Zero forms ever.

## What This Folder Depends On
Nothing. Built first.

## What Depends On This Folder
Every feature with a UI — all 20+ feature folders.
