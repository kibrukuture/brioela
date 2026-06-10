# 50. Negative Space Nutrition

## Goal

Detect what is consistently missing from the user's food life — nutrient categories that never enter their kitchen, food groups that quietly vanished without replacement — and surface it the way Brioela surfaces everything: rarely, conversationally, with evidence, and only when confidence is high.

## Why This Exists

Every intelligence layer in the product analyzes what the user does: what they scan (spec 01), buy (spec 06), cook (spec 10), and how those behaviors drift (spec 17). Nothing watches the absence. Spec 17's "dietary drift" comes closest — it detects the fading of something that used to be present — but no spec covers what was never there at all, or what was structurally lost when something else was cut.

The Brain has months of scans, receipts, and meal history: enough to notice "nothing with omega-3 has entered this kitchen in 7 weeks" or "since dairy stopped in March, nothing replaced the calcium that came with it." A person cannot see their own blind spots by definition. An app that only reacts to what you show it cannot protect you from what you never show it. Negative space detection is the moment Brioela feels like it is watching out for the user, not just watching them.

## User Outcome

- The user does nothing. No food diary, no nutrient tracker, no goals screen (spec 00 zero-form law).
- During a natural moment — a relevant scan, a meal plan generation, a cooking conversation — Brioela mentions a gap once, with its evidence: "Looking at the last two months, almost nothing with omega-3 has come through your kitchen. Want me to keep an eye on that?"
- If the user says yes: the gap becomes a quiet standing concern — the meal plan (spec 33) starts filling it without fanfare, scan verdicts gently note when a product helps ("good source of what you've been missing"), and the weekly summary (spec 16) tracks the close.
- If the user says no or explains ("I take fish oil"): the answer is recorded as memory (`memory_update`), the gap closes permanently for that reason, and Brioela never raises it again. One confirmation per gap, ever — the spec 21 constraint-discovery discipline.

## In Scope

- Absence detection over the user's observed food stream: scans linked to purchases, receipt line items, cooked recipes, meal logs from visual intake (spec 34).
- Two gap classes:
  1. **Structural absence** — a nutrient category with near-zero presence across the whole observation window.
  2. **Displacement gap** — a tracked dietary change (a `diet.*` memory entry or detected drift, spec 17) removed a category that carried nutrients nothing else now covers.
- Conversational surfacing under the spec 17 intervention budget (these share the one-insight-per-week cap — a user never gets a pattern insight and a gap insight in the same week).
- Standing-concern integration with meal plan, scan verdicts, predictive pantry, and weekly summary.

## Out of Scope

- Deficiency diagnosis. Brioela observes what entered the kitchen, not what is in the user's blood. The language is always "hasn't come through your kitchen", never "you are deficient." Spec 30's boundary verbatim: the app never diagnoses — it narrows and advises.
- Micronutrient precision theater. Detection runs on a small set of well-evidenced, food-pattern-visible categories (see Coverage), not a 40-vitamin panel.
- Supplements advice. If the user mentions a supplement, it is recorded as the reason a gap is closed — Brioela never recommends buying one.
- Daily nutrient scoring, dashboards, or any persistent "nutrition report card" surface.

## The Honesty Problem: Observation Coverage

The single hardest design constraint: Brioela sees what is scanned, bought on captured receipts, cooked in sessions, and photographed — not everything eaten. Restaurant meals without menu scans, the partner's shopping, snacks at work — all invisible. A naive absence detector would be confidently wrong constantly.

The coverage gate, computed per user per window:

- **Coverage score** = how complete the observed stream plausibly is: receipt regularity (does grocery cadence match spec 36 purchase rhythms?), meal-log density, scan frequency, share of eating events with any observation.
- Gap detection only runs at all when coverage clears a floor (the user's food life is substantially visible). Below the floor, the feature stays silent — no insight is better than a wrong one (the spec 34 discard-threshold philosophy).
- Every surfaced gap is phrased within its evidence: "almost nothing with omega-3 *has come through your kitchen*" — claiming exactly what was observed, nothing more. The user's "I eat fish at lunch every day" is a coverage correction, recorded, gap closed.

## Detection Pass

Runs inside the existing weekly Brain DO alarm cycle (spec 09) alongside behavior pattern detection — not a new scheduler:

```text
step 1: coverage check — compute the window's coverage score; abort silently if below floor
step 2: presence map — classify the window's observed items (scans-with-purchase,
        receipt items, cooked recipes, logged meals) against the tracked
        nutrient categories using the shared product corpus data; the map is
        category → observed carrier count + recency
step 3: structural absences — categories at near-zero across the full window
        (minimum window: 6 weeks of qualifying coverage)
step 4: displacement gaps — diff against diet.* memory timeline and spec 17
        drift patterns: removed category's nutrient load vs. what replaced it
step 5: confidence + dedup — drop anything previously answered (closed gaps),
        anything below evidence thresholds, anything contradicted by memory
        (e.g., user_memory already says "takes fish oil")
step 6: at most one candidate enters the shared intervention queue (spec 17 budget)
```

### Tracked Categories (v1)

Deliberately short — categories that are food-pattern-visible and well-evidenced:

| Category | Observable carriers |
|---|---|
| Omega-3 sources | fatty fish, walnuts, flax/chia, fortified products |
| Calcium carriers | dairy, fortified alternatives, canned fish with bones, leafy greens at volume |
| Fiber density | whole grains, legumes, produce volume |
| Vitamin C / fresh produce | fruit and vegetable presence at all (the starkest real-world gap) |
| Iron sources | meat, legumes, fortified grains |
| Protein variety | single-source dominance vs. variety |

Condition interactions are handed off, not handled: if the user has an active medical condition (spec 28), gap candidates touching that condition's watchlist are checked against the condition config — and anything condition-sensitive (e.g., potassium with kidney disease) is suppressed here entirely; spec 28's rules own that territory.

## Surfacing Rules

- Conversational only, mid-interaction, never a standalone push — exactly the spec 17 delivery model. The insight arrives while the user is already talking to Brioela or reading a relevant verdict.
- Evidence always attached, window always named, observation framing always used.
- One question, one answer, permanent memory. Closed gaps are closed: `memory_update(namespace: "diet.gaps", key: <category>, value: { status, reason, closed_at })`.
- A confirmed standing concern surfaces progress only through existing surfaces (meal plan composition, weekly summary line, a quiet scan-verdict note on helpful products). No new screen exists for this feature at all.

## Data Model

In the Brain DO SQLite (private):

- `nutrient_presence_window`: window_id, period_start, period_end, coverage_score, presence_map_json, computed_at.
- `nutrition_gap`: gap_id, category, gap_class (structural | displacement), evidence_json (carrier counts, window refs, displaced-source ref), confidence, status (candidate | surfaced | watching | closed), closed_reason (user_covers_elsewhere | user_declined | resolved | condition_handoff), surfaced_in (session ref), created_at, updated_at.

Standing concerns and closures are mirrored as `user_memory` entries under `diet.gaps` so every downstream surface (plan, scanner, Mira context) sees them through the normal memory injection path (spec 09) — no special integration reads `nutrition_gap` directly.

## Technical Constraints

- The presence classification uses the shared product corpus (Supabase) nutrient data already consumed by the scanner — no new external data source. Items without nutrient data count toward coverage honestly as "unclassifiable" and lower the coverage score rather than silently distorting the map.
- The detection pass is bounded: one structured LLM call at most (for displacement reasoning), the rest is counting queries against local SQLite.
- Shared intervention budget with spec 17 is a hard rule, enforced in the queue, not by convention.
- Cold start: the feature is structurally silent for at least the first 6 weeks of qualifying coverage. This must not be "fixed."

## Tier Placement

Negative Space Nutrition is part of the full personal memory and behavioral layer — Core tier and above (spec 19), same placement as behavioral pattern detection. Nothing about it is safety-critical (safety constraints are spec 07's and never gated), so the Core placement is consistent.

## Privacy

- Entirely private Brain DO computation over data the user already produced. Nothing here is shared, aggregated, or contributed anywhere.
- Gap records and closures appear in "what Brioela knows about me" (spec 34) and are individually deletable; deleting a closed gap genuinely reopens nothing — deletion is deletion.
- Condition-sensitive suppression (see above) prevents this feature from ever speaking about nutrients that are medically loaded for this specific user.

## Success Metrics

- Gap confirmation rate (user confirms the gap is real vs. explains it away) — the core accuracy metric; a high "I eat that elsewhere" rate means the coverage gate is too loose.
- Standing-concern close rate: confirmed gaps that the observed stream later shows filled.
- Meal plan influence: plans generated with an active concern that include carrier recipes, and their acceptance rate.
- Dismissal/annoyance signals per spec 17 (an insight category dismissed twice auto-suppresses, spec 23 rules).
- Coverage floor calibration: share of users who ever clear the floor (if tiny, the floor is too strict; if near-universal, too loose).
