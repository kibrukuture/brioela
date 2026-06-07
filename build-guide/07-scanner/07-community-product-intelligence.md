# Scanner — Community Product Intelligence

## What This File Covers

The community health intelligence layer: how aggregated anonymized signals from millions of scans make Brioela's product verdicts progressively more accurate than any static database. The Postgres tables that store these signals, how they feed back into product resolution, and the flywheel that makes scale a competitive advantage.

---

## The Core Insight

Open Food Facts tells you what a label says. Brioela tells you what actually happens to real human bodies when they eat that product. That is a fundamentally different and far more powerful signal.

When 50,000 people with peanut allergies scan product X and 3,000 of them later report an allergic reaction — even though the label says "peanut free" — Brioela knows from outcomes, not label trust. No existing food database has this because no existing database observes real health outcomes at scale.

This layer is built in Supabase (shared, anonymous). Personal data never leaves the Orchestrator DO SQLite.

---

## The Eight Community Tables

### Table 1 — `anon_health_cohorts`

Anonymized population segments. k-anonymity enforced: no cohort has fewer than 100 members. Personal identity is destroyed before any row is written.

```sql
CREATE TABLE brioela.anon_health_cohorts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  k_size                   INTEGER NOT NULL CHECK (k_size >= 100),
  age_bucket               TEXT NOT NULL,           -- '20s' | '30s' | '40s' | '50s' | '60s+'
  sex_bucket               TEXT,                    -- 'M' | 'F' | NULL
  region_bucket            TEXT NOT NULL,           -- 'west_africa' | 'south_asia' | 'north_america' | ...
  condition_tags           TEXT[] NOT NULL,         -- ['hypertension', 'type2_diabetes', 'celiac']
  medication_categories    TEXT[] NOT NULL,         -- ['statin', 'biguanide'] — categories, NOT drug names
  dietary_tags             TEXT[] NOT NULL,         -- ['vegan', 'halal', 'nut_free']

  -- Enrichment — sharpens cohorts so aggregated signals are homogeneous, not noise.
  -- Without these, "50s + west_africa + hypertension" can hold 10k members with
  -- completely different diets and metabolic states, making every signal noisy.
  dietary_pattern_signature TEXT NOT NULL DEFAULT '',  -- 'high_sodium_ultra_processed' | 'whole_food_low_carb' | ... — inferred from scan history
  cuisine_profile           JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {"west_african":0.6,"western_packaged":0.3} — cuisine mix from scans
  metabolic_risk_bucket     TEXT NOT NULL DEFAULT 'unknown',     -- 'low' | 'moderate' | 'elevated' | 'high' | 'unknown' — from glucose/HbA1c/BP captures

  cohort_hash              TEXT NOT NULL UNIQUE,    -- deterministic hash of ALL fields above — prevents duplicate cohorts
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cohorts_conditions  ON brioela.anon_health_cohorts USING GIN (condition_tags);
CREATE INDEX idx_cohorts_medications ON brioela.anon_health_cohorts USING GIN (medication_categories);
```

---

### Table 2 — `anon_exposure_outcome_pairs`

The association core. One row = "N people in cohort C consumed exposure Y and M of them had health event H within W hours." Primary query target for elevated outcome patterns.

```sql
CREATE TABLE brioela.anon_exposure_outcome_pairs (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id                UUID NOT NULL REFERENCES brioela.anon_health_cohorts(id),

  -- Exposure (what was consumed)
  exposure_type            TEXT NOT NULL,     -- 'product' | 'ingredient' | 'food_category' | 'additive'
  exposure_key             TEXT NOT NULL,     -- canonical normalized key for this exposure, whatever the type. Identity column for the UNIQUE + upsert — NOT NULL so no NULL-in-UNIQUE bug.
  exposure_product_id      TEXT,             -- = exposure_key when type='product', else NULL. Kept populated so idx_eop_product works.
  exposure_ingredient      TEXT,             -- = exposure_key when type='ingredient', else NULL. Kept populated so idx_eop_ingredient works.
  exposure_food_category   TEXT,             -- = exposure_key when type='food_category', else NULL — 'ultra_processed' | 'high_sodium' | 'fermented'
  exposure_additive_code   TEXT,             -- = exposure_key when type='additive', else NULL — 'E621' | 'E951'

  -- Outcome (what health event followed)
  outcome_event_type       TEXT NOT NULL,    -- 'allergic_reaction' | 'gi_distress' | 'glucose_spike' | 'headache' | 'fatigue' | 'inflammation'
  outcome_severity_avg     REAL NOT NULL,    -- 1.0–10.0
  outcome_severity_p90     REAL NOT NULL,
  onset_lag_hours_avg      REAL NOT NULL,    -- avg hours between exposure and event
  onset_lag_hours_p50      REAL NOT NULL,
  onset_lag_hours_p90      REAL NOT NULL,

  -- Statistics
  exposure_count           INTEGER NOT NULL,  -- people in cohort with this exposure
  outcome_count            INTEGER NOT NULL,  -- of those, how many had the outcome
  outcome_rate             REAL NOT NULL,     -- outcome_count / exposure_count
  baseline_rate            REAL,             -- expected rate without this exposure
  relative_risk            REAL,             -- outcome_rate / baseline_rate — the actual signal
  confidence_low           REAL,
  confidence_high          REAL,
  p_value                  REAL,
  is_significant           BOOLEAN NOT NULL, -- p < 0.05 AND relative_risk > 1.3

  -- Replication
  replication_cohort_count INTEGER NOT NULL DEFAULT 1,
  first_observed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Temporal decay — a cumulative aggregate must not weight an 18-month-old signal
  -- the same as last week's. The weekly decay job multiplies signal_weight by a
  -- decay factor; any fresh observation resets last_replicated_at and re-lifts the
  -- weight. relative_risk is read AS relative_risk * signal_weight at query time.
  signal_weight            REAL NOT NULL DEFAULT 1.0,   -- 0.0–1.0 recency weight, decayed weekly unless replicated
  last_replicated_at       TIMESTAMPTZ NOT NULL DEFAULT now()  -- last time a NEW observation landed on this pair
);

-- Identity — the upsert's ON CONFLICT target. All columns NOT NULL, so it always enforces.
CREATE UNIQUE INDEX uq_eop_identity ON brioela.anon_exposure_outcome_pairs (cohort_id, exposure_type, exposure_key, outcome_event_type);
CREATE INDEX idx_eop_product     ON brioela.anon_exposure_outcome_pairs (exposure_product_id, outcome_event_type, is_significant);
CREATE INDEX idx_eop_ingredient  ON brioela.anon_exposure_outcome_pairs (exposure_ingredient, outcome_event_type, is_significant);
CREATE INDEX idx_eop_rr          ON brioela.anon_exposure_outcome_pairs (relative_risk DESC) WHERE is_significant = true;
CREATE INDEX idx_eop_cohort      ON brioela.anon_exposure_outcome_pairs (cohort_id, is_significant);
```

---

### Table 3 — `anon_ingredient_harm_index`

Aggregated across ALL cohorts. Answers: "for someone with hypertension on a statin, which ingredients in this product are highest risk?" Pre-computed so the query is a direct lookup, not a join.

```sql
CREATE TABLE brioela.anon_ingredient_harm_index (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_name         TEXT NOT NULL,         -- normalized: "monosodium glutamate"
  ingredient_aliases      TEXT[] NOT NULL,       -- ["MSG", "E621", "glutamate"] — all names this appears under
  condition_tag           TEXT NOT NULL,         -- 'hypertension' | 'celiac' | 'type2_diabetes'
  medication_category     TEXT NOT NULL DEFAULT '',  -- 'statin' | '' = all medications. NOT NULL: Postgres treats NULL != NULL, so a nullable column in the UNIQUE below would let duplicate rows through. '' is the sentinel for "any".
  event_type              TEXT NOT NULL,

  -- Signal
  harm_signal             REAL NOT NULL,         -- 0.0–1.0 normalized strength
  severity_median         REAL NOT NULL,
  severity_p90            REAL NOT NULL,
  onset_lag_hours_median  REAL NOT NULL,
  supporting_cohort_count INTEGER NOT NULL,      -- independent cohorts showing this signal
  total_exposure_count    INTEGER NOT NULL,
  total_outcome_count     INTEGER NOT NULL,

  -- Provenance
  source_types            TEXT[] NOT NULL,       -- ['community_signal', 'pubmed', 'fda_adverse_events']
  last_updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (ingredient_name, condition_tag, medication_category, event_type)
);

CREATE INDEX idx_ihi_ingredient ON brioela.anon_ingredient_harm_index (ingredient_name, harm_signal DESC);
CREATE INDEX idx_ihi_condition  ON brioela.anon_ingredient_harm_index (condition_tag, harm_signal DESC);
CREATE INDEX idx_ihi_aliases    ON brioela.anon_ingredient_harm_index USING GIN (ingredient_aliases);
```

---

### Table 4 — `product_community_trust`

The living trust score for each product. Based on real health outcomes, not just label data. This is what makes Brioela's verdict progressively better than Open Food Facts at scale.

```sql
CREATE TABLE brioela.product_community_trust (
  product_id                TEXT PRIMARY KEY REFERENCES brioela.products(id),

  -- Composite trust
  trust_score               REAL NOT NULL,          -- 0.0–1.0
  data_richness             REAL NOT NULL,           -- 0.0–1.0: how much outcome data backs this
  controversy_score         REAL NOT NULL,           -- 0.0–1.0: sources/community disagree

  -- Scan signals
  total_scans               INTEGER NOT NULL DEFAULT 0,
  unique_cohort_count        INTEGER NOT NULL DEFAULT 0,

  -- Health outcome signals
  adverse_event_rate         REAL,                   -- adverse events per 1000 scans
  allergen_community_flags   JSONB,                  -- {"peanut": 0.023, "dairy": 0.001} — community-observed rates
  high_risk_condition_tags   TEXT[],                 -- which condition_tags show elevated adverse rates

  -- Label vs reality
  label_accuracy_score       REAL,                   -- how well label matches GPT-4o mini extraction from real scans
  ingredient_conflict_count  INTEGER NOT NULL DEFAULT 0,  -- label extraction conflicts logged against this product

  last_scan_at               TIMESTAMPTZ,
  last_updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pct_adverse    ON brioela.product_community_trust (adverse_event_rate DESC NULLS LAST);
CREATE INDEX idx_pct_trust      ON brioela.product_community_trust (trust_score);
CREATE INDEX idx_pct_flags      ON brioela.product_community_trust USING GIN (allergen_community_flags);
CREATE INDEX idx_pct_conditions ON brioela.product_community_trust USING GIN (high_risk_condition_tags);
```

---

### Table 5 — `anon_drug_food_interactions`

Community-validated drug-food interaction signals. What clinical databases say vs what actually happens to real people taking those drugs and eating those foods.

```sql
CREATE TABLE brioela.anon_drug_food_interactions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_category           TEXT NOT NULL,          -- 'statin' | 'biguanide' | 'SSRI' | 'anticoagulant'
  food_ingredient         TEXT NOT NULL,          -- normalized ingredient
  food_category           TEXT,

  interaction_type        TEXT NOT NULL,          -- 'potentiation' | 'inhibition' | 'contraindication' | 'timing_sensitive'
  interaction_direction   TEXT NOT NULL,          -- 'increases_drug_effect' | 'decreases_absorption' | 'adverse_reaction'

  community_signal        REAL NOT NULL,          -- 0.0–1.0 from observed outcomes
  clinical_evidence       TEXT,                   -- 'established' | 'probable' | 'suspected' | 'community_only'
  severity_category       TEXT NOT NULL,          -- 'contraindicated' | 'major' | 'moderate' | 'minor'

  cohort_count            INTEGER NOT NULL,
  observation_count       INTEGER NOT NULL,
  clinical_sources        TEXT[],                 -- ['NIH', 'WHO', 'FDA_orange_book']

  first_observed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (drug_category, food_ingredient, interaction_type)
);

CREATE INDEX idx_dfi_drug       ON brioela.anon_drug_food_interactions (drug_category, severity_category);
CREATE INDEX idx_dfi_ingredient ON brioela.anon_drug_food_interactions (food_ingredient, severity_category);
```

---

### Table 6 — `anon_temporal_harm_patterns`

The same food at different times carries different risk. This table captures when harm happens, not just that it happens.

```sql
CREATE TABLE brioela.anon_temporal_harm_patterns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id         UUID NOT NULL REFERENCES brioela.anon_health_cohorts(id),
  exposure_type     TEXT NOT NULL,
  exposure_key      TEXT NOT NULL,             -- ingredient name or food_category
  event_type        TEXT NOT NULL,

  -- Time-of-day risk (risk multiplier by hour, normalized to 1.0 = average)
  hour_risk_profile JSONB NOT NULL,            -- {"0": 1.0, "6": 0.8, "12": 1.2, "18": 1.5, "23": 1.8}

  -- Day-of-week pattern
  weekday_profile   JSONB,                     -- {"mon": 1.0, "fri": 1.4, "sat": 1.6}

  -- Seasonal pattern
  seasonal_profile  JSONB,                     -- {"jan": 1.0, "jul": 1.3}

  observation_count INTEGER NOT NULL,
  last_updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### Table 7 — `anon_geographic_health_patterns`

Where on earth is an ingredient or product causing health problems? What regional dietary patterns correlate with outcomes?

```sql
CREATE TABLE brioela.anon_geographic_health_patterns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geohash_5             TEXT NOT NULL,           -- 5-char ≈ 5km precision
  observation_period    TEXT NOT NULL,           -- '2026-Q2'

  condition_prevalence  JSONB NOT NULL,          -- {"hypertension": 0.23, "celiac": 0.02}
  top_scanned_ingredients TEXT[] NOT NULL,       -- most common ingredients in this area
  high_risk_ingredients JSONB,                   -- {"msg": 0.34, "palm_oil": 0.18} — % of scans containing
  top_event_types       JSONB NOT NULL,          -- {"gi_distress": 0.045, "headache": 0.023}

  population_size_bucket TEXT NOT NULL,          -- '100-500' | '500-2000' | '2000+'

  last_updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (geohash_5, observation_period)
);

CREATE INDEX idx_ghp_geohash    ON brioela.anon_geographic_health_patterns (geohash_5);
CREATE INDEX idx_ghp_conditions ON brioela.anon_geographic_health_patterns USING GIN (condition_prevalence);
```

---

### Table 8 — `anon_association_candidates`

AI/research-ready rows. Each row is a validated association hypothesis with full statistics — ready for ML training or epidemiological research export without any further processing. These are association records, not diagnoses.

```sql
CREATE TABLE brioela.anon_association_candidates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The hypothesis (structured for ML feature extraction)
  exposure_feature      JSONB NOT NULL,    -- {type, key, category, additive_codes}
  outcome_feature       JSONB NOT NULL,    -- {event_type, severity_range, onset_lag_range}
  cohort_feature        JSONB NOT NULL,    -- {conditions, medications, demographics}

  -- Statistical validation
  effect_size           REAL NOT NULL,     -- log relative risk
  p_value               REAL NOT NULL,
  confidence_interval   JSONB NOT NULL,    -- {low, high}
  sample_size           INTEGER NOT NULL,
  replication_count     INTEGER NOT NULL,  -- independent cohorts showing this signal

  -- Quality flags
  confounders_addressed TEXT[],
  bias_flags            TEXT[],            -- ['self_report', 'selection_bias_possible']
  strength_rating       TEXT NOT NULL,     -- 'strong' | 'moderate' | 'weak' | 'hypothesis_only'

  -- Human-readable output
  plain_language_finding TEXT NOT NULL,   -- "People with hypertension who eat MSG experience 2.3x higher headache rate within 4 hours"

  -- Lifecycle
  promoted_to_harm_index BOOLEAN DEFAULT false,
  first_observed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_replicated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ac_strength  ON brioela.anon_association_candidates (strength_rating, replication_count DESC);
CREATE INDEX idx_ac_promoted  ON brioela.anon_association_candidates (promoted_to_harm_index) WHERE promoted_to_harm_index = false;
```

---

## The Flywheel — End to End

```
User (hypertension, on statin) scans product X → eats it
→ scan_event written to Supabase (shared)
→ memory_event written to DO SQLite (private)

6 hours later: user reports headache via voice/wearable
→ health_events row in DO SQLite
→ Health Agent correlates: product X scan → headache 6h later

Health Agent anonymizes:
→ User maps to cohort: [hypertension, 50s, west_africa, statin] — k=847 members
→ anon_exposure_outcome_pairs: product X + headache + cohort → count++
→ relative_risk recomputed: now 2.1 (statistically significant)
→ anon_ingredient_harm_index: MSG (in product X) harm_signal updated for hypertension cohort
→ product_community_trust.adverse_event_rate updated for product X

Next user (different country, same hypertension profile) scans product X:
→ constraint check hits Orchestrator DO
→ product_community_trust shows elevated adverse_event_rate for hypertension cohort
→ anon_ingredient_harm_index shows MSG harm_signal: 0.72 for hypertension
→ Verdict: YELLOW (was GREEN from label data alone)
→ Reason: "Community data shows elevated headache rates in people with your health profile.
            Contains MSG — flagged in our health signal database."
```

This verdict came from real health outcomes across thousands of real people. Not label trust. Not database entries. Real human bodies at scale.

---

## How Community Data Feeds Back Into Constraint Check

In `03-constraint-check.md`, the constraint check queries the Orchestrator DO for user constraints. The DO also now checks community trust signals.

**The harm index is never queried live at scan time.** At 1M scans/day, one Supabase round-trip per scan into `anon_ingredient_harm_index` would put an external network call in the hot path of every scan. Instead the top harm signals per condition tag are materialized into Redis (key `harm_index:{condition_tag}`, 24h TTL) by a scheduled job that reads the `mv_top_ingredient_harms` materialized view. `fetchIngredientHarmSignals` is a Redis lookup, not a database query.

```typescript
// Refresh job — QStash cron, runs every 6h. Reads the materialized view, writes Redis.
async function refreshHarmIndexCache(env: Env): Promise<void> {
  const redis = new Redis({ url: env.UPSTASH_REDIS_URL, token: env.UPSTASH_REDIS_TOKEN })
  const { data: rows } = await supabase
    .from('mv_top_ingredient_harms')
    .select('ingredient_name, condition_tag, event_type, max_harm_signal, total_exposures')

  // Group by condition_tag → one Redis key per condition, value = ingredient → signal map
  const byCondition = groupByConditionTag(rows ?? [])
  for (const [conditionTag, signals] of Object.entries(byCondition)) {
    await redis.set(`harm_index:${conditionTag}`, signals, { ex: 24 * 60 * 60 })
  }
}
```

```typescript
// Added to checkProductConstraints() in tools/product-scan/check-constraint.ts

// Community trust overlay — supplement constraint check with population signals
if (product.communityTrust) {
  const userConditions = getUserConditionTags(db)   // from user_memory.health

  for (const condition of userConditions) {
    const adverseRate = product.communityTrust.allergenCommunityFlags

    // Redis lookup (harm_index:{condition}) — NOT a live Supabase query
    const harmSignals = await fetchIngredientHarmSignals(
      product.ingredients,
      condition,
      env,
    )

    for (const signal of harmSignals) {
      if (signal.harmSignal > 0.60 && signal.supportingCohortCount >= 3) {
        matches.push({
          constraintType: 'community_health_signal',
          entityValue:    signal.ingredientName,
          matchedVia:     `community data: ${signal.plainLanguageFinding}`,
          severity:       signal.harmSignal > 0.80 ? 'warn' : 'deprioritize',
        })
      }
    }
  }
}
```

Community signals never BLOCK (only confirmed hard allergies block). They upgrade verdict from green → yellow when the signal is strong enough and supported by enough independent cohorts.
