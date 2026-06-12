# Feature 50 — Kin — Draft index

Production snapshots for review. **None of these files exist in `backend/`, `shared/`, or `mobile/` yet.**

| Draft file | Target production path | Gap ID |
|---|---|---|
| `kin.serving.gates.constant.gap.md` | `shared/constants/kin/kin.serving.gates.constant.ts` | G26 |
| `kin.cluster.supabase.schema.gap.md` | `shared/drizzle/schema/kin.cluster.schema.ts` | G3 |
| `product.kin.response.supabase.schema.gap.md` | `shared/drizzle/schema/kin.product.response.schema.ts` | G4 |
| `kin.state.schema.gap.md` | `backend/src/agents/brain/_schemas/kin.state.schema.ts` | G1 |
| `kin.contribution.log.schema.gap.md` | `backend/src/agents/brain/_schemas/kin.contribution.log.schema.ts` | G2 |
| `kin.fingerprint.vector.schema.gap.md` | `shared/validator/kin/kin.fingerprint.vector.schema.ts` | G27 |
| `kin.contribution.payload.schema.gap.md` | `shared/validator/kin/kin.contribution.payload.schema.ts` | G27 |
| `kin.routes.gap.md` | `shared/routes/kin.routes.ts` | G9 |
| `compute.kin.fingerprint.helper.gap.md` | `backend/src/agents/brain/_helpers/kin/compute.kin.fingerprint.helper.ts` | G5 |
| `assign.kin.cluster.helper.gap.md` | `backend/src/agents/brain/_helpers/kin/assign.kin.cluster.helper.ts` | G6 |
| `passes.kin.serving.gates.helper.gap.md` | `backend/src/agents/brain/_helpers/kin/passes.kin.serving.gates.helper.ts` | G11 |
| `format.kin.verdict.row.helper.gap.md` | `backend/src/agents/brain/_helpers/kin/format.kin.verdict.row.helper.ts` | G13 |
| `format.kin.flattest.alternative.helper.gap.md` | `backend/src/agents/brain/_helpers/kin/format.kin.flattest.alternative.helper.ts` | G23 |
| `enqueue.kin.contribution.helper.gap.md` | `backend/src/agents/brain/_helpers/kin/enqueue.kin.contribution.helper.ts` | G8 |
| `withdraw.kin.contributions.helper.gap.md` | `backend/src/agents/brain/_helpers/kin/withdraw.kin.contributions.helper.ts` | G20 |
| `opt.in.kin.handler.gap.md` | `backend/src/agents/brain/_handlers/kin/opt.in.kin.handler.ts` | G15 |
| `opt.out.kin.handler.gap.md` | `backend/src/agents/brain/_handlers/kin/opt.out.kin.handler.ts` | G15 |
| `run.kin.cluster.assignment.pass.handler.gap.md` | `backend/src/agents/brain/_handlers/kin/run.kin.cluster.assignment.pass.handler.ts` | G7 |
| `on.glucose.window.derived.kin.handler.gap.md` | `backend/src/agents/brain/_handlers/kin/on.glucose.window.derived.kin.handler.ts` | G8 |
| `kin.contribution.route.gap.md` | `backend/src/api/kin/_handlers/post.kin.contribute.handler.ts` | G9 |
| `recompute.kin.aggregates.job.gap.md` | `backend/src/jobs/kin/recompute.kin.aggregates.job.ts` | G10 |
| `read.product.kin.response.cached.helper.gap.md` | `backend/src/core/products/read.product.kin.response.cached.helper.ts` | G12 |
| `apply.kin.verdict.overlay.helper.gap.md` | `backend/src/core/products/apply.kin.verdict.overlay.helper.ts` | G14 |
| `apply.kin.meal.plan.overlay.helper.gap.md` | `backend/src/agents/brain/_helpers/kin/apply.kin.meal.plan.overlay.helper.ts` | G22 |
| `describe.kin.cluster.plain.language.helper.gap.md` | `backend/src/agents/brain/_helpers/kin/describe.kin.cluster.plain.language.helper.ts` | G33 |
| `kin.opt.in.prompt.sheet.gap.md` | `mobile/features/kin/components/kin.opt.in.prompt.sheet.tsx` | G16 |
| `kin.transparency.section.gap.md` | `mobile/features/kin/screens/kin.transparency.section.tsx` | G18 |
| `seed.kin.cluster.centroids.job.gap.md` | `backend/src/jobs/kin/seed.kin.cluster.centroids.job.ts` | G29 |

## Cross-feature drafts (do not duplicate)

| Feature | Draft / owner |
|---|---|
| **36** | `glucose.meal.window.schema.gap.md` — Kin input; derive handler calls `on.glucose.window.derived.kin` |
| **22** | `community-health.schema.gap.md` — **separate** Postgres tables; no Kin writes |
| **24** | Scanner verdict assembly — calls `apply.kin.verdict.overlay` |
| **43** | `tier.entitlement.matrix.constant.gap.md` — `kin_row` |
| **37** | Craving skill — consumes `format.kin.flattest.alternative` |

## Critical boundary notes

- **Kin ≠ community health (22).** Different tables, opt-in flags, cohort models. Never merge pipelines.
- **Fingerprint never leaves Brain DO** — only `cluster_id` + anonymized derived metrics on contribute.
- **Serving gates are hard:** 20 samples + 100 cluster members — no admin override.
- **Reciprocity:** opt-out ends receive and contribute both directions.
- **"Metabolic Twin" is retired** — code namespace `kin` only.
- **Mesa contrast:** Kin is anonymous physiological similarity — not social, not Mesa members.
