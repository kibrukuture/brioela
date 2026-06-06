# Pricing Tiers — Overview

## What This Folder Covers
Tier gating logic, subscription management, and the enforcement of what is free vs paid. Four tiers: Free ($0), Core ($8/mo), Chef ($24/mo), Power ($55/mo), plus B2B/Practitioner ($79-99/mo) and metered pay-per-session options. The non-negotiable rule: scanning is always free, unlimited, forever. Safety features (allergy guardrails, boycott filters) are also never gated.

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/19-pricing-and-tiers.md` — full pricing spec: tier structure, cost floor per user type, tier gating rules, revenue projections, Gemini Live cost model

## Key Decisions From Specs
- Scanning: NEVER paywalled. Not on day one. Not ever. The scan is the viral loop.
- Hard allergy detection and boycott filters: never gated — safety and user autonomy are always free
- Free: unlimited scanning, basic map read-only, community notes read-only, 3 saved recipes
- Core ($8): full map, write community notes, unlimited recipes, full memory, receipt scan, weekly summary
- Chef ($24): voice cooking agent (30 sessions/month, 15min each), spend tracker, generational recipe capture, fridge rescue, pre-trip intel
- Power ($55): unlimited live video cooking, multi-person rooms, priority routing, advanced behavioral reports
- B2B ($79-99): verified profile, client management, creator recipe profile, analytics
- Metered: $0.25/voice session, $1.00/vision session, $0.50/multi-person room — credits don't expire
- Upgrade prompt: appears inline when tier limit hit, never leaves the flow, never on first 3 scans

## Tools Built In This Feature
Under `tools/pricing/`:
- `check-tier-access.ts` — returns whether current user's tier permits a given feature action

## What This Folder Depends On
- `04-auth-and-onboarding` — user's tier is read from their auth session/profile
- `05-orchestrator` — tier state stored in Orchestrator DO

## What Depends On This Folder
Every feature with tier-gated access: voice sessions, vision sessions, multi-person rooms, receipt scan, menu scan, kids mode, advanced behavioral reports.
