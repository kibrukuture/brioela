# Onboarding — Product Flow

## What This File Covers

The practical first-use onboarding flow from product specs, separate from the cinematic onboarding exploration.

## Source Specs

- `brioela-specs/21-onboarding.md`
- `brioela-specs/00-product-philosophy-and-ux.md`
- `brioela-specs/19-pricing-and-tiers.md`

## Product Rule

Onboarding is not a registration form or feature tour.

Onboarding means the user gets useful food intelligence quickly.

## Spec Flow

1. App opens with camera-first prompt.
2. User points at food/product.
3. Brioela returns useful scan verdict in under 3 seconds.
4. Optional constraint question only if scan surfaced something relevant.
5. Account creation is deferred until saving, contributing, or starting paid/voice features.

## What Brioela Must Not Do

- No multi-step welcome flow.
- No preference wizard.
- No health-goal dropdowns.
- No subscription prompt before value.
- No permission requests before the user takes an action requiring permission.

## Current App Reality

- `/onboarding` currently routes users before protected tabs.
- Current auth flow exists and can sign in before entering tabs.
- The spec wants deferred account creation, but current route gating requires auth for tab access.

## Known Gap

Need a decision:

- allow guest scan before auth, or
- keep auth-first temporarily and document that it differs from the product spec.

## Cinematic Onboarding

Cinematic onboarding design work lives under:

- `build-guide/04-auth-and-onboarding/cinematic/`

It is not the same as practical auth/session onboarding.
