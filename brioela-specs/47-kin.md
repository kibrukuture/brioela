# 47. Kin

## Goal

Let users with connected glucose data benefit from the anonymized metabolic experience of people whose bodies respond like theirs. A new CGM user scans a product and sees — before ever eating it — how it tends to behave for their metabolic response cluster: "For people whose glucose responses match yours, this one usually spikes hard. The one next to it stays flat for your group."

## Naming

**Kin** is the product name for this feature. Early drafts called it "Metabolic Twin" — that phrase is retired entirely.

- **What it names**: the anonymized metabolic-similarity layer and its verdict surface. The user's cluster is "your Kin"; the verdict line is the Kin row ("Your Kin usually spikes on this one").
- **Why this word**: kin are relatives — people whose bodies are like yours, whom you have never met and never will. Three letters, warm, zero clinical smell, reclaimed-word family (Ground, Find, Passport, Tonight). It also forms a deliberate pair with Mesa: **Mesa is your table — the people you know. Kin is your body's family — the people you'll never meet.** The two names must keep this contrast in all product language.
- **Why not "Twin"**: generic, collides with the industry's "digital twin" noise, and implies one matched person rather than an anonymous group.
- **Where it is used**:
  - UI surfaces: the Kin row in scan verdicts, the Kin opt-in question, the Kin entry in Connected Devices and in "what Brioela knows about me."
  - Code namespace: `kin` — tables `kin_cluster`, `product_kin_response`, `kin_state`, `kin_contribution_log`; future tool code under `tools/kin/`.
  - Docs: this spec, `build-guide/34-kin/`, and all records use Kin. "Metabolic" survives only as a lowercase adjective (metabolic fingerprint, metabolically similar) — never as part of the name.

## Why This Exists

Spec 40 builds personal glucose–food correlation, and it is the killer feature it claims to be — but it has a cold-start problem by design: every insight requires the user to eat the spike first. Three correlation events per product before a `spike_trigger` fact exists. A new CGM user gets weeks of "not enough data."

Meanwhile, the product already has the exact privacy pattern needed to fix this. Spec 01's scanner reads `product_community_health_summary` — anonymous users with similar profiles reporting post-exposure events — and spec 30 aggregates fully anonymized community illness signals. Kin applies that same anonymized-aggregate pattern to glucose response curves.

The result is a data moat no competitor can copy: Yuka has scans without biology. Levels has biology without a scanning network. Nobody has both sides plus the matching. And the network compounds — every CGM user makes every metabolically similar user's verdicts smarter (the spec 25 network-effect thesis, applied to physiology instead of geography).

## User Outcome

- A CGM-connected user opts in once: "Use anonymous response data from people metabolically similar to you, and contribute yours anonymously in return." One question, reciprocal, revocable.
- From then on, scan verdicts on relevant products gain a Kin row: "People with responses like yours: this usually spikes (n=1,400, 80% spiked)." Phrased as group tendency, never prediction.
- Their own data quietly improves the cluster for everyone like them. They are never shown who, never shown profiles, never shown anything social. There is no Kin "community" — only better verdicts.
- When their own personal curve for a product exists (spec 40), it always outranks the Kin signal: "Your own data: flat. (Your group tends to spike — you're an exception on this one.)"

## In Scope

- Anonymized per-product response aggregates contributed from derived meal-window values (spec 40: peak delta, time-to-peak, AUC — never raw curves).
- Response-profile clustering: assigning each opted-in user a Kin cluster from their accumulated response fingerprint.
- Kin overlays in scan verdicts, recipe ranking, and meal plan generation (spec 33) for products/ingredients where the user has no personal data yet.
- Explicit opt-in, instant opt-out with contributed-data deletion of the user's link (aggregates are recomputed without their rows).

## Out of Scope

- Any user-to-user visibility, matching UI, social features, or "find your Kin" surfaces. There is no Kin member you can meet. The product is the center, not the person (spec 35 design law applies here with full force).
- Medical claims. Kin data is observational tendency, never diagnosis or prediction ("usually" / "tends to", never "will").
- Selling, sharing, or exposing aggregate health data to businesses, practitioners (spec 18), insurers, or anyone. Aggregates exist solely to improve opted-in users' own verdicts.
- Non-glucose biometrics in v1. HRV/sleep kin-matching is explicitly deferred — glucose is the only signal with clean food–response pairing.

## The Metabolic Fingerprint

Each opted-in user accumulates a response fingerprint from their own meal windows (spec 40 `glucose_meal_window` derived values). The fingerprint is a small vector of normalized response characteristics:

- Typical peak delta across high-glycemic reference categories (refined carbs, white rice, fruit juice, bread).
- Typical time-to-peak and return-to-baseline speed.
- Fasting baseline band.
- Response variance (stable responder vs. volatile responder).

Fingerprints are computed in the user's Brain DO from their private data. Only the resulting cluster assignment — a cluster ID, nothing else — leaves the DO. Cluster centroids are maintained globally; assignment is recomputed monthly by the DO alarm cycle as the user's fingerprint matures. A minimum of 10 meal windows is required before any assignment — until then the user contributes nothing and the Kin row simply does not appear.

## The Aggregate Tables

Shared, fully anonymized, in Supabase Postgres — the same boundary class as `product_community_health_summary` (spec 01) and `community_illness_signal` (spec 30):

```sql
kin_cluster (
  cluster_id        text primary key,
  centroid_json     text not null,      -- normalized response characteristics
  member_count      integer not null,   -- approximate, for k-anonymity checks
  updated_at        timestamptz
)

product_kin_response (
  product_id        text,
  cluster_id        text,
  sample_count      integer not null,
  spike_rate        real,               -- share of windows above spike threshold
  median_peak_delta real,
  median_auc        real,
  updated_at        timestamptz,
  primary key (product_id, cluster_id)
)
```

**Anonymization rules (hard, enforced at write):**
- Contributions carry cluster_id + product_id + derived values only. No user_id, no hashed user_id, no timestamps finer than a 7-day bucket.
- A `product_kin_response` row is never readable until `sample_count >= 20` distinct contribution events AND the cluster `member_count >= 100`. Below threshold the row exists but is served to no one (k-anonymity floor).
- Raw glucose curves never leave the Brain DO under any circumstances — this restates spec 40's rule; the Kin system consumes only the already-derived window values.

## Verdict Integration

The scanner computation spine (spec 01) gains one overlay, positioned after personal data and before the generic base score in trust order:

```text
1. user's own glucose history for this product (spec 40)   ← always wins
2. Kin cluster response for this product                  ← fills the cold start
3. population glycemic data                                ← the generic fallback
```

Wording rules (same discipline as community health context, spec 01): the Kin row may add caution or add reassurance framing, may say "usually" and "for people like you", may never use causal or clinical language, may never override an allergen or condition flag, and may never create a hard red block by itself.

Recipe ranking and meal plan generation (spec 33) consume the same overlay: where the plan would use population GI for an ingredient the user has never logged, it uses the cluster response instead when one clears the k-anonymity floor.

## Opt-In and Opt-Out

- Opt-in is a single question, asked only after the user has a working CGM connection and at least one personal correlation has been shown (the user understands what response data is before being asked to pool it). This is the spec 21 pattern: value first, question after.
- Opt-out is one tap in Connected Devices (spec 40 settings surface). On opt-out: the Brain DO stops contributing, the user's pending contributions are withdrawn, and affected aggregates recompute on the next maintenance cycle. The user keeps receiving nothing — opt-out ends both directions (reciprocity is the deal, stated plainly).
- Disconnecting the CGM entirely (spec 40) implies Kin opt-out automatically.

## Data Model (Brain DO side, private)

- `kin_state`: opted_in (boolean), cluster_id (nullable), fingerprint_json, assigned_at, last_contribution_at.
- `kin_contribution_log`: contribution_id, product_id, window_id (FK to spec 40 glucose_meal_window), contributed_at — the user's own record of what they shared, visible in "what Brioela knows about me" (spec 34), deletable.

## Technical Constraints

- Contribution is a fire-and-forget QStash job from the Brain DO after each meal window closes — never blocks the scan or session path.
- Cluster assignment math runs inside the Brain DO (private data never leaves); only the assignment result is transmitted.
- Aggregate recomputation is a scheduled Supabase job, not per-write — hourly batch is sufficient; this data is tendency, not real-time.
- The verdict path reads `product_kin_response` through the standard Upstash Redis product cache with TTL (spec 24) — one extra cached lookup, no latency budget change to the 3-second scan target.
- Cluster count starts small (8–16 clusters). Too many clusters fragments samples below the k-anonymity floor and the feature serves nothing; too few makes "like you" meaningless. Tune from data, start coarse.

## Tier Placement

Kin is available on Core tier and above (spec 19) for any user with a connected CGM and Kin opt-in. It is not gated above Core: the contribution network is worth more than the gate, and the CGM hardware is already the real cost barrier. Scan verdicts remain free as always — the Kin row is part of the verdict for eligible users, not a paywalled add-on inside it.

## Privacy

- This feature touches the most sensitive data class in the app (spec 40's words). Every spec 40 non-negotiable holds. Additions:
- Cluster assignment is the only health-derived value that leaves the Brain DO, and it is meaningless without the centroid table — it encodes "responds like group 7", nothing more.
- The k-anonymity floors (20 samples, 100 members) are hard serving gates, not guidelines.
- The "what Brioela knows about me" screen shows: opted-in status, current cluster in plain language ("your responses are pooled with people who spike fast on refined carbs and recover quickly"), and the full contribution log with deletion.
- No Kin data ever appears in Ground, Mesa, Passport, practitioner views, or any export by default.

## Success Metrics

- Kin opt-in rate among CGM-connected users.
- Cold-start coverage: share of a new CGM user's first-month scans where a Kin row could be served (vs. personal-data coverage alone).
- Verdict agreement rate: when a user later accumulates personal data for a product, how often does it agree with their cluster's tendency? (This is the honesty metric — if agreement is low, clustering is wrong and the feature must say less.)
- Kin-informed swap acceptance rate (user picks the flatter alternative).
- Opt-out rate and stated reasons.
- Aggregate coverage growth: products clearing the k-anonymity floor per cluster over time.
