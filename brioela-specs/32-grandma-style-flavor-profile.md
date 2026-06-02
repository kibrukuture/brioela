# 32. Grandma Style Flavor Profile

## Goal

After a generational recipe capture session (spec 13), extract the cook's personal technique, seasoning instincts, and flavor identity into a persistent style profile — so any recipe can be adapted "in her style" even when she is not on the call.

## Why This Exists

The generational recipe capture session preserves a specific recipe. But grandma's greatness is not the recipe — it is the approach. The hand that adds salt without measuring. The instinct to add more fat at the end. The way she lets onions cook longer than anyone else would. The habit of adjusting for humidity, altitude, the age of the spices.

A recipe card cannot capture this. A style profile can.

After enough sessions, Brioela extracts the pattern: she always uses X technique, she consistently adds Y more of Z, she substitutes A for B in desserts. That pattern becomes a persistent flavor profile. Any recipe can be run through it: "cook this in grandma's style."

When she is gone, her cooking lives in the app. That is not a feature. That is a reason to never delete the app.

## User Outcome

- After one or more generational recipe capture sessions (spec 13), the user sees a "style profile" building up in their family recipes section.
- The profile accumulates automatically — no extra work from the user.
- When browsing any recipe, the user sees a "cook in [name]'s style" option.
- Brioela adapts the recipe: adjusts seasoning quantities, flags technique substitutions, adds the characteristic final touches the profile has identified.
- The adapted recipe is saved as a variant attributed to the cook.

## Style Extraction

During a generational recipe capture session, the AI agent is already listening and watching. Style extraction runs as a secondary analysis job on the session transcript, not as a live feature — it does not interrupt the session.

What is extracted:

- **Seasoning signature**: does she use more salt than the recipe calls for? Does she add acid (lemon, vinegar) late? Does she build spice layers at different stages?
- **Technique fingerprints**: slow cooking onions past the point most recipes specify, adding liquid in stages rather than all at once, covering vs. uncovering at specific points.
- **Improvisation patterns**: standard substitutions she makes (clarified butter instead of oil, yogurt instead of cream), adjustments for available ingredients.
- **Finishing moves**: additions made at the end of cooking that are not in the written recipe — the drizzle of olive oil, the herb torn not chopped, the spice bloomed in hot fat added last.
- **Spoken instincts**: phrases like "until it smells right," "until it pulls away from the pan," "until the color changes" — these are translated into observable checkpoints.

The extraction model is a structured post-session LLM analysis call on the transcript. Not a real-time feature.

## Style Profile Display

The style profile is shown to the user as a readable, human-language summary — not a technical data dump:

"[Name]'s style: She cooks onions longer and lower than most recipes say. She adds more cumin than written and always finishes with a squeeze of lemon. Her substitution: ghee instead of vegetable oil whenever the recipe allows it."

The user can edit this summary if anything was extracted incorrectly. Corrections update the underlying profile.

## Recipe Adaptation

When "cook in [name]'s style" is selected for a recipe:

1. The style profile is passed to the recipe adaptation model as context.
2. The model returns a modified recipe with annotated changes: "Increase cumin by 50% (her instinct). Cook onions an additional 8 minutes on low heat. Add lemon juice after plating (her finishing move)."
3. Each change is attributed: "from her style profile" vs. "from the original recipe."
4. The adapted recipe is saved as a variant. The original is untouched.

## Multiple Profiles

The user can have multiple style profiles — one per person captured. Grandma's style. Dad's BBQ style. A friend's baking instincts. Each is attributed and distinct.

During a cooking session, the user can say: "cook this like grandma would" and the AI agent pulls the relevant profile and applies it in real time, narrating the adaptations as it guides.

## Emotional Layer

The style profile page is intentionally designed to feel personal, not technical. The profile is shown with the cook's name prominently, alongside any photos from the session. The language is warm.

This is the feature that gets written about in obituaries and shared at family dinners. It is designed to matter beyond cooking.

## Data Model

- `cook_style_profile`: profile_id, user_id, cook_name, cook_relationship, session_ids_json (source sessions), style_summary_text, extracted_at, updated_at.
- `cook_style_attribute`: attribute_id, profile_id, attribute_type (seasoning/technique/substitution/finishing), description, confidence_score, source_quote (from transcript), created_at.
- `recipe_style_variant`: variant_id, recipe_id, profile_id, adapted_recipe_json, adaptation_notes, created_at.

## Technical Constraints

- Style extraction is a post-session async job via Upstash Workflow — it does not block session end.
- Extraction runs on the full session transcript plus any vision events from the session.
- Style profiles are stored in the user's Orchestrator DO — they are personal data, not shared.
- The "cook in her style" adaptation call is a standard LLM structured call, not a streaming session. Target latency: under 3 seconds.
- Style profiles survive account deletion requests for a grace period (30 days) with explicit user warning: "This will permanently delete [name]'s cooking style. This cannot be undone."

## Success Metrics

- Style profile generation rate per generational recipe session.
- "Cook in their style" recipe adaptation usage rate.
- Retention impact: users with active style profiles vs. users without.
- Session frequency: do users with a grandma profile cook more often in the app?
- Emotional engagement proxy: does the presence of a named style profile reduce churn in the 3–6 month window (hypothesis: yes, because the profile has irreplaceable personal value).
