# Kids Mode — Overview

## What This Folder Covers
When a parent scans a product, one tap produces a child-friendly explanation of what's in it — calibrated by age (5-7, 8-10, 11-12). Three-part format: verdict in one sentence, the why in two sentences, one cool food fact. Works in voice sessions too (parent says "explain this to my kid," agent switches tone mid-session). Produces shareable cards formatted as parenting moments. Safety always overrides tone — hard allergy flags appear at the top before the kids-mode content.

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/31-kids-food-literacy-mode.md` — full kids mode spec: age calibration, explanation format, voice mode, share card, safety override, data model

## Key Decisions From Specs
- Secondary LLM call after standard scan verdict — augments, never replaces
- Age calibration: one tap to set (not a form); defaults to 8-10 if not set
- Age parameter injected into system prompt — no separate model
- Voice mode: agent detects "explain to my kid" instruction contextually, adjusts tone, then returns to adult mode — no toggle needed
- Audio playback uses same TTS pipeline as cooking voice agent — no extra infrastructure
- Share card: simplified design, bright/clean, "we scanned this together with Brioela" — looks like parenting moment, not ad
- Hard allergy flags appear BEFORE kids-mode explanation — safety never deprioritized for tone
- Available Core tier and above; free tier sees teaser + upgrade prompt

## What This Folder Depends On
- `05-scanner` — triggered from scan result screen after standard verdict
- `07-cooking-session` — voice mode piggybacks on cooking session AI
- `05-orchestrator` — constraint profile (allergy flags must still show)

## What Depends On This Folder
Nothing — terminal feature.
