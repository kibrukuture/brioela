# 51. Tonight — The Zero-Decision Dinner Answer

## Goal

Once a day, at the right moment in the late afternoon, give the user one card with one answer to the most repeated question in domestic life: what's for dinner tonight. One dish. Already possible with what is in the kitchen. Already matched to who is eating, how much time there is, and how the user's day actually went. One tap starts cooking.

## Why This Exists

Spec 33 solves the planned week — user-initiated, "plan my week," seven days at once. Spec 14 solves the urgent now — "what can I make right now with what I have." Neither covers the daily ambient case: the 5pm decision-fatigue moment that arrives every single day whether or not the user planned anything, and that no user reliably remembers to ask about (spec 00's second law: a feature that requires the user to remember to use it will be abandoned).

Brioela holds everything needed to answer it without being asked: pantry state and purchase rhythms (specs 33, 36), recipe history and preferences (spec 08), constraints and conditions (specs 07, 28), Mesa audience (spec 41), time-of-day cooking patterns (spec 17), physiological readiness where wearables exist (spec 40 already specifies exactly this modulation: low readiness → nourishing, low-effort meals), and the active meal plan if one exists. "Tonight" is the purest possible expression of the ambient law: the answer arrives, unasked, at the moment the question forms.

## User Outcome

- At the user's personal dinner-decision time (learned, not configured — see Timing), one card appears: **"Tonight: misir wot. 35 minutes. Everything's in your kitchen."**
- Sub-line when relevant, drawn from real signals: "Kept it easy — looks like a low-energy day." / "Works for everyone eating tonight." / "Uses the spinach before it turns."
- Three responses, all one gesture:
  - **Cook it** → Mira session starts pre-loaded (spec 10), or the recipe opens for non-voice tiers.
  - **Swap** → exactly two alternatives (same at-home ingredients where possible — the spec 33 swap logic). Never a list to browse; browsing is the failure mode this feature exists to kill.
  - **Not tonight** → card dismisses silently. No follow-up, no "are you sure," nothing until tomorrow.
- If a weekly plan (spec 33) is active, Tonight is simply that plan's slot for today, restated with current-context adjustments — the two features converge instead of competing.

## In Scope

- Daily single-answer generation from existing state — pantry, history, constraints, audience, plan, readiness, time budget.
- Learned delivery timing per user.
- The three-response card as the only surface. In-app ambient card always; push only within strict spec 23 limits (see Delivery).
- Convergence rule with the active meal plan.
- Silent learning from responses (accepted, swapped, dismissed, cooked-to-completion).

## Out of Scope

- Breakfast and lunch. Dinner is the universal decision-fatigue meal; expanding dilutes the single-moment discipline. (Users whose history shows dinner is not their cooking meal get Tonight at their actual cooking meal — the meal is learned, the principle of one answer per day is fixed.)
- Restaurant or delivery suggestions. Tonight answers with cooking. It is not a discovery surface.
- Any configuration: no preferences screen, no "set your dinner time," no cuisine pickers (spec 00 zero-form law — every input is learned or already known).
- Multiple daily cards, re-prompts, or "you didn't cook yesterday" nudges. One card, once, silence after.

## The Answer Selection

Generation runs in the Brain DO shortly before the user's delivery time (alarm-scheduled, spec 09):

```text
1. audience      — active Mesa audience for tonight if known (spec 41),
                   else the user; full constraint clearance is non-negotiable
                   (specs 07, 28) — same hard filter as spec 33
2. inventory     — pantry estimate (specs 33/36): prefer dishes fully covered
                   by what is at home; expiring items rank first (waste rule)
3. time budget   — tonight's realistic cooking window from spec 17 patterns
                   (weekday vs weekend, observed session start times) and
                   calendar context where granted (spec 22 signal source)
4. state         — readiness/sleep from health.biometrics when present
                   (spec 40): low readiness biases simple + nourishing;
                   high-activity day biases substantial
5. pool          — recipes made and liked > saved > new-but-near
                   (the spec 33 pool order); variety guard against the
                   last 3 days of cooked history
6. answer        — one dish + exactly two pre-computed swaps
```

If the inventory cannot cover anything acceptable, the card is honest and still one answer: "Tonight: pasta e ceci — if you grab one can of chickpeas on the way home." A single-item pickup is permitted; a shopping trip is not — that is the meal plan's job.

If no answer clears the bar (empty kitchen, no history, coverage too thin), **no card appears**. Silence over filler, always (spec 00).

## Timing

The delivery moment is learned per user:

- Cold start: a reasonable default window (late afternoon, local time), in-app card only — no push at all for the first two weeks.
- Learning: actual cooking session start times, recipe opens, and historical scan-the-fridge moments (spec 17 time-of-day patterns) converge the delivery time toward ~45–90 minutes before the user's real decision moment.
- Quiet hours, active-session suppression, and one-medium-push-per-day rules all apply unchanged (spec 23). Tonight competes for the same daily medium-priority slot as everything else — on a day a price alert mattered more, Tonight is in-app only.

## Learning Loop

Every response teaches, silently:

- **Cooked to completion** (session ended normally) — strongest positive; dish and its context (day type, time budget, audience) reinforce.
- **Swapped** — the chosen swap's attributes are preferred over the original's; consistent swap directions (always toward faster, always away from a cuisine) become ranking signals and eventually spec 17-grade patterns.
- **Dismissed** — weak negative for the dish; repeated dismissal of the card itself triggers the spec 23 suppression ladder (twice ignored → category quiets for 14 days; the user who hates this feature stops getting it without ever finding a setting).
- All signals flow through the standard event log (`memory_event`, spec 08) — Tonight reads and writes the same spine as everything else.

## Data Model

In the Brain DO SQLite (private):

- `tonight_answer`: answer_id, date_local, recipe_id, swap_recipe_ids_json, reasoning_tags_json (inventory_covered | expiring_item | low_readiness | mesa_audience | plan_slot | time_budget), delivered_at, delivery_channel (in_app | push), response (cooked | swapped | opened | dismissed | ignored), responded_at.

One row per day maximum. The table doubles as the learning history and the suppression-ladder evidence.

## Technical Constraints

- Generation is one structured LLM call at most over locally assembled context (the spec 33 pattern, smaller scope); target generation latency irrelevant (it runs ahead of delivery), card open is instant from the stored answer.
- The card is a generative-grammar surface (spec 42): a low-energy Tuesday card and a Saturday cook-up card should feel different. Static base renders first as always.
- Convergence rule is strict: an active spec 33 plan slot for today is the answer (re-validated against current inventory and readiness); Tonight never contradicts the plan with a competing suggestion. If re-validation fails (ingredient gone), Tonight serves the adjusted answer and updates the plan slot.
- Mesa audience inference is conservative: it uses an explicitly active audience or recurring-pattern memory (spec 37 promotion) — it never guesses who is eating tonight from thin air.

## Tier Placement

Tonight is Core tier and above (spec 19) — it is the daily face of the personal memory and planning layer that Core pays for. Free users see nothing (no teaser cards in the daily flow; a one-time mention may appear in onboarding's natural upgrade surfaces per spec 19's trigger philosophy). The Cook-it handoff opens a Mira voice session on Chef+; on Core it opens the recipe in standard cooking view.

## Privacy

- Entirely private computation; the answer and the learning history live in the Brain DO only.
- Calendar-derived time budget uses the existing optional calendar grant (spec 22) and stores only the derived "tight evening / open evening" signal, never event contents.
- Readiness signals are read from existing `health.biometrics` memory (spec 40) — the card's sub-line says "looks like a low-energy day," never names a metric, and never appears in any share surface (there is no share on Tonight).

## Success Metrics

- Answer acceptance rate (cooked or swapped-then-cooked) — the headline metric; target trajectory matters more than the absolute (the loop should visibly learn).
- Cooked-to-completion rate of accepted answers.
- Swap rate direction over time (falling swap rate = the model is learning; per spec 33's same logic).
- Dismissal and suppression-trigger rates (the annoyance ceiling).
- Day-of-week coverage: share of eligible days where an answer cleared the generation bar.
- Retention delta for users with 4+ accepted answers per month vs. matched baseline.
