# Auth And Onboarding — Overview

## What This Folder Covers

This folder is currently mixed. It contains cinematic onboarding planning files, while older notes expected auth/session build-guide files. Treat it as partially organized until auth docs and cinematic onboarding docs are separated or reconciled.

## Status

[~] partial — cinematic onboarding planning exists; auth files are not written here

## Files In This Folder

| File | Contents |
|---|---|
| `README.md` | Temporary cinematic onboarding workspace index |
| `01-script.md` | Current cinematic onboarding script |
| `02-narration-and-voice.md` | Voice direction and generation approach |
| `03-music-direction.md` | Music bed direction |
| `04-sound-effects.md` | SFX direction |
| `05-timeline-and-cues.md` | Timeline/cue plan |
| `06-visual-scenes.md` | Scene and visual language |
| `07-camera-permission-flow.md` | Camera permission options |
| `08-assets-and-sources.md` | Asset groups and source options |
| `09-performance-plan.md` | Performance constraints and fallback mode |
| `10-implementation-architecture.md` | Provisional component architecture |

## Specs This Folder Draws From

- `brioela-specs/21-onboarding.md` — zero-form onboarding, max 2 questions, deferred account creation, permission sequencing
- `brioela-specs/00-product-philosophy-and-ux.md` — camera-first, voice-first, no form-heavy onboarding
- `brioela-specs/20-platform-and-app-distribution.md` — iOS/Android distribution
- `brioela-specs/19-pricing-and-tiers.md` — tier gating starts after onboarding

## Key Decisions From Specs

- Cinematic onboarding is not implementation-ready yet.
- Auth/session/route-gating docs still need their own files.
- Account creation is deferred by product direction, but Orchestrator features need a stable userId strategy.
- Camera permission flow is still an open decision for cinematic onboarding.

## What This Folder Depends On

- `03-foundation` — Supabase project must exist, mobile setup must be complete

## What Depends On This Folder

- `05-orchestrator` — Orchestrator DO is keyed by userId from auth
- Every feature that checks `useAuthStore` for user or session

## Known Missing Auth Files

- `01-supabase-auth-setup.md`
- `02-sign-in-methods.md`
- `03-session-and-route-gating.md`
- `04-device-biometric-lock.md`
- `05-onboarding-flow.md`
