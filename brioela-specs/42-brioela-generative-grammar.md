# 42. Brioela Generative Grammar

## Goal

Make Brioela's interface feel alive without letting AI write runtime JSX. Brioela Generative Grammar is a typed UI language: the AI composes approved primitives, emotional tokens, motion, haptics, and Skia treatments into safe native UI documents.

## Why This Exists

A fixed component registry is safe but can become stiff. Runtime JSX is creative but unsafe, especially on React Native. MDX is not the answer for core app UI because it still needs compilation and mixes content with executable component logic.

Brioela needs the middle path: like letters in an alphabet, a small set of expressive primitives can combine into millions of moments. The AI gets creative with composition, rhythm, emphasis, metaphor, and emotional register. The app remains safe because every primitive is typed, compiled, validated, and controlled by the design system.

## Core Rule

The AI does not generate code.

The AI generates a `GenerativeUIDocument`.

The client renders that document using compiled React Native components.

## Architecture

Layers:

1. **Static Safety Layer** — hard-coded UI for allergy, medical, recall, payment, consent, destructive actions.
2. **Registered Component Layer** — named components for known surfaces.
3. **Generative Grammar Layer** — composable typed UI nodes that create expressive layouts.
4. **Artifact Layer** — server-rendered/static share assets like Discovery Cards.
5. **Build-Time Creation Lane** — AI can propose real `.tsx` components for developer review, but never at runtime.

## Generative UI Document

```typescript
type GenerativeUIDocument = {
  grammarVersion: string
  surface: GenerativeSurface
  safetyLock: boolean
  mood: UIMood
  layout: UILayoutNode
  motion: MotionToken | null
  haptics: HapticToken | null
  skia: SkiaTreatment | null
  expiresAt: number | null
}
```

## Primitive Families

Primitive families include:

- surfaces
- composition/layout
- meaning/emphasis
- food data visuals
- Mesa compatibility
- recipe/cooking steps
- memory/time moments
- Discovery Cards
- emotional atmosphere
- motion/haptics
- Skia field effects

These are not huge full components. They are expressive atoms and molecules.

## What Is Never Generative

Never generative:

- hard allergy warnings
- medical condition hard flags
- recall alerts
- payment and subscription actions
- consent grants
- account/security settings
- destructive deletes
- practitioner/client permission screens
- child safety override blocks

## Platform Strategy

React Native and PWA use the same grammar payload.

React Native renders grammar with compiled native components.

PWA can optionally use web generative UI tools, but the source of truth stays the grammar document, not arbitrary streamed JSX.

## Performance Rule

Static UI renders first. Grammar enhancement has 400ms to arrive and validate. If it misses, the static UI stays. No spinner.

## Success Metric

The UI should feel alive, not random. Users should feel that Brioela understood the emotional weight of the moment while still trusting the app's safety surfaces.
