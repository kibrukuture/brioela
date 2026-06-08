# Auth And Onboarding — Overview

## What This Folder Covers

This folder documents current auth/session behavior and the product onboarding contract. Cinematic onboarding exploration is preserved under `cinematic/` as future experience design work.

## Status

[x] complete — auth docs written, cinematic onboarding separated into `cinematic/`

## Files In This Folder

| File | Contents |
|---|---|
| `01-supabase-auth-setup.md` | Supabase client, encrypted session storage, token refresh, auth store |
| `02-sign-in-methods.md` | Google, Apple, account linking, reset password |
| `03-session-and-route-gating.md` | AppGate, protected tabs, sign-out, post-login route |
| `04-device-biometric-lock.md` | Device auth, local lock overlay, sensitive action gates |
| `05-onboarding-flow.md` | Practical onboarding contract from specs, Supabase anonymous-to-permanent account path |
| `cinematic/` | Future cinematic onboarding design notes and generated-audio planning |

## Specs This Folder Draws From

- `brioela-specs/21-onboarding.md` — zero-form onboarding, max 2 questions, deferred account creation, permission sequencing
- `brioela-specs/00-product-philosophy-and-ux.md` — camera-first, voice-first, no form-heavy onboarding
- `brioela-specs/20-platform-and-app-distribution.md` — iOS/Android distribution
- `brioela-specs/19-pricing-and-tiers.md` — tier gating starts after onboarding

## Key Decisions From Specs

- Auth/session/route-gating docs describe current app behavior.
- Cinematic onboarding is not implementation-ready yet.
- Account creation is deferred by product direction; Supabase Auth remains the only auth provider and Supabase anonymous identity is the stable userId strategy before account linking.
- Camera permission flow is still an open decision for cinematic onboarding.

## What This Folder Depends On

- `03-foundation` — Supabase project must exist, mobile setup must be complete

## What Depends On This Folder

- `05-brain` — Brain DO is keyed by userId from auth
- Every feature that checks `useAuthStore` for user or session

## Known Gap

The product spec wants deferred account creation. Use Supabase anonymous auth for first-run scan identity, then link the anonymous user to Apple/Google when the user chooses to make the account permanent. Do not introduce another auth provider.
