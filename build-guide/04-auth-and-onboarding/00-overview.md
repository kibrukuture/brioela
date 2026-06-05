# Auth and Onboarding — Overview

## What This Folder Covers
Supabase Auth setup, Apple Sign In, Google Sign In, session management, role gating (user vs shopper mode), and the first-experience onboarding flow. The onboarding spec is minimal by design — max 2 questions, camera opens immediately, no forms ever.

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/21-onboarding.md` — zero-form onboarding, max 2 questions, deferred account creation, permission sequencing
- `brioela-specs/20-platform-and-app-distribution.md` — iOS/Android/PWA distribution considerations
- `brioela-specs/19-pricing-and-tiers.md` — tier gating that starts after onboarding

## Key Decisions From Specs
- Apple Sign In + Google Sign In only — no email/password forms ever
- Account creation is DEFERRED — user can scan multiple times before being asked to create an account
- First sign-up prompt appears when user tries to save a recipe, write a community note, or start a voice session
- Camera opens immediately on first app open — no tutorial, no welcome flow, no feature list
- Permission requests happen at the moment the feature first needs them, not before
- Notification permission: not at install, not during onboarding — after 3rd scan session or contextual community note moment
- Shopper mode: role-gated view within the same app, unlocked when `shoppers.status = 'active'`

## What This Folder Depends On
- `03-foundation` — Supabase project must exist

## What Depends On This Folder
- `05-orchestrator` — Orchestrator DO is keyed by userId from auth
- Every feature with auth-gated access
