# 53. Growth Mirror

## Goal

Reflect back to the user, occasionally and quietly, the thing nobody else will ever tell them: they have become a better cook. Mira has watched and heard months of sessions; the Growth Mirror turns that accumulated observation into rare, specific, evidence-backed moments of recognition — "your knife work is twice as fast as in January; you haven't burned garlic in eleven sessions."

## Why This Exists

The Food Time Machine (spec 38) surfaces what the user *ate and did*. Nothing in any spec surfaces who the user is *becoming*. Yet the raw evidence already accumulates with every session: vision events (spec 11), session transcripts and summaries (specs 10, cooking-session/07), question patterns ("what does deglaze mean?" asked in March, never since), intervention frequency, completion rates, recipe difficulty trends, improvisation moments (the same signals spec 32 mines for style and spec 09 mines for skills).

Skill growth is among the stickiest retention forces in any product, and cooking skill is real-life growth — but every existing app gamifies it into badges and streaks, which spec 38 rightly bans. The Growth Mirror is the non-gamified alternative: observation, not reward. A milestone observes something true; gamification incentivizes behavior to earn a token. This feature only ever does the former, and it makes the cooking tiers emotionally indispensable: canceling Chef would mean losing the witness to your progress.

## User Outcome

- The user cooks with Mira over weeks and months. Nothing is scored, nothing is tracked visibly, no progress bar exists anywhere.
- Occasionally — weeks apart — a recognition lands at a natural moment:
  - End of a session: "That béchamel didn't need me once. Three months ago it took us four interventions."
  - Opening a recipe once marked difficult: "Last time this felt hard. You've cooked harder since — you've got this."
  - Mid-session, sparingly, when genuinely earned: "Your onion dice has gotten properly fast."
- Asked directly — "am I getting better?" — Mira answers with specifics and evidence, warmly and honestly, including what hasn't moved: "Your heat control is dramatically better. Timing multi-dish meals is still where things wobble."
- Once a year, the strongest arc becomes a Harvest chapter (spec 49 `craft` chapter type) — the only place growth is ever composed into a shareable artifact, and only with the user's existing share controls.

## In Scope

- Passive skill-evidence extraction from sessions the user already runs: vision events, acoustic events (spec 46), transcript-derived signals (questions asked, confusion moments, confidence markers), session outcomes (completion, duration vs. recipe baseline, interventions per session), recipe difficulty progression.
- A per-dimension skill trajectory model maintained by the existing weekly Brain maintenance pass (spec 09 alarm cycle).
- Rare conversational recognition under a strict budget, plus on-demand honest answers.
- The recipe-confidence touch: difficulty framing on recipe open adapts to demonstrated skill (also feeds the spec 39 recipe-card context).
- The annual `craft` chapter handoff to spec 49.

## Out of Scope

- Any visible progression UI: levels, scores, badges, streaks, progress bars, skill trees. None of these exist, per the spec 38 doctrine, hard rule.
- Negative framing. The mirror reflects growth and answers honest questions; it never volunteers regression ("you've gotten slower"). Unasked criticism of a hobby is how an app gets deleted. Asked directly, it is honest but kind.
- Comparison to other users, ever (spec 35 anti-performance law).
- Skill assessment from scan/purchase behavior. Evidence comes from cooking sessions only — what Mira actually witnessed.

## Skill Dimensions

The trajectory model tracks a small set of observable dimensions. The agent may add user-specific dimensions over time (the spec 34 autonomy principle — traits the developer never predefined), but ships with:

| Dimension | Evidence stream |
|---|---|
| Knife work | vision events: chop speed/uniformity observations (spec 11) |
| Heat control | heat warnings + burning-onset events per active-heat minute (specs 11, 46) |
| Timing & parallelism | timer adherence, multi-dish session outcomes, step-overrun deltas |
| Technique vocabulary | definition questions asked then never re-asked (transcripts) |
| Independence | interventions + assistance requests per session, recipe-difficulty-adjusted |
| Repertoire | distinct techniques and cuisines cooked to completion |
| Improvisation | substitutions self-initiated vs. requested (the spec 32 signal class) |

Every dimension is evidence-backed: a trajectory claim that cannot cite concrete session events is not stored (the same evidence discipline as `user_personality`, spec 34).

## How the Trajectory Builds

No new pipeline. The pieces already run:

1. **During sessions** — vision/acoustic events and transcripts are already captured and stored under existing rules (specs 11, 46, cooking-session/07).
2. **At session end** — the existing post-session summarization workflow (spec 10) gains one extraction target: skill-evidence signals, written as `memory_event` rows (kind `skill_evidence`) with dimension, signal, and session ref. Same extract-then-compress pattern as everything else (spec 24).
3. **Weekly** — the Brain maintenance pass (spec 09) updates `skill_trajectory` per dimension: direction, confidence, supporting evidence refs, last-notable-change. Minimum evidence floor before any trajectory exists: 8 sessions overall, 5 evidence events per dimension — below that, the mirror has nothing to say and says nothing.
4. **Recognition candidates** — when a trajectory crosses a notability threshold (sustained improvement across 5+ sessions, a long-broken failure pattern, a first — "first multi-dish meal without a single timing intervention"), a recognition candidate enters the queue.

## Recognition Budget and Delivery

Recognition is powerful precisely because it is rare. Hard budget:

- **At most one volunteered recognition per two weeks**, sharing the conversational-insight family budget with specs 17/50 — a user never gets a pattern insight and a growth recognition in the same week.
- Delivered conversationally at natural moments only (session end, relevant recipe open) — never as a push notification, never as a standalone card (spec 23: stats and observations are in-app surfaces).
- Always specific, always evidenced, never generic praise. "Nice job tonight!" is banned output; "that's the fourth sauce in a row that came together without a rescue" is the format.
- On-demand answers ("am I getting better?") are unbudgeted — asked is asked.
- Candidates expire after 30 days unsurfaced; stale recognition reads as fake.

## The Recipe-Confidence Touch

The quietest and possibly highest-value surface: difficulty framing adapts to demonstrated skill. A recipe whose techniques the trajectory shows the user has mastered drops the warnings and pre-explains nothing (the spec 39 `familiar` energy, applied to skill); a recipe one notch above their repertoire gets framed as within reach, with Mira pre-briefed on which step deserves attention. No UI element announces this — the app simply stops talking to a competent cook like a beginner.

## Data Model

In the Brain DO SQLite (private):

- `skill_trajectory`: dimension (text, agent-extensible), direction (improving | steady | insufficient_evidence), confidence (0–1), evidence_refs_json (memory_event ids), baseline_note, latest_note, sessions_observed, updated_at.
- `growth_recognition`: recognition_id, dimension, headline, evidence_refs_json, status (candidate | surfaced | expired), surfaced_in (session ref, nullable), created_at, surfaced_at.
- `memory_event` rows, kind `skill_evidence` (existing table, spec 08).

## Technical Constraints

- Zero new model passes during live sessions — evidence extraction rides the existing post-session workflow; trajectory math rides the existing weekly maintenance alarm. Marginal cost per user per week: one small structured-extraction addition to a call that already runs.
- Difficulty-adjusted metrics are mandatory: interventions per session mean nothing if the user moved from toast to croissants. Every independence/timing signal is normalized by recipe difficulty (already in the recipe schema, spec 02).
- Trajectories are honest about sparse data: a dimension with thin evidence reports `insufficient_evidence` and the mirror never reaches ("hard to say — we haven't done much knife-heavy cooking lately").
- The recognition queue is protected from compression like other durable derived state — it lives in SQLite, not in session context.

## Tier Placement

The Growth Mirror lives where its evidence lives: Chef tier and above (spec 19), since cooking sessions are Chef. Vision and acoustic evidence make it richer on Power, but transcript- and outcome-based dimensions work from voice-only sessions. There is no separate gate and no teaser — a feature about being witnessed cannot be previewed meaningfully.

## Privacy

- All trajectory and recognition data is private Brain DO content, listed in "what Brioela knows about me" (spec 34) in plain language ("Brioela keeps notes on your cooking progress"), deletable as a category in one action.
- Growth data never appears in Ground, Mesa member views, Passport, practitioner surfaces, or any community context. The annual `craft` chapter (spec 49) is composed from it but inherits spec 49's share rules — static card, explicit share, no health-adjacent content.
- Multi-person sessions (spec 12): evidence is extracted only for the account owner from their own attributed actions; guests and family members are never skill-profiled.

## Success Metrics

- Recognition resonance: explicit positive responses or "tell me more" after a surfaced recognition (the spec 17 acceptance-rate analogue).
- On-demand rate: users asking "am I getting better?" unprompted — the sign the mirror is trusted.
- Recognition accuracy audit: sampled recognitions checked against their evidence refs (every claim must trace, the spec 49 anti-hallucination discipline applied here).
- Retention delta for users with 2+ surfaced recognitions vs. matched session-count baseline (the witness hypothesis).
- Recipe-confidence touch engagement: completion rate on one-notch-up recipes framed as within reach vs. historical baseline.
- Annoyance ceiling: recognition dismissal rate; two dismissals trigger the standard spec 23 suppression ladder for the category.
