# Medical Conditions — Overview

## What This Folder Covers
Declare a medical condition once by voice and the entire app adapts permanently: scan flags, recipe filters, map recommendations, and meal plans all reflect the condition's dietary implications without any further setup. Conditions supported v1: pregnancy, T2 diabetes/pre-diabetes, gout, hypertension, high cholesterol, Warfarin/blood thinners, IBS/low-FODMAP, celiac disease, chronic kidney disease, PKU. Condition rules stored as versioned config in Supabase — updates without a code deploy.

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/28-medical-condition-food-profile.md` — full spec: conditions list, voice detection, scan verdict changes, recipe filter, map changes, practitioner integration, data model

## Key Decisions From Specs
- Voice detection: same behavioral inference pipeline as allergy detection (spec 07); proposed once, confirmed once — never asked again
- Condition flag is SEPARATE from allergy flag in scan result — two distinct rows so user understands why each exists
- Condition rules: versioned config table in Supabase (`drug_food_interaction` and `condition_rule`) — never hardcoded in DO logic
- Condition profile loaded into every scan verdict call — part of standard context from Orchestrator DO
- Celiac treated as hard allergy equivalent — cross-contamination warnings are red, not yellow
- Practitioner integration: verified practitioners can view active conditions and push condition-specific guidance (spec 18)
- Stored encrypted at rest in DO SQLite — most sensitive personal data category

## What This Folder Depends On
- `05-orchestrator` — condition profile stored in Orchestrator DO; loaded into all scan and recipe calls
- `07-scanner` — condition flag row appears in scan result alongside standard verdict
- `23-verified-profiles` — practitioner access to condition data

## What Depends On This Folder
- `14-pantry-meal-plan` — meal plan filters against active conditions
- `20-wearables` — CGM + T2 diabetes is the most powerful combination in the app
- `08-cooking-session` — cooking agent aware of active conditions in session context
