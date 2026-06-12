# Kin — Spec

Feature **50**. Anonymized glucose-response fingerprinting and cluster matching: opted-in CGM users contribute **derived** meal-window metrics (**36**) into per-product, per-cluster Supabase aggregates; eligible users see a **Kin row** on scan verdicts, meal-plan/recipe ranking, in-store swap evidence, and craving-decoder flattest-alternative notes — always observational, always k-anonymity gated, never social.

**Not in this feature:** CGM connection, meal-window open/derive, spike-trigger memory, or `glucose_meal_window` DDL (**36** — **50** consumes derived values only); community health Postgres tables and HealthInsightAgent Pass 3 (**22** — different cohort model and purpose); scanner resolve orchestration body (**24** — Kin overlay is one extra cached read); tier matrix implementation (**43** — `kin_row` `FeatureAction` only); craving-decoder skill body (**37** — reads Kin line when no personal cause); meal plan generator (**34** — consumer of cluster GI substitute); in-store copilot swap ranking (**45** — consumer); passport UI shell (**47** — transparency section content); guard/lexicon/reading-gate tooling.

**Naming note:** Product spec `brioela-specs/47-kin.md` (spec **47**). Feature folder **50** per `_features/README.md` build order. **"Metabolic Twin" is retired** — session **038** originally used that name; all current docs use **Kin** only.

**Living catalog note:** Cluster count (8–16 coarse centroids), reference food categories for fingerprint normalization, and `FeatureAction` string `kin_row` are operational constants — tune from data; changing cluster topology is a deliberate ops event (invalidates assignments).

---

## Purpose

Personal glucose–food correlation (**36**) solves the killer problem — but cold-starts by design: three high-confidence windows per product before a reliable personal line exists. Kin applies the same anonymized-aggregate pattern as scanner community health (**01** / **22**) and illness signals (**32**) to **metabolic response curves**: people whose bodies respond similarly contribute derived window stats; new CGM users see group tendency before personal data exists. Personal data **always** outranks Kin.

1. **Fingerprint** each opted-in user inside their Brain DO from private `glucose_meal_window` derived values — fingerprint never leaves the DO.
2. **Assign** a `cluster_id` (nearest global centroid) after ≥10 meal windows; recompute monthly via Brain maintenance alarm.
3. **Contribute** derived values (cluster_id + product_id + metrics) via fire-and-forget QStash — no user_id, 7-day time buckets.
4. **Aggregate** in Supabase `product_kin_response` with hard serving gates (≥20 samples **and** cluster ≥100 members).
5. **Surface** Kin row in verdict trust order: own glucose → Kin → population GI; same wording discipline as community health.
6. **Protect** — reciprocal opt-in, instant opt-out (both directions), CGM disconnect implies opt-out, contribution log visible and deletable.

Without **50**, CGM users wait weeks for personal curves; network effect of scan + biology never compounds.

---

## Product definition

| Term | Meaning |
|---|---|
| **Kin** | Product name for anonymized metabolic-similarity layer and verdict surface — **not** "Metabolic Twin" |
| **Your Kin** | The user's assigned anonymous response cluster — never a person, never meetable |
| **Kin row** | Verdict overlay line: group tendency with sample framing (`n=…`, `…% spiked`) |
| **Metabolic fingerprint** | In-DO normalized vector from meal windows — private forever |
| **cluster_id** | Only health-derived value that leaves the Brain DO for Kin — meaningless without centroid table |
| **Contribution** | One anonymized derived-window stat row queued after window closes (opt-in + assigned cluster only) |
| **Serving gates** | Hard read-path floors: `sample_count ≥ 20` AND `member_count ≥ 100` — no admin override |
| **Reciprocity** | Opt-in = receive + contribute; opt-out = neither |

**Mesa contrast (non-negotiable product language):** Mesa is your table — people you know. Kin is your body's family — people you'll never meet. No Kin "community," matching UI, or social surfaces.

**Design principle:** The product is the center, not the person. Kin improves verdicts; it never introduces a social graph.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/34-kin/`, `brioela-specs/47-kin.md`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/22`, `24`, `34`, `36`, `37`, `43`, `45`, `47`.

| # | Component | Type | In **50**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **`kin_state` Brain table** | Brain SQLite | **Yes** | No | Opt-in flag, cluster_id, fingerprint_json, timestamps | spec **47**, `05-opt-in-opt-out.md` |
| 2 | **`kin_contribution_log` Brain table** | Brain SQLite | **Yes** | No | User-visible share log; per-row delete | spec **47**, `03-contribution-pipeline.md` |
| 3 | **`kin_cluster` Supabase table** | Postgres shared | **Yes** | No | Global centroids + member_count | `02-aggregate-tables-and-k-anonymity.md` |
| 4 | **`product_kin_response` Supabase table** | Postgres shared | **Yes** | No | Per-product per-cluster aggregates | same |
| 5 | **Compute fingerprint helper** | Brain pure fn | **Yes** | No | From `glucose_meal_window` derived rows | `01-fingerprint-and-clustering.md` |
| 6 | **Assign cluster helper** | Brain pure fn | **Yes** | No | Nearest centroid; ≥10 windows floor | same |
| 7 | **Monthly cluster assignment pass** | Brain alarm handler | **Yes** | No | DO maintenance cycle | spec **47** |
| 8 | **Enqueue contribution (QStash)** | Brain → Worker | **Yes** | No | After window `derived` if opted in | `03-contribution-pipeline.md` |
| 9 | **Contribution HTTP endpoint** | Worker | **Yes** | No | Validate, strip fields, 7-day bucket, rate limit | same |
| 10 | **Aggregate recomputation job** | Supabase scheduled | **Yes** | No | Hourly batch | spec **47** |
| 11 | **Withdraw contributions on opt-out** | Brain + batch | **Yes** | No | Pending + log deletes → recompute | `05-opt-in-opt-out.md` |
| 12 | **Serving gates checker** | Shared pure fn | **Yes** | No | Every read path | `02-aggregate-tables-and-k-anonymity.md` |
| 13 | **Cached `product_kin_response` read** | Scanner helper | **Yes** | No | Upstash Redis product cache TTL | `04-verdict-overlay.md`, **24** |
| 14 | **Format Kin verdict row** | Copy helper | **Yes** | No | "usually" / "tends to"; sample framing | spec **47**, spec **01** |
| 15 | **Apply verdict overlay** | Scanner consumer | **Partial** | No | Trust order vs personal + population | **24** calls **50** helper |
| 16 | **Meal plan / recipe Kin fallback** | **34** consumer | **Cross** | No | Cluster response replaces population GI | spec **47**, `04-verdict-overlay.md` |
| 17 | **In-store swap Kin evidence** | **45** consumer | **Cross** | No | Same wording rules | `00-overview.md` deps |
| 18 | **Craving flattest-alternative note** | **37** consumer | **Cross** | No | When no cause + sweet category | spec **52** step 5 |
| 19 | **Kin opt-in prompt** | Mobile sheet | **Yes** | No | After CGM + ≥1 personal correlation shown | `05-opt-in-opt-out.md` |
| 20 | **Kin opt-in/out handlers** | Brain RPC | **Yes** | No | Connected Devices + reciprocity | same |
| 21 | **CGM disconnect → Kin opt-out** | **36** hook | **Cross** | No | Automatic on disconnect | spec **40**, `05-opt-in-opt-out.md` |
| 22 | **Transparency: "what Brioela knows"** | **47** consumer | **Cross** | No | Status, plain cluster description, log | spec **47** |
| 23 | **`kin_row` tier gate** | **43** consumer | **Cross** | No | Luma+ (`Core` spec alias); Sapor = no row | **43** matrix, spec **47** |
| 24 | **Kin constants / floors** | Shared constants | **Yes** | No | 10/20/100 floors, cluster count bounds | build-guide **34-kin** |
| 25 | **Kin tests** | Tests | **Yes** | No | Gates, anonymization strip, trust order | — |

### Shipped in repo today (Kin-related)

- `build-guide/34-kin/` — **6 files complete** (docs only; folder renamed from `34-metabolic-twin/` per session **038** → Kin rename).
- `brioela-specs/47-kin.md` — primary spec (was "Metabolic Twin" in session **038** table).
- `_records/connections/30-kin-connections.md`, `_records/build-order/31-layer-kin.md`.
- `_features/43-pricing-tiers/` — `kin_row` in draft `tier.entitlement.matrix.constant.gap.md` (`minimumTier: LUMA`).
- **`rg 'kin_cluster|product_kin|kin_state|kin_contribution' backend/src shared/ mobile/`** — zero product matches.
- **No** Supabase Kin tables, Brain Kin schemas, contribution endpoint, aggregate job, mobile opt-in UI, or Kin overlay helpers.

---

## Architecture

```text
glucose_meal_window closes [36]
        │
        ▼ (if kin_state.opted_in && cluster_id)
Brain DO — compute fingerprint (private)
        ├── monthly pass → assign nearest kin_cluster centroid → store cluster_id only outbound identity
        └── enqueue QStash → POST /api/kin/contribute
                    │
                    ▼ validate + strip (no user_id) + 7-day bucket
              contribution queue → hourly Supabase batch
                    │
                    ▼
              product_kin_response (+ kin_cluster member_count maintenance)

Scan / plan / craving / copilot read path [24, 34, 37, 45]
        │
        ├── checkTierAccess(kin_row) [43] — Luma+
        ├── load user cluster_id from kin_state (Brain RPC)
        ├── Redis-cached product_kin_response lookup
        ├── passesKinServingGates(sample_count, member_count)?
        └── format Kin row OR silence (no placeholder)

Trust order at verdict:
  1. user's own glucose history [36]     ← always wins
  2. Kin cluster response [50]           ← cold start
  3. population glycemic data            ← generic fallback
```

**Core rule:** Raw glucose curves never leave the Brain DO. Kin consumes only **already-derived** window values (peak delta, time-to-peak, AUC, etc.).

---

## Metabolic fingerprint (Brain DO, private)

Computed inside the user's Brain DO from `glucose_meal_window` derived values (**36**). Normalized vector includes:

- Typical peak delta across high-glycemic reference categories (refined carbs, white rice, fruit juice, bread).
- Typical time-to-peak and return-to-baseline speed.
- Fasting baseline band.
- Response variance (stable vs volatile responder).

| Rule | Value |
|---|---|
| Assignment floor | ≥ **10** meal windows — below: no cluster, no contribution, no Kin row |
| Assignment method | Nearest centroid from global `kin_cluster` |
| Reassignment cadence | Monthly Brain DO alarm cycle as fingerprint matures |
| What leaves the DO | **`cluster_id` only** — not fingerprint_json |

Cluster topology: start **8–16** coarse clusters; re-tuning is ops event (invalidates assignments), not continuous.

---

## Supabase aggregate tables (shared, anonymous)

Same boundary class as `product_community_health_summary` (**01** / **22**) — **separate tables and pipeline** from `anonymous_health_groups`.

### `kin_cluster`

```sql
kin_cluster (
  cluster_id        text primary key,
  centroid_json     text not null,
  member_count      integer not null,
  updated_at        timestamptz
)
```

### `product_kin_response`

```sql
product_kin_response (
  product_id        text,
  cluster_id        text,
  sample_count      integer not null,
  spike_rate        real,
  median_peak_delta real,
  median_auc        real,
  updated_at        timestamptz,
  primary key (product_id, cluster_id)
)
```

### Anonymization (write path — enforced, not convention)

| Allowed on contribution | Forbidden |
|---|---|
| `cluster_id`, `product_id`, derived metrics | `user_id`, hashed user_id |
| 7-day time bucket | Finer timestamps |
| — | Raw curves, window_id in aggregate store |

### Serving gates (read path — hard)

A row is **readable** only when:

- `sample_count >= 20` distinct contribution events, **AND**
- cluster `member_count >= 100`

Below either floor: row may exist in DB but **serves no one**. No admin override, no beta exception.

---

## Contribution pipeline

1. Meal window reaches `derived` status (**36**).
2. If `kin_state.opted_in` and `cluster_id` present → fire QStash contribution (non-blocking).
3. Worker endpoint validates shape, strips disallowed fields, applies 7-day bucket, rate-limits per token (abuse surface without identity).
4. Brain appends `kin_contribution_log` (product, window ref, contributed_at) — visible in transparency UI.
5. Hourly Supabase batch recomputes aggregates.
6. Opt-out / log deletion marks rows withdrawn; next batch recomputes without them.

Failure on contribution path may fail silently — aggregates are statistics; private DO data is source of truth for user's own experience.

---

## Verdict integration and copy

**Trust order** (spec **47**, `04-verdict-overlay.md`):

```text
1. user's own glucose history for this product (36)
2. Kin cluster response (if gates pass)
3. population glycemic data
```

When 1 and 2 disagree, both may show: *"Your own data: flat. (Your group tends to spike — you're an exception on this one.)"*

**Wording rules** (same discipline as community health, spec **01**):

- Group tendency: "usually", "tends to", "for people like you" + sample framing.
- Never causal, clinical, or predictive ("will spike" banned).
- May add caution or reassurance; may **not** override allergen/condition flags; may **not** create hard red block by itself.
- **No data → no row** — never a placeholder.

**Read path:** `product_kin_response` via standard Upstash Redis product cache — one extra lookup; 3-second scan target unchanged.

**Downstream consumers (read only):**

| Feature | Use |
|---|---|
| **24** Scanner | Kin row in verdict payload |
| **34** Pantry/meal plan | Cluster response instead of population GI when personal data absent |
| **45** In-store copilot | Swap evidence |
| **37** Craving decoder | Flattest-alternative note when no personal cause |

---

## Opt-in, opt-out, transparency

### Opt-in

- One reciprocal question: use anonymous response data from metabolically similar people; contribute yours anonymously in return.
- Asked **only after** working CGM connection **and** user has seen ≥1 personal glucose correlation (value first — spec **21** pattern).
- Never re-asked after decline; option lives in Connected Devices (**36** settings surface).

### Opt-out

One tap in Connected Devices:

- Stop contributing immediately.
- Withdraw pending contributions; aggregates recompute next batch.
- Stop receiving Kin rows — reciprocity ends **both directions** (stated plainly).

### Automatic opt-out

- CGM disconnect (**36**) implies Kin opt-out.

### Transparency (`kin_contribution_log` + **47**)

Shows: opted-in status; cluster in plain language (e.g. "your responses are pooled with people who spike fast on refined carbs and recover quickly"); full contribution log with per-item deletion.

### Export / other surfaces

No Kin data in Ground, Mesa, Passport export by default, practitioner views, or Harvest.

---

## Tier placement

Per spec **47**: Kin available **Core tier and above** (public name **Luma**, **43** `kin_row` → `minimumTier: LUMA`). Not gated higher — contribution network > gate; CGM hardware is the real barrier.

- Unlimited basic scanning remains free (**43** non-negotiable).
- Kin row is part of the verdict for **eligible** users (Luma+, CGM, opted in, gates pass) — not a paywall inside the scan flow for Sapor users (they simply do not see the row).

---

## Privacy and legal boundaries (50 vs 22)

| Dimension | **50 Kin** | **22 Community health** |
|---|---|---|
| **Purpose** | Metabolic response similarity for glucose cold-start | Post-exposure event associations (allergy, GI, headache, …) |
| **Input signal** | CGM `glucose_meal_window` derived metrics only | Medications, symptoms, exposures via HealthInsightAgent |
| **Cohort key** | `kin_cluster` (response fingerprint) | `anonymous_health_groups` (demographics, conditions, meds categories) |
| **Postgres tables** | `kin_cluster`, `product_kin_response` | 8 tables in `community-health.schema.ts` |
| **Identity in contributions** | **None** — no user_id, no hash | Anonymous group hash; still no user_id in published rows |
| **Opt-in flag** | `kin_state.opted_in` (Brain) | `health_insight.community_contribution_opt_in` (agent_state) |
| **k floor** | 20 samples + 100 cluster members (product row) | ≥100 group size + exposure/event thresholds |
| **Scanner overlay** | Kin row (glucose tendency) | `product_community_health_summary` (event rates) |
| **Must not merge** | Kin fingerprints must **not** reuse `anonymous_health_groups` or leak into illness/health-event aggregates | HealthInsight Pass 3 must **not** write glucose curves to Kin tables |

Both are anonymized Postgres aggregates; **legally and architecturally separate pipelines**. Implementers must not route Kin contributions through HealthInsightAgent or reuse community health group assignment for cluster_id.

---

## Feature boundaries

| In **50** | In neighbor feature |
|---|---|
| Fingerprint, cluster assignment, kin_state, contribution log | `glucose_meal_window` open/derive (**36**) |
| Supabase Kin tables + batch recompute | `health_captures`, HealthInsightAgent (**22**) |
| Contribution endpoint + QStash | Alarm dispatch infrastructure (**14**) |
| Kin overlay helpers + copy | Scanner orchestration (**24**) |
| Opt-in/out lifecycle | Connected Devices UI shell (**36**) |
| `kin_row` entitlement key | `checkTierAccess` implementation (**43**) |
| Transparency copy contract | Passport UI (**47**) |
| Flattest-alternative **line** | Craving-decoder skill (**37**) |
| Cluster GI for ranking | Meal plan generator (**34**) |

---

## Conflicts and resolutions

| Conflict | Resolution |
|---|---|
| Session **038** "Metabolic Twin" / `34-metabolic-twin/` vs current **Kin** / `34-kin/` | **Kin wins** — retired name; ledgers updated in `_records/connections/30-kin-connections.md` |
| Spec **47** "Core tier" vs **43** `BrioelaTier.LUMA` | **Same tier** — Core = Luma public name |
| `anonymous_health_groups.metabolic_marker_bucket` vs `kin_cluster` | **Independent** — coarse bucket for health events ≠ response fingerprint clusters |
| Spec **47** "scan verdicts free" vs `kin_row` gate | **Scan free always**; Kin row only for Luma+ eligible users — not a scan paywall |
| Build-guide dependency `20-wearables` vs feature **36** | **36** owns wearables implementation; Kin depends on **36** meal windows |
| Contribution failure vs user experience | Silent fail OK for aggregates; DO private data authoritative for personal overlays |

---

## Success metrics (spec **47**)

- Kin opt-in rate among CGM-connected users.
- Cold-start coverage: first-month scans where Kin row could serve vs personal-data-only.
- Verdict agreement rate: personal data later vs cluster tendency (honesty metric — low agreement → say less).
- Kin-informed swap acceptance rate.
- Opt-out rate and stated reasons.
- Aggregate coverage growth: products clearing k floor per cluster.

---

## Sources (read for this migration)

### Build guides — Kin (all files)
- `build-guide/34-kin/00-overview.md`
- `build-guide/34-kin/01-fingerprint-and-clustering.md`
- `build-guide/34-kin/02-aggregate-tables-and-k-anonymity.md`
- `build-guide/34-kin/03-contribution-pipeline.md`
- `build-guide/34-kin/04-verdict-overlay.md`
- `build-guide/34-kin/05-opt-in-opt-out.md`

### Build guides — cross-refs
- `build-guide/20-wearables/04-cgm-food-response.md`
- `build-guide/20-wearables/05-feature-integration.md`
- `build-guide/20-wearables/06-privacy-disconnect.md`
- `build-guide/07-scanner/07-community-product-intelligence.md`
- `build-guide/29-health-intelligence/04-community-health-tables.md`
- `build-guide/39-craving-decoder/02-evidence-assembly.md`
- `build-guide/14-pantry-meal-plan/03-meal-plan-generation.md` (cluster GI fallback — verify at implementation)
- `build-guide/32-in-store-copilot/` (Kin-informed swap — overview deps)

### Brioela specs
- `brioela-specs/47-kin.md`
- `brioela-specs/40-wearables-integration.md`
- `brioela-specs/01-product-health-scanning.md`
- `brioela-specs/52-craving-decoder.md`
- `brioela-specs/19-pricing-tiers.md` (Core = Luma)
- `brioela-specs/33-pantry-meal-plan-and-rescue.md` (if present — meal plan consumer)
- `brioela-specs/45-in-store-copilot.md`

### Ledgers & records
- `_records/connections/30-kin-connections.md`
- `_records/build-order/31-layer-kin.md`
- `_records/session-log/038-breakthrough-wave-ten-new-features.md` (historical Metabolic Twin naming)

### Neighbor feature migrations
- `_features/22-health-intelligence/spec.md`
- `_features/36-wearables/spec.md`
- `_features/37-craving-decoder/spec.md`
- `_features/43-pricing-tiers/spec.md`
- `_features/24-scanner/spec.md`
