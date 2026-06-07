# Brioela Generative Grammar — Runtime Boundary

## What This File Covers

Why Brioela does not generate JSX, TSX, or MDX at runtime, and what safe runtime generation means on React Native and PWA.

---

## Core Rule

The AI never writes runtime UI code.

Blocked at runtime:

- JSX
- TSX
- JavaScript functions
- MDX with JSX
- remote imports
- inline style logic outside approved tokens
- arbitrary component names

Allowed at runtime:

- typed JSON grammar
- approved node types
- approved tokens
- Zod-validated props
- renderer-selected compiled components

---

## Why Not Runtime JSX

React Native JSX is compiled by Metro/Babel into the app bundle. Runtime-generated `.jsx` or `.tsx` would require unsafe code evaluation, remote compilation, or over-the-air code shipping.

Problems:

- security risk
- App Store / Play Store risk
- impossible accessibility guarantees
- fragile performance
- impossible safety validation
- incompatible native runtime assumptions
- no reliable offline fallback

---

## Why Not MDX

MDX is content with JSX. It is useful for docs, long-form content, or controlled editorial surfaces.

It is not appropriate for Brioela's core app UI because:

- JSX still needs compilation
- runtime MDX can execute component logic
- safety surfaces need visual consistency
- MDX is not a structured UI protocol
- mobile performance and validation are weaker

MDX can be considered later for verified profile articles or creator educational content, not for scan verdicts, Mesa, safety, or cooking UI.

---

## Expo Update Boundary

EAS Update can ship JavaScript, styling, and assets to compatible app runtime versions. It is a deployment mechanism, not a per-user UI generation mechanism.

Use EAS Update for:

- new approved primitives
- new templates
- bug fixes
- copy/style refinements

Do not use EAS Update for:

- per-user generated JSX
- unreviewed AI-created components
- native capability changes without a matching build

---

## Safe Runtime Contract

At runtime, AI can only produce:

```typescript
type SafeRuntimeUI = GenerativeUIDocument
```

The client validates, renders, or discards it.
