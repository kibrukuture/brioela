# Kin — Build

Feature **50**. Production paths under `shared/drizzle/schema/kin.*.schema.ts`, `shared/constants/kin/`, `shared/validator/kin/`, `shared/routes/kin.routes.ts`, `backend/src/api/kin/`, `backend/src/jobs/kin/`, `backend/src/agents/brain/_schemas/kin.*.schema.ts`, `_handlers/kin/`, `_helpers/kin/`, `_repositories/kin.*.ts`, and `mobile/features/kin/`.

**Scope:** Brain `kin_state` + `kin_contribution_log`; fingerprint computation + monthly cluster assignment; opt-in/out + CGM-disconnect hook; QStash contribution enqueue; Worker contribution endpoint; Supabase `kin_cluster` + `product_kin_response` + hourly recompute job; serving-gate checks; cached aggregate reads; Kin verdict row formatter; scanner/meal-plan/craving/copilot consumer helpers; Connected Devices opt-in UI; passport transparency section; `kin_row` tier gate (**43**). **Not in 50 build:** `glucose_meal_window` pipeline (**36**); community health 8-table schema (**22**); scanner resolve body (**24**); `checkTierAccess` matrix (**43**); craving-decoder skill seed (**37**).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/34-kin/` (6 files) | ✓ docs only |
| `brioela-specs/47-kin.md` | ✓ spec |
| `_records/connections/30-kin-connections.md` | ✓ ledger |
| `_records/build-order/31-layer-kin.md` | ✓ ledger |
| `kin_row` in **43** draft entitlement matrix | ✓ draft only |
| Supabase `kin_cluster` / `product_kin_response` | ✗ |
| Brain `kin_state` / `kin_contribution_log` | ✗ |
| Contribution API + QStash + recompute job | ✗ |
| Kin overlay helpers | ✗ |
| Mobile opt-in + transparency UI | ✗ |
| Kin tests | ✗ |

**Zero Kin production code.** `rg 'kin_cluster|product_kin|kin_state|kin_contribution' backend/src shared/ mobile/` — no matches.

---

## File manifest

### Shared constants (**50**)

| File | Role |
|---|---|
| `shared/constants/kin/kin.serving.gates.constant.ts` | `MIN_KIN_SAMPLE_COUNT=20`, `MIN_KIN_CLUSTER_MEMBERS=100`, `MIN_WINDOWS_FOR_ASSIGNMENT=10` |
| `shared/constants/kin/kin.cluster.bounds.constant.ts` | Initial cluster count 8–16 |
| `shared/constants/kin/index.ts` | Barrel |

### Shared validators (**50**)

| File | Role |
|---|---|
| `shared/validator/kin/kin.fingerprint.vector.schema.ts` | Normalized fingerprint shape (Brain-only JSON) |
| `shared/validator/kin/kin.contribution.payload.schema.ts` | Allowed Worker contribution fields |
| `shared/validator/kin/kin.verdict.overlay.schema.ts` | Scanner overlay payload |
| `shared/validator/kin/kin.opt.in.schema.ts` | Opt-in/out RPC bodies |
| `shared/validator/kin/index.ts` | Barrel |
| `shared/routes/kin.routes.ts` | `KIN_ROUTES` |

### Supabase Postgres (**50**)

| File | Role |
|---|---|
| `shared/drizzle/schema/kin.cluster.schema.ts` | `kin_cluster` |
| `shared/drizzle/schema/kin.product.response.schema.ts` | `product_kin_response` |
| `supabase/migrations/*_kin_tables.sql` | CHECK constraints, indexes |
| `supabase/migrations/*_kin_recompute_rpc.sql` | Batch upsert / withdraw RPCs |

### Brain SQLite schemas (**50**)

| File | Role |
|---|---|
| `_schemas/kin.state.schema.ts` | `kin_state` |
| `_schemas/kin.contribution.log.schema.ts` | `kin_contribution_log` |
| `_schemas/index.ts` | Export + migration registration (**04**) |

### Brain repositories (**50**)

| File | Role |
|---|---|
| `_repositories/read.kin.state.repository.ts` | Opt-in + cluster for overlay |
| `_repositories/write.kin.state.repository.ts` | Opt-in/out, assignment updates |
| `_repositories/read.kin.contribution.log.repository.ts` | Transparency list |
| `_repositories/write.kin.contribution.log.repository.ts` | Append + delete rows |
| `_repositories/read.glucose.meal.windows.for.kin.repository.ts` | Fingerprint input (wraps **36** table) |

### Brain helpers — fingerprint + assignment (**50**)

| File | Role |
|---|---|
| `_helpers/kin/compute.kin.fingerprint.helper.ts` | Vector from derived windows |
| `_helpers/kin/assign.kin.cluster.helper.ts` | Nearest centroid; 10-window floor |
| `_helpers/kin/describe.kin.cluster.plain.language.helper.ts` | Transparency copy |
| `_helpers/kin/index.ts` | Barrel |

### Brain helpers — contribution lifecycle (**50**)

| File | Role |
|---|---|
| `_helpers/kin/enqueue.kin.contribution.helper.ts` | QStash after window derived |
| `_helpers/kin/build.kin.contribution.payload.helper.ts` | Strip to allowed fields + 7-day bucket |
| `_helpers/kin/withdraw.kin.contributions.helper.ts` | Opt-out + log deletion marks |
| `_helpers/kin/should.contribute.kin.helper.ts` | opted_in + cluster_id + confidence gates |

### Brain helpers — read path / copy (**50**)

| File | Role |
|---|---|
| `_helpers/kin/passes.kin.serving.gates.helper.ts` | 20 + 100 hard gates |
| `_helpers/kin/format.kin.verdict.row.helper.ts` | Observational copy + sample framing |
| `_helpers/kin/format.kin.flattest.alternative.helper.ts` | **37** consumer — sweet category |
| `_helpers/kin/resolve.kin.verdict.overlay.helper.ts` | Trust order vs personal (**36**) + population |
| `_helpers/kin/apply.kin.meal.plan.overlay.helper.ts` | **34** consumer — cluster vs population GI |

### Brain handlers (**50**)

| File | Role |
|---|---|
| `_handlers/kin/opt.in.kin.handler.ts` | Set opted_in; show reciprocity copy |
| `_handlers/kin/opt.out.kin.handler.ts` | Stop both directions + withdraw |
| `_handlers/kin/delete.kin.contribution.log.entry.handler.ts` | Per-item delete → withdraw |
| `_handlers/kin/run.kin.cluster.assignment.pass.handler.ts` | Monthly alarm: fingerprint + assign |
| `_handlers/kin/on.glucose.window.derived.kin.handler.ts` | Hook from **36** derive path |
| `_handlers/kin/get.kin.transparency.handler.ts` | Passport / settings payload |

### Backend API — kin module (**50**)

| File | Role |
|---|---|
| `backend/src/api/kin/kin.route.ts` | Hono mount `/api/kin` |
| `backend/src/api/kin/_handlers/post.kin.contribute.handler.ts` | Validate contribution queue |
| `backend/src/api/kin/_handlers/index.ts` | Barrel |
| `backend/src/api/kin/index.ts` | Module export |

Register in `mount.routes.handler.ts` (**01**).

### Jobs / workflows (**50**)

| File | Role |
|---|---|
| `backend/src/jobs/kin/recompute.kin.aggregates.job.ts` | Hourly Supabase batch (cron or QStash schedule) |
| `backend/src/jobs/kin/seed.kin.cluster.centroids.job.ts` | One-time / ops — initial 8–16 centroids |

### Cached product read (**50**; called from **24**)

| File | Role |
|---|---|
| `backend/src/core/products/read.product.kin.response.cached.helper.ts` | Redis TTL read of `product_kin_response` |
| `backend/src/core/products/apply.kin.verdict.overlay.helper.ts` | Merge into verdict assembly (**24**) |

### Wearables integration hook (**36** body; **50** handler)

| File | Role |
|---|---|
| `_handlers/wearables/on.cgm.disconnect.opt.out.kin.handler.ts` | CGM disconnect → Kin opt-out |
| `_handlers/wearables/derive.glucose.window.metrics.helper.ts` | **36** — call `on.glucose.window.derived.kin` at end |

### Mobile (**50**)

| File | Role |
|---|---|
| `mobile/features/kin/components/kin.opt.in.prompt.sheet.tsx` | One-question reciprocal opt-in |
| `mobile/features/kin/components/kin.connected.devices.row.tsx` | Connected Devices Kin entry |
| `mobile/features/kin/screens/kin.transparency.section.tsx` | "What Brioela knows" — status + log |
| `mobile/features/kin/hooks/use-kin-state.ts` | Brain RPC client |
| `mobile/features/kin/api/kin.api.ts` | HTTP if needed for transparency |

### Tests (**50**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_helpers/kin/compute.kin.fingerprint.helper.test.ts` | Fingerprint vector |
| `backend/src/agents/brain/_helpers/kin/passes.kin.serving.gates.helper.test.ts` | Gate floors |
| `backend/src/agents/brain/_helpers/kin/format.kin.verdict.row.helper.test.ts` | Banned predictive language |
| `backend/src/api/kin/post.kin.contribute.handler.test.ts` | Strips user_id |

---

## Acceptance criteria

### Fingerprint + assignment

- [ ] Fingerprint computed only inside Brain DO from `glucose_meal_window` derived rows — never uploaded.
- [ ] No `cluster_id` assigned until ≥10 meal windows.
- [ ] Monthly pass recomputes assignment from latest fingerprint + global centroids.
- [ ] Only `cluster_id` transmitted to contribution path — not `fingerprint_json`.

### Opt-in / opt-out

- [ ] Opt-in prompt shown only after CGM connected **and** ≥1 personal glucose correlation displayed.
- [ ] Opt-in is reciprocal — copy states both receive and contribute.
- [ ] Opt-out one tap: stops contribute + stops receive; pending contributions withdrawn.
- [ ] Declined users not re-prompted; opt-in remains in Connected Devices.
- [ ] CGM disconnect triggers automatic Kin opt-out (**36** hook).

### Contribution pipeline

- [ ] Contribution fires via QStash after window `derived` — never blocks scan/session path.
- [ ] Worker endpoint rejects payloads containing `user_id` or finer than 7-day timestamps.
- [ ] `kin_contribution_log` records product + window ref for transparency.
- [ ] Rate limiting on contribution endpoint without identity fields.
- [ ] Hourly batch recomputes `product_kin_response` and `kin_cluster.member_count`.

### Serving gates + read path

- [ ] Rows with `sample_count < 20` never returned to clients.
- [ ] Rows for clusters with `member_count < 100` never returned.
- [ ] No admin bypass of gates.
- [ ] `product_kin_response` read through Redis product cache — scan p95 unchanged vs baseline.

### Verdict overlay (**24** consumer)

- [ ] Trust order: personal glucose (**36**) → Kin → population GI.
- [ ] Disagreement copy allowed when both personal and Kin exist.
- [ ] Kin row never creates hard red alone; never overrides allergen/condition flags.
- [ ] Copy uses "usually"/"tends to" only; "will" phrasing absent from tests.
- [ ] No Kin row when gates fail — no placeholder.

### Tier gate (**43**)

- [ ] Sapor users: scan works; no Kin row.
- [ ] Luma+ with CGM + opt-in + gates: Kin row shown.
- [ ] `checkTierAccess(userId, 'kin_row')` used — not ad-hoc tier strings.

### Downstream consumers

- [ ] **34** meal plan uses cluster response when personal data absent and gates pass.
- [ ] **37** craving decoder cites flattest Kin alternative only when no cause + data exists.
- [ ] **45** in-store swap evidence uses same wording rules.

### Privacy / 22 boundary

- [ ] Kin tables separate from `community-health.schema.ts` — no shared upsert RPC.
- [ ] HealthInsightAgent does not write `product_kin_response`.
- [ ] No Kin data in Ground, Mesa, default Passport export, practitioner views.

### Transparency

- [ ] "What Brioela knows" shows opt-in status, plain cluster description, deletable contribution log.

### Tests

- [ ] Serving gate unit tests (19, 20, 99, 100, 101 boundary cases).
- [ ] Contribution payload strip test rejects `user_id`.
- [ ] Verdict formatter rejects predictive language.
- [ ] Opt-out withdraw marks contributions for recompute.

---

## Build order dependencies

| Depends on | Why |
|---|---|
| **04** Brain foundation + migrations | `kin_state`, `kin_contribution_log` |
| **36** `glucose_meal_window` | Fingerprint input + contribution trigger |
| **14** QStash / alarm dispatch | Contribution enqueue + monthly assignment pass |
| **01** Worker router + Supabase | `/api/kin`, Postgres tables |
| **24** scanner verdict assembly | Overlay mount point |
| **43** tier matrix | `kin_row` gate |

| Blocks | Why |
|---|---|
| Kin cold-start on scans | Until **50** ships, CGM users rely on personal curve only |
| **34** cluster GI fallback | Meal plan ranking |
| **37** Kin flattest note | Craving decoder step 5 |
| **45** Kin swap evidence | In-store copilot |

---

## Cross-feature drafts (do not duplicate)

| Feature | Draft / owner |
|---|---|
| **36** | `glucose.meal.window.schema.gap.md`, derive handler — calls Kin hook |
| **22** | `community-health.schema.gap.md` — **separate** from Kin tables |
| **24** | `apply.kin.verdict.overlay.helper.gap.md` in **50**; scanner wires call site |
| **43** | `tier.entitlement.matrix.constant.gap.md` — `kin_row` |
| **37** | `format.kin.flattest.alternative.helper.gap.md` — consumer only |

---

## Draft folder

See `draft/gap-index.md` — **28** production snapshot files.
