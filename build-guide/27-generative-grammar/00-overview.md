# Brioela Generative Grammar — Overview

## What This Folder Covers

Brioela Generative Grammar is the safe creative UI language for the app. It replaces the false choice between a rigid component registry and unsafe runtime JSX. The AI does not write React Native code. It composes typed primitives, emotional tokens, motion, haptics, and Skia treatments into a `GenerativeUIDocument` that the app renders with compiled, validated components.

## Status

[x] design complete — `01–17` + `19–21` written, research saved; `18` (WebView) deferred to future. Ready to code.

## Files In This Folder

| File | Contents |
|---|---|
| `01-runtime-boundary.md` | why no runtime JSX/MDX, platform constraints, Expo update boundary |
| `02-grammar-document.md` | `GenerativeUIDocument`, schema shape, validation, versioning |
| `03-primitive-families.md` | primitive families: surface, layout, meaning, food, Mesa, memory, share, atmosphere |
| `04-emotion-motion-skia.md` | emotional tokens, motion/haptic pairings, Skia treatments |
| `05-renderer-and-fallback.md` | recursive renderer, static fallback, 400ms rule, error handling |
| `06-surface-integration.md` | feature surfaces and what is never generative |
| `07-web-and-mobile-strategy.md` | React Native first, PWA/web strategy, CopilotKit/AI SDK/A2UI learnings |
| `08-build-time-creation-lane.md` | AI-assisted component creation at build time, review, registry promotion |
| `09-generativity-tiers.md` | the four tiers (static / grammar / canvas / mini-app) and the decision rule |
| `10-the-stage-document.md` | the Stage: six expressive layers (mood, atmosphere, composition, slots, beats, voice) |
| `11-composition-catalog-and-scale.md` | vocabulary layers, scale/soul answer, combinatorial math, quality bar |
| `12-naming-law.md` | binding naming law — functional enums, no metaphor in AI vocab, token-axis rule, renames |
| `13-how-ai-selects.md` | tool calling vs structured output, discriminated-union selection, the silence gate |
| `14-primitive-layers-and-reuse.md` | structural/expressive/domain primitives, cross-feature reuse, generic≠shadcn |
| `15-validation-and-repair.md` | validate twice → fail closed live (400ms) → repair offline; size caps; safety/privacy filter |
| `16-atmosphere-skia-system.md` | Tier 2 Skia: `{character}_field` families, uniform contract, web parity, degradation |
| `17-motion-beats-system.md` | the `beats` choreography layer, Reanimated 4 mapping, reduced-motion contract |
| `19-code-package-structure.md` | the grammar mapped to real dirs: `shared/grammar/`, `mobile/grammar/`, `backend/src/core/generative-grammar/`; build order |
| `20-contracts-and-stage-delivery.md` | contract-first API boundary, HTTP/realtime Stage delivery, no normal grammar route, end-to-end examples |
| `21-contract-spine-hardening.md` | stricter contract spine: co-located schemas, stage policy, contract-derived query keys, lint/CI rules |
| `research/` | five full-text 2025–2026 research reports + index (substrate, frameworks, beauty stack) |

## Deferred (future, not v1)

- `18-tier3-webview-miniapp.md` — sandboxed WebView mini-app escape hatch (parked; Tier 1+2 cover v1)

## Specs This Folder Draws From

- `brioela-specs/39-generative-ui.md` — original generative UI concept and safety boundaries
- `brioela-specs/42-brioela-generative-grammar.md` — expanded grammar source spec
- `build-guide/01-design-system/06-generative-ui.md` — existing registry/Zod/400ms base pattern

## Key Decisions

- No runtime JSX generation.
- No runtime MDX for core app UI.
- No arbitrary remote code execution.
- The AI generates typed grammar documents, not components.
- React Native is first-class; PWA/web can render the same grammar.
- Static safety UI always renders first and remains authoritative.
- The grammar layer is additive and optional.
- HTTP and realtime features can both receive AI-selected Stages; only delivery differs.
- Normal product flows do not call a separate grammar route. Feature responses or streams carry optional Stage data.
- New boundary-crossing code should use the Contract Spine: contract-backed requests, responses, streams, Stage policy, and query keys.
- Skia, Reanimated, and haptics are tokenized grammar outputs, not arbitrary style code.
- Build-time AI can propose new `.tsx` components, but humans review and ship them before runtime use.

## What This Folder Depends On

- `01-design-system` — tokens, motion, haptics, Skia layers, CVA variants, component registry
- `03-foundation` — Expo/React Native runtime and update constraints
- `05-orchestrator` — server-side decision generation and context
- `24-viral-sharing` — Discovery Card artifact layer

## What Depends On This Folder

Every feature with emotional or contextual UI surfaces: scanner, recipes, Mesa, menu scanning, Food Time Machine, Discovery Cards, weekly summaries, cooking openers, and future UI surfaces.

## Product Rule

Brioela does not generate screens. Brioela composes emotional food moments from a living UI grammar.
