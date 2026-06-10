# Brioela Specs

Feature specs for Brioela — the ambient food intelligence app.

Rules:
- One file owns one feature or concern.
- Specs are technical and product-behavioral, not marketing copy.
- Cross-feature dependencies are referenced but not re-specified in full.
- File numbering is stable and intended to support later expansion.

## Foundations (Read These First)

- `00-product-philosophy-and-ux.md` — The ambient, voice-first, Shazam-for-food design law that governs every other spec.
- `00b-naming-lexicon.md` — The product naming lexicon: every brand name (Brioela, Mira, Bela, Mesa, Ground, Find, Passport, Encore, Kin, Heirloom, Harvest, Sift, Tonight), what it names, why, and where it is used — plus what is deliberately unnamed.
- `24-technical-architecture-backbone.md` — Full tech stack: Cloudflare Workers + Hono.js, CF Agent SDK (Durable Objects), Gemini Live, Cloudflare Realtime / RealtimeKit, Upstash (QStash + Redis + Workflow).

## Core Product Features

- `01-product-health-scanning.md`
- `02-recipe-ingestion-from-shared-content.md`
- `03-hyperlocal-community-notes.md`
- `04-healthy-food-map.md`
- `05-origin-supply-chain-and-boycott-filters.md`
- `06-receipt-spend-intelligence.md`
- `07-allergy-dislike-and-dietary-guardrails.md`

## Agent and Memory Layer

- `08-personal-food-brain-memory.md`
- `09-per-user-brain.md` — Hermes-architecture isolated per-user agent built on CF Agent SDK + Upstash.

## Cooking Intelligence

- `10-mira-cooking-voice.md` — Mira cooking voice session with Gemini Live full-duplex audio.
- `11-live-vision-cooking-coach.md` — Gemini Live audio + video simultaneously, premium tier.
- `12-multi-person-cooking-rooms.md` — Cloudflare Realtime / RealtimeKit rooms, remote family and friends.
- `13-generational-recipe-capture.md`
- `14-fridge-and-pantry-ingredient-rescue.md`

## Ambient Intelligence

- `15-hyperlocal-price-and-availability-alerts.md`
- `16-weekly-food-summary.md`
- `17-behavioral-food-pattern-detection.md`
- `22-pre-trip-food-intelligence.md`
- `23-ambient-notification-strategy.md`

## Business and Platform

- `18-verified-business-and-practitioner-profiles.md`
- `19-pricing-and-tiers.md` — 5-tier model with full cost floor math.
- `20-platform-and-app-distribution.md` — iOS + Android native, PWA, share sheet.
- `21-onboarding.md` — Zero-friction, max 2 questions, behavior-first learning.
- `25-viral-growth-and-sharing.md`

## Breakthrough Layer (Second Wave)

Features built as connections across the existing systems — each is a read-path over data the Brain already holds, not a new standalone system.

- `44-encore.md` — **Encore.** Taste it once, cook it forever: plate photo → reconstructed personalized recipe → Ground sourcing → Bela order → Mira session.
- `45-in-store-copilot.md` — Mira in one earbud during the grocery run: list, spend baseline, personal swaps, Mesa checks, store-scoped Ground intel. (Deliberately unnamed — it is Mira in a new room.)
- `46-acoustic-cooking-intelligence.md` — Mira hears the kitchen: sizzle, boil-over, whistle counts as cooking-state evidence inside existing audio sessions. (Deliberately unnamed — a Mira capability.)
- `47-kin.md` — **Kin.** Anonymized glucose-response clusters: "people whose bodies react like yours" overlays on scan verdicts, k-anonymity enforced.
- `48-heirloom.md` — **Heirloom.** Heritage recipes and style profiles passed to family as copies, with succession. Umbrella name over specs 13, 32, 48. Receiving is free, always.
- `49-harvest.md` — **Harvest.** The annual mirror artifact, anniversary-timed, generative-grammar rendered, free for every user.
- `50-negative-space-nutrition.md` — Detects what is consistently missing from the user's food life, surfaced conversationally under the spec 17 budget.
- `51-tonight-dinner-answer.md` — One card, one dish, once a day: the zero-decision dinner answer from pantry, audience, time budget, and readiness.
- `52-craving-decoder.md` — "Why am I craving this?" answered from sleep, eating gaps, and the user's own patterns — honest "no pattern" included.
- `53-growth-mirror.md` — Rare, evidence-backed recognition that the user has become a better cook. Observation, never gamification.

## Next Pass

- Add shared data contracts in a `contracts/` area.
- Mark each spec with status: draft, validated, building, shipped.
- Split out API contracts from product behavior where implementation complexity demands it.
