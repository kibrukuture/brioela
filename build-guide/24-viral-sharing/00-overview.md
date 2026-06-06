# Viral Sharing — Overview

## What This Folder Covers
The mechanics that make Brioela grow without paid acquisition. Share cards generated as a side effect of product moments: scan discovery share, recipe capture share, cook-together moment, weekly summary share. iOS/Android share sheet extension for recipe import from TikTok/YouTube/Instagram. The share card design principle: looks like information, not an ad. Also covers the 80-day build-in-public TikTok strategy (documented, not built).

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/25-viral-growth-and-sharing.md` — full viral spec: core viral loop, shareable moments, share sheet integration, content strategy, 80-day pre-launch strategy, network effect lock-in
- `brioela-specs/02-recipe-ingestion-from-shared-content.md` — share sheet import of recipes from TikTok/YouTube/Instagram URLs

## Key Decisions From Specs
- Share sheet extension must ship on day one — it is a distribution mechanism, not a utility
- Scan share: appears inline after surprising verdict; one tap generates clean image card with finding + "scanned with Brioela"
- Recipe share: recipe card + photo from session + "recipe preserved with Brioela"
- Cook Together share: "we cooked together" card delivered to both users simultaneously
- Share cards look like information (the finding, the recipe) not advertisements — intentional
- No referral programs with financial incentives — attract low quality users and cheapen the product
- No promotional push notifications — not ever
- Recipe import: POST /api/recipes/import; URL or media reference; model normalizes into canonical schema; uncertain quantities marked `estimated` not fabricated

## What This Folder Depends On
- `07-scanner` — scan share triggered from scan result
- `08-cooking-session` — cook-together share from cooking room session end
- `14-pantry-meal-plan` — weekly summary share
- `03-foundation` — share sheet extension registration on iOS/Android

## What Depends On This Folder
Nothing — distribution feature.
