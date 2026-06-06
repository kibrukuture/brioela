# Pricing Tiers — Overview

## What This Folder Covers
Tier naming, pricing copy, access rules, subscription management, and enforcement of what is free vs paid. Brioela uses named tiers that feel like the product world: **Sapor**, **Luma**, **Culina**, **Viva**, with **Mesa** as the multi-person add-on/layer and **Signet** for verified people and businesses. The non-negotiable rule: basic product scanning and safety guardrails are always free, unlimited, forever.

## Status
[x] complete — six files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-tier-names-and-copy.md` | Sapor, Luma, Culina, Viva, Mesa, Signet naming and pricing-page language |
| `02-tier-entitlements.md` | what each tier unlocks and what remains free forever |
| `03-upgrade-triggers.md` | contextual upgrade prompts, no first-scan paywall, no flow-breaking modals |
| `04-access-checks-and-tools.md` | entitlement model, `check-tier-access`, server-side enforcement |
| `05-metered-and-add-ons.md` | session credits, Mesa add-on, Bela/service fees, Signet pricing boundary |
| `06-trust-and-billing-copy.md` | privacy/trust copy, billing states, cancellation, annual discount |

## Specs This Folder Draws From
- `brioela-specs/19-pricing-and-tiers.md` — full pricing spec: tier structure, cost floor per user type, tier gating rules, revenue projections, Gemini Live cost model

## Key Decisions From Specs
- Scanning: NEVER paywalled. Not on day one. Not ever. The scan is the viral loop.
- Hard allergy detection and boycott filters: never gated — safety and user autonomy are always free
- Sapor replaces Free: `$0`, beginning with free product understanding and safety guardrails
- Luma replaces Core: `$8/mo`, private food memory and everyday food intelligence
- Culina replaces Chef: `$24/mo`, cooking voice, pantry rescue, recipe preservation, deeper help
- Viva replaces Power: `$55/mo`, full living Brioela experience with advanced voice/video and deeper personalization
- Mesa is a future add-on or included in Viva, pending product/pricing decision
- Signet replaces B2B/Practitioner: `from $99/mo`, verified_profile and verified_business tools
- Metered: $0.25/voice session, $1.00/vision session, $0.50/multi-person room — credits don't expire
- Upgrade prompt: appears inline when tier limit hit, never leaves the flow, never on first 3 scans
- Pricing page copy should sell depth and trust, not read like a feature dump

## Tools Built In This Feature
Under `tools/pricing/`:
- `check-tier-access.ts` — returns whether current user's tier permits a given feature action

## What This Folder Depends On
- `04-auth-and-onboarding` — user's tier is read from their auth session/profile
- `05-orchestrator` — tier state stored in Orchestrator DO
- `08-cooking-session` — voice/video session costs drive Culina/Viva boundaries
- `17-menu-scanning` — Luma upgrade trigger
- `21-kids-mode` — Luma upgrade trigger
- `23-verified-profiles` — Signet verified person/business tier
- `26-mesa` — Mesa add-on/tier is future overview-only until decisions are made

## What Depends On This Folder
Every feature with tier-gated access: voice sessions, vision sessions, multi-person rooms, receipt scan, menu scan, kids mode, advanced behavioral reports.
