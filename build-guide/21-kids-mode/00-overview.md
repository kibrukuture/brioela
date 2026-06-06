# Kids Mode — Overview

## What This Folder Covers
When a parent scans a product, one tap produces a child-friendly explanation of what's in it — calibrated by age (5-7, 8-10, 11-12). Three-part format: verdict in one sentence, the why in two sentences, one cool food fact. Works in voice sessions too (parent says "explain this to my kid," agent switches tone mid-session). Also supports supervised co-scan handoff: the parent can let the child hold the phone and scan products while Brioela talks directly in kid-friendly mode, with parent safety override always available. Produces shareable cards formatted as parenting moments. Safety always overrides tone — hard allergy flags appear at the top before the kids-mode content.

## Status
[x] complete — seven files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-kids-profile.md` | one-tap age range, default behavior, no child identity/profile |
| `02-scan-explanation.md` | secondary LLM call, three-part explanation format, age calibration |
| `03-voice-mode.md` | contextual "explain this to my kid" detection in live sessions and tone reset |
| `04-share-card.md` | parenting-moment share card, design boundaries, organic sharing |
| `05-safety-and-tier-boundary.md` | hard allergy override, scan remains free, Core tier teaser/upgrade behavior |
| `06-data-model-and-metrics.md` | profile/event records, privacy, analytics, retention metrics |
| `07-kid-co-scan-mode.md` | parent-controlled phone handoff, kid-directed scanning, parent override |

## Specs This Folder Draws From
- `brioela-specs/31-kids-food-literacy-mode.md` — full kids mode spec: age calibration, explanation format, voice mode, share card, safety override, data model

## Key Decisions From Specs
- Secondary LLM call after standard scan verdict — augments, never replaces
- Age calibration: one tap to set (not a form); defaults to 8-10 if not set
- Age parameter injected into system prompt — no separate model
- Voice mode: agent detects "explain to my kid" instruction contextually, adjusts tone, then returns to adult mode — no toggle needed
- Co-scan mode: parent explicitly starts and ends kid handoff; child can scan and hear explanations but cannot change settings, memory, constraints, or sharing
- Audio playback uses same TTS pipeline as cooking voice agent — no extra infrastructure
- Share card: simplified design, bright/clean, "we scanned this together with Brioela" — looks like parenting moment, not ad
- Hard allergy flags appear BEFORE kids-mode explanation — safety never deprioritized for tone
- Available Core tier and above; free tier sees teaser + upgrade prompt

## What This Folder Depends On
- `07-scanner` — triggered from scan result screen after standard verdict
- `08-cooking-session` — voice mode piggybacks on cooking session AI
- `05-orchestrator` — constraint profile (allergy flags must still show)
- `01-design-system` — share card and scan UI use existing visual tokens/components

## What Depends On This Folder
- `25-pricing-tiers` — uses Kids Mode as a Core tier upgrade trigger; entitlement enforcement lives there
