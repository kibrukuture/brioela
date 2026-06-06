# Auth and Onboarding — Overview

## What This Folder Covers

Supabase auth setup, Apple Sign In, Google Sign In, session management, device biometric lock, route gating, and the first-experience onboarding flow. Auth is already built and working — these files document what exists and how it fits together so future developers understand the decisions.

## Status

[x] complete — five files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-supabase-auth-setup.md` | Supabase client, encrypted session storage, token refresh on AppState, auth store (Zustand) |
| `02-sign-in-methods.md` | Apple Sign In, Google Sign In, email OTP — components, flows, error handling |
| `03-session-and-route-gating.md` | AppGate, app/index.tsx redirect logic, useProtectedRoute hook, session lifecycle |
| `04-device-biometric-lock.md` | Local authentication overlay, sensitive sheet gate, device auth hook |
| `05-onboarding-flow.md` | Onboarding screen, deferred account creation, permission sequencing, camera-first philosophy |

## Specs This Folder Draws From

- `brioela-specs/21-onboarding.md` — zero-form onboarding, max 2 questions, deferred account creation, permission sequencing
- `brioela-specs/20-platform-and-app-distribution.md` — iOS/Android distribution
- `brioela-specs/19-pricing-and-tiers.md` — tier gating starts after onboarding

## Key Decisions From Specs

- Apple Sign In + Google Sign In only — no email/password forms (email OTP exists as fallback)
- Account creation is DEFERRED — user can use the app before being asked to sign in
- Camera opens on first real use — no tutorial slides, no feature tour
- Permission requests happen at the moment the feature needs them, not during onboarding
- Session stored in encrypted storage (react-native-encrypted-storage), not AsyncStorage
- Device biometric lock on sensitive actions (not on every app open)

## What This Folder Depends On

- `03-foundation` — Supabase project must exist, mobile setup must be complete

## What Depends On This Folder

- `05-orchestrator` — Orchestrator DO is keyed by userId from auth
- Every feature that checks `useAuthStore` for user or session
