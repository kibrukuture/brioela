# Design System — Overview

## What This Folder Covers
The complete visual and interaction language for Brioela. Typography, color, spacing, motion, generative UI rules, emotive design principles, and the component library. Every feature UI is built from this system — nothing is designed inline in a feature file.

## Status
[ ] not started — requires web research before writing

## Specs This Folder Draws From
- `brioela-specs/00-product-philosophy-and-ux.md` — ambient principle, two brain cell UX standard, voice/camera first, zero form policy
- `brioela-specs/39-generative-ui.md` — generative UI tech (react-native-gen-ui), component library, variant system, 400ms performance rule

## Key Decisions From Specs
- Generative UI: AI selects from a predefined component library — never writes JSX, always typed JSON props
- Generative layer never blocks — static content renders first, generative enhances within 400ms or degrades invisibly
- Allergen warnings, medical flags, navigation, settings: NEVER generative — always visually identical
- "Two brain cell" standard: no screen requiring more than 10 words to understand; no action requiring more than one tap to locate
- Voice first, camera second, text only when unavoidable. Zero forms ever.

## Research Needed Before Writing
- Font families available in React Native at art-studio quality level
- React Native Reanimated / Skia for motion — current API state
- Design token architecture for React Native (how tokens flow from system to components)
- Generative UI current state: react-native-gen-ui maturity and API

## What This Folder Depends On
Nothing. Built first.

## What Depends On This Folder
Every feature with a UI — all 20+ feature folders.
