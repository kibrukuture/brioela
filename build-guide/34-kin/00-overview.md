# Kin — Overview

## What This Folder Covers
Anonymized glucose-response clustering. Opted-in CGM users contribute derived meal-window values (peak delta, time-to-peak, AUC — never raw curves) into per-product, per-cluster aggregates in Supabase. New CGM users get "people whose responses match yours" overlays on scan verdicts before they have personal data — personal data always outranks Kin data. K-anonymity floors are hard serving gates. No user ever sees another user; there is no Kin community, only better verdicts.

## Status
[x] guide complete — five files written, implementation not started

## Files In This Folder

| File | Contents |
|---|---|
| `01-fingerprint-and-clustering.md` | the in-DO response fingerprint, cluster assignment, the 10-window floor |
| `02-aggregate-tables-and-k-anonymity.md` | kin_cluster + product_kin_response tables, anonymization write rules, serving gates |
| `03-contribution-pipeline.md` | fire-and-forget QStash contribution, 7-day time bucketing, recomputation cadence |
| `04-verdict-overlay.md` | the trust order (own data > Kin > population), wording rules, cache path |
| `05-opt-in-opt-out.md` | the one-question reciprocal opt-in, opt-out + withdrawal, CGM-disconnect implication |

## Specs This Folder Draws From
- `brioela-specs/47-kin.md` — the full feature spec
- `brioela-specs/40-wearables-integration.md` — glucose_meal_window derived values (the only input)
- `brioela-specs/01-product-health-scanning.md` — community-evidence overlay precedent and wording discipline
- `brioela-specs/30-food-illness-detective.md` — anonymized community signal precedent

## Key Decisions From Specs
- Only the cluster assignment (a cluster ID) ever leaves the Brain DO. Fingerprint math runs inside the DO. Raw curves never leave under any circumstances.
- Hard k-anonymity floors: a product_kin_response row serves only at sample_count ≥ 20 AND cluster member_count ≥ 100. Below floor: exists, serves no one.
- Contributions carry cluster_id + product_id + derived values; no user_id, no hashed user_id, timestamps bucketed to 7 days.
- Trust order in the verdict: own glucose history → Kin cluster → population GI. Kin language: "usually" / "tends to", never prediction, never clinical, never overrides allergen/condition flags, never a hard red by itself.
- Opt-in: one question, asked only after the user has seen at least one personal correlation (value first). Reciprocal: opt-out ends both directions. CGM disconnect implies Kin opt-out.
- Start with 8–16 coarse clusters; tune from data. Too many fragments below the floor; too few makes "like you" meaningless.
- Verdict agreement rate (personal data later agreeing with cluster tendency) is the honesty metric — if low, the feature must say less.
- Core tier+, deliberately not gated higher: the contribution network outweighs the gate.

## What This Folder Depends On
- `20-wearables` — CGM connection and glucose_meal_window (file 04 there)
- `05-brain` — fingerprint computation, kin_state, contribution log
- `07-scanner` — verdict overlay integration
- `12-notifications` — none directly; overlay is in-verdict only

## What Depends On This Folder
- `14-pantry-meal-plan` — cluster responses replace population GI where personal data is absent
- `32-in-store-copilot` — Kin-informed swap evidence
- `39-craving-decoder` — flattest-alternative notes
