# Brioela Specs

Feature specs for Brioela — the ambient food intelligence app.

Rules:
- One file owns one feature or concern.
- Specs are technical and product-behavioral, not marketing copy.
- Cross-feature dependencies are referenced but not re-specified in full.
- File numbering is stable and intended to support later expansion.

## Foundations (Read These First)

- `00-product-philosophy-and-ux.md` — The ambient, voice-first, Shazam-for-food design law that governs every other spec.
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

## Next Pass

- Add shared data contracts in a `contracts/` area.
- Mark each spec with status: draft, validated, building, shipped.
- Split out API contracts from product behavior where implementation complexity demands it.
