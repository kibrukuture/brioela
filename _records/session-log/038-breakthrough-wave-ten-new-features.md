# Session 038 — Breakthrough Wave: Ten New Feature Specs and Build Guides

## Date

2026-06-10

## Completed This Session

Read the full spec corpus (all 43 brioela-specs, implementable-specs including bela and cooking-session, build-guide rules and conventions, gathering-data idea docs), then specced and build-guided ten new breakthrough features. Every feature is a connection across existing systems — read-paths over data the Brain already holds — not a new standalone system.

### New specs (brioela-specs/44–53)

| Spec | Feature | One line |
|---|---|---|
| 44 | Dish Recreation | plate photo → reconstructed personalized recipe → Ground sourcing → Bela → Mira first-cook refinement |
| 45 | In-Store Co-Pilot | Bela's shopper AI pointed at the user's own grocery run; audio-only Mira shop session |
| 46 | Acoustic Cooking Intelligence | kitchen sound as cooking-state evidence in existing audio sessions; zero new pipeline |
| 47 | Metabolic Twin | anonymized glucose-response clusters; k-anonymity floors (20 samples / 100 members) are hard serving gates |
| 48 | Food Inheritance | Family Cookbook: heritage recipes + style profiles as copies to family; succession; receiving free always |
| 49 | Year in Food | anniversary-timed annual artifact; generative grammar; source_queries_json traceability mandatory |
| 50 | Negative Space Nutrition | structural absences + displacement gaps; coverage gate keeps it honest; shares spec 17 budget |
| 51 | Tonight | the daily zero-decision dinner card; strict convergence with spec 33 plans; learned timing |
| 52 | Craving Decoder | evidence-based craving answers as a system skill; "no pattern" is a designed frequent answer |
| 53 | Growth Mirror | skill trajectories from session evidence; budgeted recognition; no gamification ever |

### Existing specs updated (append-only cross-reference sections)

- `README.md` — new "Breakthrough Layer (Second Wave)" section listing 44–53
- `10` — Acoustic Awareness section (→46); `11` — Acoustic Evidence Fusion (→46, evidence_source column)
- `17` — Related Specs: shared budget with 50/53, craving loop with 52
- `25` — Second-Wave Shareable Moments (44, 49)
- `32` — Inheritance (→48); `33` — Daily Ambient Surface (→51)
- `34` — Dish Recreation third explicit path (→44, intent boundary)
- `38` — Annual Composition (→49) and Growth Distinction (→53)
- `40` — Downstream Consumers (→47, 51, 52)

### New build-guide folders (31–40, per 00-rules.md)

- `31-dish-recreation/` (6 files), `32-in-store-copilot/` (6), `33-acoustic-cooking/` (4), `34-metabolic-twin/` (6), `35-food-inheritance/` (5), `36-year-in-food/` (5), `37-negative-space-nutrition/` (4), `38-tonight/` (4), `39-craving-decoder/` (4), `40-growth-mirror/` (5)
- Every overview has the Rule 5 dependency sections; detail files are single-responsibility per Rule 3.

### Records

- `_records/connections/27–36` — one connection file per feature, bidirectional spec↔guide, all marked done (guides written)
- `_records/build-order/28–37` — one layer file per feature with dependencies
- Both `00-how-to-use.md` index lists updated. Cross-layer note recorded: layer 33 (Year in Food) consumes layer 37 (Growth Mirror) as an optional input only.

## Key Decisions

- Tier placements: 44 Chef (capture always free-stored), 45 Chef (shared voice allowance), 46 ships with audio sessions Chef+ (capability, not gate), 47 Core+ deliberately (network > gate), 48 receive-free/send-Chef, 49 free for everyone (viral artifact), 50/51/52 Core+, 53 Chef+ (evidence lives there).
- Shared implementations, not forks: in-store constraint checks = bela/03 code; Tonight = spec 33 inventory/pool/constraints; acoustic events = vision_event rows with evidence_source.
- Honesty gates as first-class design: coverage gate (50), "no pattern" floor (52), insufficient_evidence (53), verdict agreement rate (47), source_queries_json (49), no-card-over-filler (51).
- One conversational-insight family budget across 17/50/52(passive part)/53 — enforced in the queue, never two insights in a week.
- Sensitivity exclusions hardened at the candidate/write layer (49 chapters, 52 craving data sensitive-class, 53 guests never profiled).
- No gamification anywhere (38 doctrine), no social surfaces (35 law), no diagnosis language (30 boundary) — all ten features comply by construction.

## Files Added

10 spec files (brioela-specs/44–53), 49 build-guide files (folders 31–40), 10 connection files, 10 build-order files, this session log.

## Files Modified

brioela-specs: README.md, 10, 11, 17, 25, 32, 33, 34, 38, 40 (append-only sections). _records: connections/00-how-to-use.md, build-order/00-how-to-use.md (list updates).

## Verification

- All new spec files follow house structure (Goal / Why This Exists / User Outcome / mechanics / Data Model / Technical Constraints / Tier / Privacy / Success Metrics).
- All cross-reference edits were appends; no existing content removed or reworded.
- Canonical vocabulary respected: GPT-4o mini vision extraction, Cloudflare Realtime / RealtimeKit, Gemini Live (gemini-3.1-flash-live-preview), scheduled_alarms as the product alarm ledger, OneSignal-only notifications, Supabase Auth-only.

## What Is Next

- Resolve open tier-mechanics details in `19-pricing-and-tiers.md` for the new features (session-allowance sharing for 45, Mesa-style member counts do not apply here but Chef caps may need restating).
- When building begins: add the new tools each feature needs to its feature folder per Rule 1/6 (e.g., shop-session tools, cookbook transfer tools, twin contribution tool).
- Consistency pass over the new aggregate table names (`product_cluster_response`, `metabolic_cluster`) against the health-intelligence community-table naming direction from session 037.
