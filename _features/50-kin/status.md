# Status

open

**Kin not shipped.** Build-guide **34-kin** is complete (6 files, docs only). Zero Brain `kin_state` / `kin_contribution_log` tables, zero Supabase `kin_cluster` / `product_kin_response`, zero contribution API, zero QStash pipeline, zero aggregate recompute job, zero fingerprint/assignment helpers, zero verdict overlay, zero mobile opt-in UI, zero tests. Partial: `kin_row` `FeatureAction` draft in **43** only; cross-feature specs reference Kin consumers (**36**, **37**, **45**).

# Shipped in backend (partial / unrelated)

- [x] `build-guide/34-kin/` (6 files) — docs complete (renamed from `34-metabolic-twin/`)
- [x] `brioela-specs/47-kin.md` — primary spec (Kin; Metabolic Twin retired)
- [x] `_records/connections/30-kin-connections.md` — ledger
- [x] `_records/build-order/31-layer-kin.md` — layer deps
- [x] `_features/43-pricing-tiers/draft/tier.entitlement.matrix.constant.gap.md` — `kin_row: LUMA`
- [ ] `kin_state` / `kin_contribution_log` Brain schemas
- [ ] `kin_cluster` / `product_kin_response` Supabase schemas + migrations
- [ ] Fingerprint + cluster assignment helpers
- [ ] Opt-in / opt-out handlers
- [ ] QStash contribution enqueue + `POST /api/kin/contribute`
- [ ] Hourly aggregate recompute job
- [ ] Serving gate helpers
- [ ] Verdict overlay + cached product read
- [ ] Meal plan / craving / copilot consumer helpers
- [ ] Mobile opt-in sheet + transparency section
- [ ] CGM disconnect → Kin opt-out hook
- [ ] Kin tests

# Blocked by

- **36-wearables** — `glucose_meal_window` derived values (only Kin input)
- **04-brain-foundation** — Brain SQLite migrations
- **01-platform-foundation** — Worker `/api/kin`, Supabase, QStash
- **14-brain-alarm-dispatch** — monthly assignment pass alarm
- **24-scanner** — verdict overlay mount point
- **43-pricing-tiers** — `kin_row` entitlement wiring

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `kin_state` Brain schema | `rg kin_state backend/src/agents/brain/_schemas` — zero |
| G2 | No `kin_contribution_log` Brain schema | spec **47** — not started |
| G3 | No `kin_cluster` Supabase schema | `rg kin_cluster shared/drizzle` — zero |
| G4 | No `product_kin_response` Supabase schema | spec **47** — not started |
| G5 | No `compute.kin.fingerprint` helper | `01-fingerprint-and-clustering.md` — missing |
| G6 | No `assign.kin.cluster` helper | 10-window floor unwired |
| G7 | No monthly `run.kin.cluster.assignment.pass` handler | spec **47** monthly alarm — missing |
| G8 | No `enqueue.kin.contribution` QStash path | `03-contribution-pipeline.md` — missing |
| G9 | No `POST /api/kin/contribute` endpoint | Worker route absent |
| G10 | No hourly `recompute.kin.aggregates` job | spec **47** batch cadence — missing |
| G11 | No `passes.kin.serving.gates` helper | 20 + 100 floors unwired |
| G12 | No cached `read.product.kin.response` helper | `04-verdict-overlay.md` Redis path — missing |
| G13 | No `format.kin.verdict.row` helper | Wording discipline unwired |
| G14 | No `apply.kin.verdict.overlay` in scanner | **24** trust order — missing |
| G15 | No `opt.in.kin` / `opt.out.kin` handlers | `05-opt-in-opt-out.md` — missing |
| G16 | No opt-in prompt UI (value-first timing) | Mobile — zero |
| G17 | No Kin row in Connected Devices | **36** settings surface — missing |
| G18 | No transparency section (status + log + delete) | **47** consumer — missing |
| G19 | No CGM disconnect → Kin opt-out hook | spec **40** / `05-opt-in-opt-out.md` — missing |
| G20 | No `withdraw.kin.contributions` on opt-out | Reciprocal withdrawal — missing |
| G21 | No `kin_row` tier gate wired | **43** draft matrix only |
| G22 | No `apply.kin.meal.plan.overlay` (**34**) | Cluster GI fallback — missing |
| G23 | No `format.kin.flattest.alternative` (**37**) | spec **52** step 5 — missing |
| G24 | No in-store Kin swap evidence (**45**) | build-guide dep — missing |
| G25 | Zero Kin production code | `rg kin_cluster\|product_kin\|kin_state backend/src shared/ mobile/` — zero |
| G26 | No `shared/constants/kin/` serving floors | Constants not codified |
| G27 | No `shared/validator/kin/` | Contribution payload validation missing |
| G28 | No Kin tests | `rg kin *.test.ts` — zero |
| G29 | No initial centroid seed job | 8–16 cluster bootstrap — missing |
| G30 | **50 vs 22 boundary not enforced in code** | No guards preventing HealthInsight writes to Kin tables |
| G31 | Session **038** `34-metabolic-twin/` historical name | Current folder `34-kin/` — ledger uses Kin |
| G32 | `glucose_meal_window` not shipped (**36** G-blocker) | Kin has no input data pipeline |
| G33 | No `describe.kin.cluster.plain.language` helper | Transparency copy — missing |
| G34 | No contribution log per-item delete handler | spec **47** deletable log — missing |
| G35 | No rate limit on contribution endpoint | `03-contribution-pipeline.md` abuse surface — missing |

# 50 vs neighbor boundaries

| In **50** (this feature) | In separate feature |
|---|---|
| Fingerprint, cluster_id assignment, kin_state | `glucose_meal_window` DDL + derive (**36**) |
| Kin Supabase aggregates + recompute | Community health 8 tables (**22**) |
| Contribution anonymization + gates | HealthInsightAgent Pass 3 (**22**) |
| Kin verdict row + copy helpers | Scanner orchestration (**24**) |
| Opt-in/out + reciprocity | Connected Devices shell (**36**) |
| `kin_row` FeatureAction | `checkTierAccess` (**43**) |
| Transparency content | Passport UI shell (**47**) |
| Flattest-alternative line | Craving-decoder skill (**37**) |
| Cluster GI ranking input | Meal plan generator (**34**) |
| Swap evidence line | In-store copilot session (**45**) |

# Obsolete / conflicts

| Item | Note |
|---|---|
| **"Metabolic Twin"** product name | Retired in `brioela-specs/47-kin.md`; session **038** table is historical |
| `build-guide/34-metabolic-twin/` | Renamed to `34-kin/` — do not recreate old folder |
| `anonymous_health_groups` | **22** cohort — must not substitute for `kin_cluster` |
| Spec **47** "Core tier" | Same as **Luma** in **43** naming — not a conflict |
| User task "Luma+ for Kin per notifications spec" | **43** `kin_row` → Luma; spec **47** Core+ — aligned; notifications spec does not gate Kin push (in-verdict only) |

# Sources

- `brioela-specs/47-kin.md`
- `build-guide/34-kin/` (all 6 files)
- `_records/connections/30-kin-connections.md`
- `_records/build-order/31-layer-kin.md`
- `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- `_features/36-wearables/spec.md`
- `_features/22-health-intelligence/spec.md`
- `_features/37-craving-decoder/spec.md`
- `_features/43-pricing-tiers/spec.md`
