# Verified Profiles — Overview

## What This Folder Covers
Verified business and practitioner profiles on the Brioela platform. Nutritionists, dietitians, food businesses, and health practitioners can get a verified listing on the healthy food map, push condition-specific guidance to their clients, and access analytics about their listed products. B2B/Practitioner tier ($79-99/month). Limited in scope — this is not a social network.

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/18-verified-business-and-practitioner-profiles.md` — verified profile spec: who qualifies, what they get, practitioner-client relationship
- `brioela-specs/19-pricing-and-tiers.md` — B2B/Practitioner tier pricing and features

## Key Decisions From Specs
- Practitioners can view client active conditions and push food guidance (client must grant access)
- Verified map listing with ingredient transparency badge
- Analytics: scan counts, community note sentiment for their listed products/places
- Creator public recipe profile (shareable, branded)
- Practitioner does NOT set the user's condition — the user does; practitioner can annotate with notes that appear in scan verdicts
- Up to 10 client accounts per practitioner account
- This is a B2B revenue stream, not a consumer social feature

## What This Folder Depends On
- `05-orchestrator` — practitioner reads client condition data from DO (with client permission)
- `10-map` — verified listing appears on healthy food map
- `04-auth-and-onboarding` — practitioner role gating and verification flow

## What Depends On This Folder
- `22-medical-conditions` — practitioner can annotate active conditions
