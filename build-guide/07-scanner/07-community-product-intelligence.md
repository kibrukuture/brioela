# Scanner — Community Product Intelligence

## What This File Covers

The community health intelligence layer: how aggregated anonymized signals from millions of scans make Brioela's product verdicts progressively more accurate than any static database. The Postgres tables that store these signals, how they feed back into product resolution, and the flywheel that makes scale a competitive advantage.

---

## The Core Insight

Open Food Facts tells you what a label says. Brioela can also learn from anonymous post-exposure event associations reported after people eat that product. That is a fundamentally different and far more powerful signal.

When 50,000 people with peanut allergies scan product X and 3,000 of them later report an allergic reaction — even though the label says "peanut free" — Brioela has community event evidence that static label data does not provide. No existing food database has this because no existing database observes real post-exposure events at scale.

This layer is built in Supabase (shared, anonymous). Personal data never leaves the Orchestrator DO SQLite.

---

## The Eight Community Tables

### Table 1 — `anonymous_health_groups`

Anonymized population segments. k-anonymity enforced: no anonymous health group has fewer than 100 members. Personal identity is destroyed before any row is written.

```sql
CREATE TABLE brioela.anonymous_health_groups (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  k_anonymity_group_size   INTEGER NOT NULL CHECK (k_anonymity_group_size >= 100),
  age_bucket               TEXT NOT NULL,           -- '20s' | '30s' | '40s' | '50s' | '60s+'
  sex_bucket               TEXT,                    -- 'M' | 'F' | NULL
  region_bucket            TEXT NOT NULL,           -- 'west_africa' | 'south_asia' | 'north_america' | ...
  reported_condition_tags  TEXT[] NOT NULL,         -- ['hypertension', 'type2_diabetes', 'celiac']
  medication_categories    TEXT[] NOT NULL,         -- ['statin', 'biguanide'] — categories, NOT drug names
  dietary_tags             TEXT[] NOT NULL,         -- ['vegan', 'halal', 'nut_free']

  -- Enrichment — sharpens anonymous health groups so aggregated signals are homogeneous, not noise.
  -- Without these, "50s + west_africa + hypertension" can hold 10k members with
  -- completely different diets and metabolic states, making every signal noisy.
  dietary_pattern_signature TEXT NOT NULL DEFAULT '',  -- 'high_sodium_ultra_processed' | 'whole_food_low_carb' | ... — inferred from scan history
  cuisine_profile           JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {"west_african":0.6,"western_packaged":0.3} — cuisine mix from scans
  metabolic_marker_bucket   TEXT NOT NULL DEFAULT 'unknown',     -- 'low' | 'moderate' | 'elevated' | 'high' | 'unknown' — from glucose/HbA1c/BP captures

  anonymous_health_group_hash TEXT NOT NULL UNIQUE, -- deterministic hash of ALL fields above — prevents duplicate groups
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ahg_conditions  ON brioela.anonymous_health_groups USING GIN (reported_condition_tags);
CREATE INDEX idx_ahg_medications ON brioela.anonymous_health_groups USING GIN (medication_categories);
```

---

### Table 2 — `anonymous_exposure_event_associations`

The association core. One row = "N people in anonymous health group C consumed exposure Y and M of them reported event H within W hours." Primary query target for elevated post-exposure event patterns.

```sql
CREATE TABLE brioela.anonymous_exposure_event_associations (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_health_group_id UUID NOT NULL REFERENCES brioela.anonymous_health_groups(id),

  -- Exposure (what was consumed)
  exposure_kind            TEXT NOT NULL,     -- 'product' | 'ingredient' | 'food_category' | 'additive'
  exposure_key             TEXT NOT NULL,     -- canonical normalized key for this exposure, whatever the type. Identity column for the UNIQUE + upsert — NOT NULL so no NULL-in-UNIQUE bug.
  exposure_product_id      TEXT,             -- = exposure_key when type='product', else NULL. Kept populated so idx_eea_product works.
  exposure_ingredient_name TEXT,             -- = exposure_key when type='ingredient', else NULL. Kept populated so idx_eea_ingredient works.
  exposure_food_category   TEXT,             -- = exposure_key when type='food_category', else NULL — 'ultra_processed' | 'high_sodium' | 'fermented'
  exposure_additive_code   TEXT,             -- = exposure_key when type='additive', else NULL — 'E621' | 'E951'

  -- Post-exposure reported event
  post_exposure_event_kind TEXT NOT NULL,    -- 'allergic_reaction' | 'gi_distress' | 'glucose_spike' | 'headache' | 'fatigue' | 'inflammation'
  event_severity_average   REAL NOT NULL,    -- 1.0–10.0
  event_severity_p90       REAL NOT NULL,
  onset_lag_hours_avg      REAL NOT NULL,    -- avg hours between exposure and event
  onset_lag_hours_p50      REAL NOT NULL,
  onset_lag_hours_p90      REAL NOT NULL,

  -- Statistics
  exposure_count           INTEGER NOT NULL,  -- people in anonymous health group with this exposure
  post_exposure_event_count INTEGER NOT NULL, -- of those, how many reported the event
  post_exposure_event_rate REAL NOT NULL,     -- post_exposure_event_count / exposure_count
  comparison_event_rate    REAL,             -- comparison rate without this exposure
  observed_rate_ratio      REAL,             -- post_exposure_event_rate / comparison_event_rate
  rate_ratio_confidence_low REAL,
  rate_ratio_confidence_high REAL,
  p_value                  REAL,
  statistical_threshold_passed BOOLEAN NOT NULL, -- p < 0.05 AND observed_rate_ratio > 1.3

  -- Replication
  supporting_health_group_count INTEGER NOT NULL DEFAULT 1,
  first_observed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Temporal decay — a cumulative aggregate must not weight an 18-month-old signal
  -- the same as last week's. The weekly decay job multiplies recency_weight by a
  -- decay factor; any fresh observation resets last_replicated_at and re-lifts the
  -- weight. observed_rate_ratio is read AS observed_rate_ratio * recency_weight at query time.
  recency_weight           REAL NOT NULL DEFAULT 1.0,   -- 0.0–1.0 recency weight, decayed weekly unless replicated
  last_replicated_at       TIMESTAMPTZ NOT NULL DEFAULT now()  -- last time a NEW observation landed on this pair
);

-- Identity — the upsert's ON CONFLICT target. All columns NOT NULL, so it always enforces.
CREATE UNIQUE INDEX uq_anonymous_exposure_event_association ON brioela.anonymous_exposure_event_associations (anonymous_health_group_id, exposure_kind, exposure_key, post_exposure_event_kind);
CREATE INDEX idx_eea_product     ON brioela.anonymous_exposure_event_associations (exposure_product_id, post_exposure_event_kind, statistical_threshold_passed);
CREATE INDEX idx_eea_ingredient  ON brioela.anonymous_exposure_event_associations (exposure_ingredient_name, post_exposure_event_kind, statistical_threshold_passed);
CREATE INDEX idx_eea_ratio       ON brioela.anonymous_exposure_event_associations (observed_rate_ratio DESC) WHERE statistical_threshold_passed = true;
CREATE INDEX idx_eea_group       ON brioela.anonymous_exposure_event_associations (anonymous_health_group_id, statistical_threshold_passed);
```

---

### Table 3 — `anonymous_ingredient_event_association_index`

Aggregated across ALL anonymous health groups. Answers: "for someone with hypertension on a statin, which ingredients in this product have the strongest observed event associations?" Pre-computed so the query is a direct lookup, not a join.

```sql
CREATE TABLE brioela.anonymous_ingredient_event_association_index (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_name         TEXT NOT NULL,         -- normalized: "monosodium glutamate"
  ingredient_aliases      TEXT[] NOT NULL,       -- ["MSG", "E621", "glutamate"] — all names this appears under
  reported_condition_tag  TEXT NOT NULL,         -- 'hypertension' | 'celiac' | 'type2_diabetes'
  medication_category     TEXT NOT NULL DEFAULT '',  -- 'statin' | '' = all medications. NOT NULL: Postgres treats NULL != NULL, so a nullable column in the UNIQUE below would let duplicate rows through. '' is the sentinel for "any".
  post_exposure_event_kind TEXT NOT NULL,

  -- Signal
  event_association_score REAL NOT NULL,         -- 0.0–1.0 normalized strength
  event_severity_median   REAL NOT NULL,
  event_severity_p90      REAL NOT NULL,
  post_exposure_lag_hours_median REAL NOT NULL,
  supporting_health_group_count INTEGER NOT NULL, -- independent groups showing this signal
  total_exposure_count    INTEGER NOT NULL,
  total_post_exposure_event_count INTEGER NOT NULL,

  -- Provenance
  evidence_source_types   TEXT[] NOT NULL,       -- ['community_signal', 'pubmed', 'fda_adverse_events']
  last_updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (ingredient_name, reported_condition_tag, medication_category, post_exposure_event_kind)
);

CREATE INDEX idx_ieai_ingredient ON brioela.anonymous_ingredient_event_association_index (ingredient_name, event_association_score DESC);
CREATE INDEX idx_ieai_condition  ON brioela.anonymous_ingredient_event_association_index (reported_condition_tag, event_association_score DESC);
CREATE INDEX idx_ieai_aliases    ON brioela.anonymous_ingredient_event_association_index USING GIN (ingredient_aliases);
```

---

### Table 4 — `product_community_health_summary`

The living community health summary for each product. Based on reported post-exposure events, not just label data. This is what makes Brioela's verdict progressively better than Open Food Facts at scale.

```sql
CREATE TABLE brioela.product_community_health_summary (
  product_id                TEXT PRIMARY KEY REFERENCES brioela.products(id),

  -- Composite community health summary
  community_health_confidence_score REAL NOT NULL,   -- 0.0–1.0
  community_evidence_volume_score   REAL NOT NULL,   -- 0.0–1.0: how much event data backs this
  community_evidence_disagreement_score REAL NOT NULL, -- 0.0–1.0: sources/community disagree

  -- Scan signals
  total_scans               INTEGER NOT NULL DEFAULT 0,
  unique_health_group_count  INTEGER NOT NULL DEFAULT 0,

  -- Health event signals
  reported_event_rate        REAL,                   -- reported events per 1000 scans
  reported_allergen_event_rates JSONB,               -- {"peanut": 0.023, "dairy": 0.001} — community-observed rates
  condition_tags_with_elevated_event_rates TEXT[],   -- which condition tags show elevated reported event rates

  -- Label vs reality
  label_match_score          REAL,                   -- how well label matches GPT-4o mini extraction from real scans
  label_ingredient_mismatch_count INTEGER NOT NULL DEFAULT 0,  -- label extraction conflicts logged against this product

  last_scan_at               TIMESTAMPTZ,
  last_updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pchs_event_rate ON brioela.product_community_health_summary (reported_event_rate DESC NULLS LAST);
CREATE INDEX idx_pchs_confidence ON brioela.product_community_health_summary (community_health_confidence_score);
CREATE INDEX idx_pchs_allergens  ON brioela.product_community_health_summary USING GIN (reported_allergen_event_rates);
CREATE INDEX idx_pchs_conditions ON brioela.product_community_health_summary USING GIN (condition_tags_with_elevated_event_rates);
```

---

### Table 5 — `anonymous_medication_food_event_associations`

Community-observed medication-category food event associations. What clinical databases say vs what people report after taking those medication categories and eating those foods.

```sql
CREATE TABLE brioela.anonymous_medication_food_event_associations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_category     TEXT NOT NULL,          -- 'statin' | 'biguanide' | 'SSRI' | 'anticoagulant'
  food_ingredient         TEXT NOT NULL,          -- normalized ingredient
  food_category           TEXT,

  interaction_type        TEXT NOT NULL,          -- 'potentiation' | 'inhibition' | 'contraindication' | 'timing_sensitive'
  interaction_direction   TEXT NOT NULL,          -- 'increases_drug_effect' | 'decreases_absorption' | 'adverse_reaction'

  community_signal        REAL NOT NULL,          -- 0.0–1.0 from observed post-exposure events
  clinical_evidence       TEXT,                   -- 'established' | 'probable' | 'suspected' | 'community_only'
  severity_category       TEXT NOT NULL,          -- 'contraindicated' | 'major' | 'moderate' | 'minor'

  health_group_count      INTEGER NOT NULL,
  observation_count       INTEGER NOT NULL,
  clinical_sources        TEXT[],                 -- ['NIH', 'WHO', 'FDA_orange_book']

  first_observed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (medication_category, food_ingredient, interaction_type)
);

CREATE INDEX idx_mfea_medication ON brioela.anonymous_medication_food_event_associations (medication_category, severity_category);
CREATE INDEX idx_mfea_ingredient ON brioela.anonymous_medication_food_event_associations (food_ingredient, severity_category);
```

---

### Table 6 — `anonymous_time_of_day_event_patterns`

The same food at different times can have different reported event patterns. This table captures when reported events cluster, not just that they happen.

```sql
CREATE TABLE brioela.anonymous_time_of_day_event_patterns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_health_group_id UUID NOT NULL REFERENCES brioela.anonymous_health_groups(id),
  exposure_kind     TEXT NOT NULL,
  exposure_key      TEXT NOT NULL,             -- ingredient name or food_category
  post_exposure_event_kind TEXT NOT NULL,

  -- Time-of-day event rate profile by hour, normalized to 1.0 = average
  hour_event_rate_profile JSONB NOT NULL,      -- {"0": 1.0, "6": 0.8, "12": 1.2, "18": 1.5, "23": 1.8}

  -- Day-of-week pattern
  weekday_profile   JSONB,                     -- {"mon": 1.0, "fri": 1.4, "sat": 1.6}

  -- Seasonal pattern
  seasonal_profile  JSONB,                     -- {"jan": 1.0, "jul": 1.3}

  observation_count INTEGER NOT NULL,
  last_updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### Table 7 — `anonymous_region_event_patterns`

Where do ingredient or product event associations cluster? What regional dietary patterns correlate with reported post-exposure events?

```sql
CREATE TABLE brioela.anonymous_region_event_patterns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geohash_5             TEXT NOT NULL,           -- 5-char ≈ 5km precision
  observation_period    TEXT NOT NULL,           -- '2026-Q2'

  reported_condition_distribution JSONB NOT NULL, -- {"hypertension": 0.23, "celiac": 0.02}
  top_scanned_ingredients TEXT[] NOT NULL,       -- most common ingredients in this area
  ingredients_with_elevated_event_rates JSONB,   -- {"msg": 0.34, "palm_oil": 0.18} — % of scans containing
  top_event_types       JSONB NOT NULL,          -- {"gi_distress": 0.045, "headache": 0.023}

  population_size_bucket TEXT NOT NULL,          -- '100-500' | '500-2000' | '2000+'

  last_updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (geohash_5, observation_period)
);

CREATE INDEX idx_rep_geohash    ON brioela.anonymous_region_event_patterns (geohash_5);
CREATE INDEX idx_rep_conditions ON brioela.anonymous_region_event_patterns USING GIN (reported_condition_distribution);
```

---

### Table 8 — `anonymous_research_association_candidates`

AI/research-ready rows. Each row is a validated association hypothesis with full statistics — ready for ML training or epidemiological research export without any further processing. These are association records, not clinical conclusions.

```sql
CREATE TABLE brioela.anonymous_research_association_candidates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The hypothesis (structured for ML feature extraction)
  exposure_feature      JSONB NOT NULL,    -- {type, key, category, additive_codes}
  post_exposure_event_feature JSONB NOT NULL, -- {event_type, severity_range, onset_lag_range}
  anonymous_health_group_feature JSONB NOT NULL, -- {conditions, medications, demographics}

  -- Statistical validation
  effect_size           REAL NOT NULL,     -- log observed rate ratio
  p_value               REAL NOT NULL,
  confidence_interval   JSONB NOT NULL,    -- {low, high}
  sample_size           INTEGER NOT NULL,
  replication_count     INTEGER NOT NULL,  -- independent anonymous health groups showing this signal

  -- Quality flags
  confounders_addressed TEXT[],
  bias_flags            TEXT[],            -- ['self_report', 'selection_bias_possible']
  strength_rating       TEXT NOT NULL,     -- 'strong' | 'moderate' | 'weak' | 'hypothesis_only'

  -- Human-readable output
  plain_language_association_summary TEXT NOT NULL, -- "People with hypertension who eat MSG report headaches 2.3x more often within 4 hours"

  -- Lifecycle
  promoted_to_signal_index BOOLEAN DEFAULT false,
  first_observed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_replicated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rac_strength ON brioela.anonymous_research_association_candidates (strength_rating, replication_count DESC);
CREATE INDEX idx_rac_promoted ON brioela.anonymous_research_association_candidates (promoted_to_signal_index) WHERE promoted_to_signal_index = false;
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
→ User maps to anonymous_health_groups: [hypertension, 50s, west_africa, statin] — k=847 members
→ anonymous_exposure_event_associations: product X + headache + anonymous health group → count++
→ observed_rate_ratio recomputed: now 2.1 with statistical threshold passed
→ anonymous_ingredient_event_association_index: MSG event_association_score updated for hypertension group
→ product_community_health_summary.reported_event_rate updated for product X

Next user (different country, same hypertension profile) scans product X:
→ constraint check hits Orchestrator DO
→ product_community_health_summary shows elevated reported_event_rate for hypertension group
→ anonymous_ingredient_event_association_index shows MSG event_association_score: 0.72 for hypertension
→ Verdict: YELLOW (was GREEN from label data alone)
→ Reason: "Community data shows elevated headache rates in people with your health profile.
            Contains MSG — flagged in our health signal database."
```

This verdict came from anonymous post-exposure event associations across thousands of people. Not label data alone. Real reports at scale.

---

## How Community Data Feeds Back Into Constraint Check

In `03-constraint-check.md`, the constraint check queries the Orchestrator DO for user constraints. The DO also now checks community health summary signals.

**The ingredient association index is never queried live at scan time.** At 1M scans/day, one Supabase round-trip per scan into `anonymous_ingredient_event_association_index` would put an external network call in the hot path of every scan. Instead the top ingredient event associations per condition tag are materialized into Redis (key `ingredient_event_association_index:{reported_condition_tag}`, 24h TTL) by a scheduled job that reads the `mv_top_ingredient_event_associations` materialized view. `fetchIngredientEventAssociationSignals` is a Redis lookup, not a database query.

```typescript
// Refresh job — QStash cron, runs every 6h. Reads the materialized view, writes Redis.
async function refreshIngredientEventAssociationIndexCache(env: Env): Promise<void> {
  const redis = new Redis({ url: env.UPSTASH_REDIS_URL, token: env.UPSTASH_REDIS_TOKEN })
  const { data: rows } = await supabase
    .from('mv_top_ingredient_event_associations')
    .select('ingredient_name, reported_condition_tag, post_exposure_event_kind, max_event_association_score, total_exposures')

  // Group by reported_condition_tag → one Redis key per condition, value = ingredient → signal map
  const byCondition = groupByReportedConditionTag(rows ?? [])
  for (const [reportedConditionTag, signals] of Object.entries(byCondition)) {
    await redis.set(`ingredient_event_association_index:${reportedConditionTag}`, signals, { ex: 24 * 60 * 60 })
  }
}
```

```typescript
// Added to checkProductConstraints() in tools/product-scan/check-constraint.ts

// Community health overlay — supplement constraint check with population signals
if (product.communityHealthSummary) {
  const userConditions = getUserConditionTags(db)   // from user_memory.health

  for (const condition of userConditions) {
    const reportedAllergenEventRates = product.communityHealthSummary.reportedAllergenEventRates

    // Redis lookup (ingredient_event_association_index:{condition}) — NOT a live Supabase query
    const ingredientAssociationSignals = await fetchIngredientEventAssociationSignals(
      product.ingredients,
      condition,
      env,
    )

    for (const signal of ingredientAssociationSignals) {
      if (signal.eventAssociationScore > 0.60 && signal.supportingHealthGroupCount >= 3) {
        matches.push({
          constraintType: 'community_health_association',
          entityValue:    signal.ingredientName,
          matchedVia:     `community data: ${signal.plainLanguageAssociationSummary}`,
          severity:       signal.eventAssociationScore > 0.80 ? 'warn' : 'deprioritize',
        })
      }
    }
  }
}
```

Community signals never BLOCK (only confirmed hard allergies block). They upgrade verdict from green → yellow when the signal is strong enough and supported by enough independent anonymous health groups.
