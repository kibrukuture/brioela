# 28. Medical Condition Food Profile

## Goal

Let the user declare a medical condition once — by voice — and have every part of the app permanently adapt: scan flags, recipe filters, map recommendations, meal plans, and notifications all reflect the condition's dietary implications without any further setup.

## Why This Exists

Hundreds of millions of people manage food-related medical conditions: diabetes, high cholesterol, gout, hypertension, kidney disease, celiac disease, pregnancy, IBS, Crohn's, Warfarin therapy, phenylketonuria, and dozens more. Every one of these conditions has specific, well-documented food rules.

Today those people manage it with willpower, printed handouts from their doctor, and constant label-reading. Brioela can make this invisible. One sentence — "I'm pregnant" or "I have gout" — and the app becomes a personal clinical-grade food filter for that condition.

## User Outcome

- User says (via voice, at any point in the app): "I'm pregnant" / "I have gout" / "I'm pre-diabetic" / "I'm on blood thinners."
- Brioela confirms with a single follow-up question only if the condition has ambiguous dietary rules (e.g., "some gout guidelines differ — do you want me to apply the strict or moderate version?").
- From that moment: all scan verdicts include condition-specific flags, all recipe suggestions are filtered, all map recommendations are adjusted.
- The condition is stored in the user's Brain DO as part of their permanent profile. No re-entry required.
- The user can say "I'm no longer pregnant" and the profile is updated immediately.

## Conditions Supported (v1)

| Condition | Key dietary rules applied |
|---|---|
| Pregnancy | Flag: listeria risk (deli meats, soft cheeses, sushi, sprouts), mercury-high fish (shark, swordfish, king mackerel), unpasteurized products, high-vitamin-A liver products, excess caffeine |
| Type 2 diabetes / pre-diabetes | Flag: high glycemic index foods, added sugars, refined carbs; surface fiber content and glycemic load per product |
| Gout | Flag: high-purine foods (organ meats, anchovies, sardines, shellfish, alcohol); surface purine level where data exists |
| Hypertension | Flag: high sodium products; surface sodium content prominently; map favors low-sodium options |
| High cholesterol | Flag: trans fats, saturated fat > daily threshold; surface HDL/LDL impact where data available |
| Warfarin / blood thinners | Flag: high vitamin K foods (kale, spinach, broccoli in large quantities); consistency note — not avoid, but maintain consistent intake |
| IBS / low-FODMAP | Flag: high-FODMAP ingredients (onion, garlic, wheat, lactose); recipes auto-filter for low-FODMAP compliance |
| Celiac disease | Hard flag: any gluten source; stricter than a gluten-free preference — treats cross-contamination warnings as red |
| Chronic kidney disease | Flag: high potassium, high phosphorus, high sodium; surface these prominently in scan results |
| PKU (phenylketonuria) | Flag: phenylalanine sources, aspartame (converts to phenylalanine); treat as hard allergy equivalent |

Additional conditions can be added as data quality supports them.

## Voice Detection

If the user says anything that implies a medical condition during any voice interaction (cooking session, ambient conversation, scan comment), Brioela's Brain DO notes the signal and — at the next natural pause — confirms:

"You mentioned you're pregnant. Do you want me to apply pregnancy-safe food guidelines across your scans and recipes?"

This is the same behavioral inference pattern as allergy detection. The condition is never assumed — it is proposed once and confirmed.

## Scan Verdict Changes

When a condition is active, the scan result screen adds a condition-specific row beneath the standard verdict:

- Standard row: overall green/yellow/red verdict.
- Condition row: "[Condition] flag: this product contains [X], which [reason]."

The condition flag is separate from the allergy flag. A user can have both. They are displayed as distinct rows so the user understands why each flag exists.

## Recipe Filter Changes

All recipe suggestions are filtered against the active conditions. Recipes with condition-violating ingredients are either:
- Hidden by default (hard conditions: celiac, PKU, hard pregnancy risks).
- Ranked lower and flagged (soft conditions: gout, hypertension).

When a recipe is flagged, Brioela proposes the lowest-intervention substitution: "Replace anchovies with capers to make this gout-safe."

## Map Changes

The healthy food map (spec 04) adjusts POI recommendations for active conditions:
- Pregnancy: surfaces prenatal nutrition resources, pregnancy-safe restaurant options.
- Diabetes: surfaces low-GI friendly options, flags bakeries / fast food heavy areas.
- Celiac: surfaces dedicated gluten-free establishments; adds community note filter for celiac-specific reports.

## Practitioner Integration

If the user has a verified practitioner relationship (spec 18), the practitioner can view the active conditions and push condition-specific guidance. The practitioner does not set the condition — the user does — but they can annotate it with notes that appear in the user's scan verdicts.

## Data Model

- `medical_condition_profile`: user_id, condition_type, severity (strict/moderate, where applicable), confirmed_at, confirmed_by (self/voice/practitioner), active (boolean), updated_at.
- `condition_flag_event`: user_id, scan_event_id (or recipe_id), condition_type, flag_reason, flag_level (hard/soft), created_at.

## Privacy

Medical conditions are among the most sensitive personal data. Rules:
- Never included in community notes or any shared data.
- Never used for ad targeting or third-party data sharing (Brioela has no ad model).
- Stored only in the user's Brain DO and encrypted at rest.
- User can delete all medical condition data at any time from settings — one tap, immediate effect.

## Technical Constraints

- Condition rules are maintained as a versioned config table in Supabase, not hardcoded in DO logic. When dietary science updates (e.g., new pregnancy guidelines), the config updates without a code deploy.
- The condition profile is loaded into every scan verdict call and every recipe suggestion call — it is part of the standard context injected from the Brain DO.
- Voice detection of condition triggers goes through the same behavioral signal pipeline as allergy detection (spec 07).

## Success Metrics

- Condition profile activation rate among users who mention a health condition in voice sessions.
- Condition-specific scan flag engagement (user taps the condition row to read more).
- Retention delta: users with active conditions vs. users without (hypothesis: significantly higher retention because the product is more essential).
- Practitioner referral rate: practitioners who recommend Brioela to patients because of condition support.
