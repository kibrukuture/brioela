# Growth Mirror — Overview

## What This Folder Covers
Rare, specific, evidence-backed recognition that the user has become a better cook. Skill evidence is extracted from sessions Mira already runs (vision events, acoustic events, transcripts, outcomes); the weekly Brain maintenance pass maintains per-dimension trajectories; recognition surfaces conversationally under a strict budget (at most one volunteered recognition per two weeks, shared family budget with patterns/gaps). On-demand "am I getting better?" answers are honest, specific, and unbudgeted. The quietest surface: recipe difficulty framing adapts to demonstrated skill. No levels, scores, badges, streaks, or progress bars — ever.

## Status
[x] guide complete — four files written, implementation not started

## Files In This Folder

| File | Contents |
|---|---|
| `01-skill-evidence-extraction.md` | the post-session extraction target, evidence streams per dimension, difficulty normalization |
| `02-trajectory-model.md` | skill_trajectory maintenance in the weekly pass, evidence floors, agent-extensible dimensions |
| `03-recognition-budget.md` | candidate thresholds, the two-week budget, delivery moments, expiry, the no-negativity rule |
| `04-recipe-confidence-touch.md` | difficulty framing adaptation on recipe open and Mira pre-briefing |

## Specs This Folder Draws From
- `brioela-specs/53-growth-mirror.md` — the full feature spec
- `brioela-specs/38-food-time-machine.md` — the milestone-not-gamification doctrine
- `brioela-specs/11-live-vision-cooking-coach.md` + `brioela-specs/46-acoustic-cooking-intelligence.md` — evidence streams
- `brioela-specs/49-harvest.md` — the annual `craft` chapter handoff
- `brioela-specs/34-universal-visual-intake.md` — evidence discipline (claims must cite observations)

## Key Decisions From Specs
- Observation, never reward. No visible progression UI of any kind — hard rule.
- Evidence comes from cooking sessions only (what Mira witnessed), never from scan/purchase behavior.
- Seven shipped dimensions (knife work, heat control, timing/parallelism, technique vocabulary, independence, repertoire, improvisation); the agent may add user-specific dimensions (the autonomy principle) — every dimension claim must cite concrete session events.
- Difficulty normalization is mandatory: interventions per session mean nothing if the user moved from toast to croissants.
- Evidence floors: 8 sessions overall, 5 events per dimension — below them the mirror has nothing to say and says nothing (`insufficient_evidence` is an honest state).
- Budget: max one volunteered recognition per two weeks, shared conversational-insight family budget; candidates expire after 30 days (stale recognition reads as fake); generic praise is banned output.
- Never volunteer regression. Asked directly, honest but kind, including what hasn't moved.
- Zero new model passes during live sessions: extraction rides the existing post-session workflow; trajectory math rides the existing weekly maintenance alarm.
- Multi-person sessions: only the account owner's attributed actions produce evidence. Guests are never skill-profiled.
- Chef tier+ (where the evidence lives); no teaser — a feature about being witnessed cannot be previewed.

## What This Folder Depends On
- `08-cooking-session` — session events and the post-session workflow (extraction rides it)
- `33-acoustic-cooking` — acoustic evidence stream (heat control)
- `05-brain` / `06-brain-memory` — weekly maintenance pass, memory events, trajectory storage
- `30-mira` — conversational delivery rules

## What Depends On This Folder
- `36-harvest` — the `craft` chapter draws the year's strongest arc
- `27-generative-grammar` — recipe-card context consumes demonstrated-skill framing
