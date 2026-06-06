# Viral Sharing — Overview

## What This Folder Covers
The mechanics that make Brioela grow without paid acquisition by turning real food discoveries into privacy-safe, useful, beautiful shareable moments. Viral Sharing is not a generic share button. It is the Discovery Card system: scan findings, Mesa compatibility, Kids learning moments, menu reality, creator attribution, grandma recipe preservation, savings, Ground discoveries, and carefully consented personal response moments. The core rule: share the discovery, not the app.

## Status
[x] complete — six files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-shareable-moment-taxonomy.md` | Brioela Moments, Discovery Card triggers, what is never shareable |
| `02-discovery-card-system.md` | card anatomy, rendering, templates, CTA, design rules |
| `03-privacy-scrub-and-consent.md` | privacy/safety filter, consent gates, sensitive-data exclusions |
| `04-feature-specific-card-types.md` | scan, kids, Mesa, menu, recipe, savings, Ground, glucose card rules |
| `05-creator-and-attribution-loop.md` | verified_profile creator attribution, Brioela-ready recipes, no creator feed |
| `06-growth-metrics-and-suppression.md` | metrics, suppression, no spam/referral/pay-to-share rules |

## Specs This Folder Draws From
- `brioela-specs/25-viral-growth-and-sharing.md` — full viral spec: core viral loop, shareable moments, share sheet integration, content strategy, 80-day pre-launch strategy, network effect lock-in
- `brioela-specs/02-recipe-ingestion-from-shared-content.md` — share sheet import of recipes from TikTok/YouTube/Instagram URLs

## Key Decisions From Specs
- Share sheet extension must ship on day one — it is a distribution mechanism, not a utility
- Shareable content is generated from real Brioela intelligence events, not generic app promotion
- Scan share: appears inline after surprising verdict; one tap generates clean image card with finding + "scanned with Brioela"
- Discovery Cards pass privacy scrub before rendering
- Recipe share: recipe card + photo from session + "recipe preserved with Brioela"
- Cook Together share: "we cooked together" card delivered to both users simultaneously
- Share cards look like information (the finding, the recipe) not advertisements — intentional
- No referral programs with financial incentives — attract low quality users and cheapen the product
- No promotional push notifications — not ever
- Recipe import/acquisition loop uses shared-content intake and recipe import from `19-recipe-ingestion`
- Creator/chef attribution is handled through `verified_profile`, not a separate creator lane

## What This Folder Depends On
- `01-design-system` — Discovery Card visual templates must use existing design tokens/components
- `07-scanner` — scan share triggered from scan result
- `08-cooking-session` — cook-together share from cooking room session end
- `14-pantry-meal-plan` — weekly summary share
- `03-foundation` — share sheet extension registration on iOS/Android
- `19-recipe-ingestion` — share sheet import and creator/source attribution loop
- `21-kids-mode` — Kids learning share cards
- `23-verified-profiles` — verified_profile creator/chef attribution and verified_business trust surfaces
- `26-mesa` — Mesa compatibility moments are future/overview-only until Mesa implementation decisions are made
- `17-menu-scanning` — menu reality cards
- `20-wearables` — personal response cards are opt-in only and never default

## What Depends On This Folder
Nothing — distribution feature.
