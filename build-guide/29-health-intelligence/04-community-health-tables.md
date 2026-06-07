# Health Intelligence — Community Health Tables

## What This File Covers

The canonical schema for all 8 anonymized community Postgres tables, the Postgres functions that handle upserts safely, and the materialized views that make queries fast at scale.

This file is the authoritative schema reference. `07-scanner/07-community-product-intelligence.md` describes how these tables feed back into product verdicts. This file defines what they contain.

---

## Schema Location

All community health tables live in the `brioela` Postgres schema in Supabase — same schema as `products`, `scan_events`, and all other shared data.

```
shared/drizzle/schema/
├── products.schema.ts
├── scan.schema.ts
├── community-health.schema.ts   ← all 8 tables here
└── index.ts
```

---

## The Eight Tables — Full Schema

See `07-scanner/07-community-product-intelligence.md` for table-by-table explanations of purpose, design decisions, and query patterns. This file contains the complete Drizzle schema.

```typescript
// shared/drizzle/schema/community-health.schema.ts

import {
  pgSchema, uuid, text, integer, real, boolean, jsonb, timestamp, uniqueIndex
} from 'drizzle-orm/pg-core'
import { brioela } from './brioela'

// ── 1. anon_health_cohorts ──────────────────────────────────────────────────

export const anonHealthCohorts = brioela.table('anon_health_cohorts', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  kSize:                  integer('k_size').notNull(),
  ageBucket:              text('age_bucket').notNull(),
  sexBucket:              text('sex_bucket'),
  regionBucket:           text('region_bucket').notNull(),
  conditionTags:          text('condition_tags').array().notNull(),
  medicationCategories:   text('medication_categories').array().notNull(),
  dietaryTags:            text('dietary_tags').array().notNull(),

  // Enrichment — homogenizes cohorts so aggregated signals are not noise
  dietaryPatternSignature: text('dietary_pattern_signature').notNull().default(''),
  cuisineProfile:          jsonb('cuisine_profile').notNull().default({}),
  metabolicRiskBucket:     text('metabolic_risk_bucket').notNull().default('unknown'),

  cohortHash:             text('cohort_hash').notNull().unique(),
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 2. anon_exposure_outcome_pairs ──────────────────────────────────────────

export const anonExposureOutcomePairs = brioela.table('anon_exposure_outcome_pairs', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  cohortId:              uuid('cohort_id').notNull().references(() => anonHealthCohorts.id),

  // Exposure
  exposureType:          text('exposure_type').notNull(),        // 'product' | 'ingredient' | 'food_category' | 'additive'
  exposureKey:           text('exposure_key').notNull(),         // canonical identity key — NOT NULL, used by the UNIQUE + upsert ON CONFLICT
  exposureProductId:     text('exposure_product_id'),            // mirrors exposureKey when type='product' (keeps idx_eop_product usable)
  exposureIngredient:    text('exposure_ingredient'),            // mirrors exposureKey when type='ingredient'
  exposureFoodCategory:  text('exposure_food_category'),
  exposureAdditiveCode:  text('exposure_additive_code'),

  // Outcome
  outcomeEventType:      text('outcome_event_type').notNull(),
  outcomeSeverityAvg:    real('outcome_severity_avg').notNull(),
  outcomeSeverityP90:    real('outcome_severity_p90').notNull(),
  onsetLagHoursAvg:      real('onset_lag_hours_avg').notNull(),
  onsetLagHoursP50:      real('onset_lag_hours_p50').notNull(),
  onsetLagHoursP90:      real('onset_lag_hours_p90').notNull(),

  // Statistics
  exposureCount:         integer('exposure_count').notNull(),
  outcomeCount:          integer('outcome_count').notNull(),
  outcomeRate:           real('outcome_rate').notNull(),
  baselineRate:          real('baseline_rate'),
  relativeRisk:          real('relative_risk'),
  confidenceLow:         real('confidence_low'),
  confidenceHigh:        real('confidence_high'),
  pValue:                real('p_value'),
  isSignificant:         boolean('is_significant').notNull(),

  replicationCohortCount: integer('replication_cohort_count').notNull().default(1),
  firstObservedAt:       timestamp('first_observed_at', { withTimezone: true }).notNull().defaultNow(),
  lastUpdatedAt:         timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),

  // Temporal decay — weekly job decays signalWeight unless a fresh observation lands
  signalWeight:          real('signal_weight').notNull().default(1.0),
  lastReplicatedAt:      timestamp('last_replicated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  identity: uniqueIndex('uq_eop_identity').on(t.cohortId, t.exposureType, t.exposureKey, t.outcomeEventType),
}))

// ── 3. anon_ingredient_harm_index ───────────────────────────────────────────

export const anonIngredientHarmIndex = brioela.table('anon_ingredient_harm_index', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  ingredientName:        text('ingredient_name').notNull(),
  ingredientAliases:     text('ingredient_aliases').array().notNull(),
  conditionTag:          text('condition_tag').notNull(),
  medicationCategory:    text('medication_category').notNull().default(''),  // '' = all meds. NOT NULL so the uniqueIndex below cannot be bypassed (Postgres NULL != NULL)
  eventType:             text('event_type').notNull(),

  harmSignal:            real('harm_signal').notNull(),
  severityMedian:        real('severity_median').notNull(),
  severityP90:           real('severity_p90').notNull(),
  onsetLagHoursMedian:   real('onset_lag_hours_median').notNull(),
  supportingCohortCount: integer('supporting_cohort_count').notNull(),
  totalExposureCount:    integer('total_exposure_count').notNull(),
  totalOutcomeCount:     integer('total_outcome_count').notNull(),

  sourceTypes:           text('source_types').array().notNull(),
  lastUpdatedAt:         timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueSignal: uniqueIndex('uq_ingredient_harm').on(t.ingredientName, t.conditionTag, t.medicationCategory, t.eventType),
}))

// ── 4. product_community_trust ──────────────────────────────────────────────

export const productCommunityTrust = brioela.table('product_community_trust', {
  productId:                  text('product_id').primaryKey(),

  trustScore:                 real('trust_score').notNull(),
  dataRichness:               real('data_richness').notNull(),
  controversyScore:           real('controversy_score').notNull(),

  totalScans:                 integer('total_scans').notNull().default(0),
  uniqueCohortCount:          integer('unique_cohort_count').notNull().default(0),

  adverseEventRate:           real('adverse_event_rate'),
  allergenCommunityFlags:     jsonb('allergen_community_flags'),
  highRiskConditionTags:      text('high_risk_condition_tags').array(),

  labelAccuracyScore:         real('label_accuracy_score'),
  ingredientConflictCount:    integer('ingredient_conflict_count').notNull().default(0),

  lastScanAt:                 timestamp('last_scan_at', { withTimezone: true }),
  lastUpdatedAt:              timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 5. anon_drug_food_interactions ──────────────────────────────────────────

export const anonDrugFoodInteractions = brioela.table('anon_drug_food_interactions', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  drugCategory:         text('drug_category').notNull(),
  foodIngredient:       text('food_ingredient').notNull(),
  foodCategory:         text('food_category'),

  interactionType:      text('interaction_type').notNull(),
  interactionDirection: text('interaction_direction').notNull(),

  communitySignal:      real('community_signal').notNull(),
  clinicalEvidence:     text('clinical_evidence'),
  severityCategory:     text('severity_category').notNull(),

  cohortCount:          integer('cohort_count').notNull(),
  observationCount:     integer('observation_count').notNull(),
  clinicalSources:      text('clinical_sources').array(),

  firstObservedAt:      timestamp('first_observed_at', { withTimezone: true }).notNull().defaultNow(),
  lastUpdatedAt:        timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueInteraction: uniqueIndex('uq_drug_food').on(t.drugCategory, t.foodIngredient, t.interactionType),
}))

// ── 6. anon_temporal_harm_patterns ──────────────────────────────────────────

export const anonTemporalHarmPatterns = brioela.table('anon_temporal_harm_patterns', {
  id:               uuid('id').primaryKey().defaultRandom(),
  cohortId:         uuid('cohort_id').notNull().references(() => anonHealthCohorts.id),
  exposureType:     text('exposure_type').notNull(),
  exposureKey:      text('exposure_key').notNull(),
  eventType:        text('event_type').notNull(),

  hourRiskProfile:  jsonb('hour_risk_profile').notNull(),    // {0: 1.0, 6: 0.8, ...}
  weekdayProfile:   jsonb('weekday_profile'),
  seasonalProfile:  jsonb('seasonal_profile'),

  observationCount: integer('observation_count').notNull(),
  lastUpdatedAt:    timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 7. anon_geographic_health_patterns ──────────────────────────────────────

export const anonGeographicHealthPatterns = brioela.table('anon_geographic_health_patterns', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  geohash5:              text('geohash_5').notNull(),
  observationPeriod:     text('observation_period').notNull(),   // '2026-Q2'

  conditionPrevalence:   jsonb('condition_prevalence').notNull(),
  topScannedIngredients: text('top_scanned_ingredients').array().notNull(),
  highRiskIngredients:   jsonb('high_risk_ingredients'),
  topEventTypes:         jsonb('top_event_types').notNull(),

  populationSizeBucket:  text('population_size_bucket').notNull(),
  lastUpdatedAt:         timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueGeoperiod: uniqueIndex('uq_geo_period').on(t.geohash5, t.observationPeriod),
}))

// ── 8. anon_association_candidates ──────────────────────────────────────────

export const anonAssociationCandidates = brioela.table('anon_association_candidates', {
  id:                   uuid('id').primaryKey().defaultRandom(),

  exposureFeature:      jsonb('exposure_feature').notNull(),
  outcomeFeature:       jsonb('outcome_feature').notNull(),
  cohortFeature:        jsonb('cohort_feature').notNull(),

  effectSize:           real('effect_size').notNull(),
  pValue:               real('p_value').notNull(),
  confidenceInterval:   jsonb('confidence_interval').notNull(),
  sampleSize:           integer('sample_size').notNull(),
  replicationCount:     integer('replication_count').notNull(),

  confoundersAddressed: text('confounders_addressed').array(),
  biasFlags:            text('bias_flags').array(),
  strengthRating:       text('strength_rating').notNull(),

  plainLanguageFinding: text('plain_language_finding').notNull(),

  promotedToHarmIndex:  boolean('promoted_to_harm_index').default(false),
  firstObservedAt:      timestamp('first_observed_at', { withTimezone: true }).notNull().defaultNow(),
  lastReplicatedAt:     timestamp('last_replicated_at', { withTimezone: true }).notNull().defaultNow(),
})
```

---

## Indexes

```sql
-- anon_exposure_outcome_pairs
CREATE INDEX idx_eop_product     ON brioela.anon_exposure_outcome_pairs (exposure_product_id, outcome_event_type, is_significant);
CREATE INDEX idx_eop_ingredient  ON brioela.anon_exposure_outcome_pairs (exposure_ingredient, outcome_event_type, is_significant);
CREATE INDEX idx_eop_rr          ON brioela.anon_exposure_outcome_pairs (relative_risk DESC) WHERE is_significant = true;
CREATE INDEX idx_eop_cohort      ON brioela.anon_exposure_outcome_pairs (cohort_id, is_significant);

-- anon_ingredient_harm_index
CREATE INDEX idx_ihi_ingredient  ON brioela.anon_ingredient_harm_index (ingredient_name, harm_signal DESC);
CREATE INDEX idx_ihi_condition   ON brioela.anon_ingredient_harm_index (condition_tag, harm_signal DESC);
CREATE INDEX idx_ihi_aliases     ON brioela.anon_ingredient_harm_index USING GIN (ingredient_aliases);

-- product_community_trust
CREATE INDEX idx_pct_adverse     ON brioela.product_community_trust (adverse_event_rate DESC NULLS LAST);
CREATE INDEX idx_pct_trust       ON brioela.product_community_trust (trust_score);
CREATE INDEX idx_pct_flags       ON brioela.product_community_trust USING GIN (allergen_community_flags);
CREATE INDEX idx_pct_conditions  ON brioela.product_community_trust USING GIN (high_risk_condition_tags);

-- anon_drug_food_interactions
CREATE INDEX idx_dfi_drug        ON brioela.anon_drug_food_interactions (drug_category, severity_category);
CREATE INDEX idx_dfi_ingredient  ON brioela.anon_drug_food_interactions (food_ingredient, severity_category);

-- anon_cohorts
CREATE INDEX idx_cohorts_conditions  ON brioela.anon_health_cohorts USING GIN (condition_tags);
CREATE INDEX idx_cohorts_medications ON brioela.anon_health_cohorts USING GIN (medication_categories);

-- anon_geographic
CREATE INDEX idx_ghp_geohash     ON brioela.anon_geographic_health_patterns (geohash_5);

-- anon_association_candidates
CREATE INDEX idx_ac_strength     ON brioela.anon_association_candidates (strength_rating, replication_count DESC);
CREATE INDEX idx_ac_promoted     ON brioela.anon_association_candidates (promoted_to_harm_index) WHERE promoted_to_harm_index = false;
```

---

## Postgres Functions (Upsert Helpers)

The Health Agent calls these via `supabase.rpc()`. They handle upsert logic, statistical recomputation, and significance testing atomically.

```sql
-- Upsert an exposure-outcome pair, recomputing statistics
CREATE OR REPLACE FUNCTION brioela.upsert_exposure_outcome_pair(
  p_cohort_id         UUID,
  p_exposure_type     TEXT,
  p_exposure_key      TEXT,
  p_outcome_event_type TEXT,
  p_onset_lag_hours   REAL,
  p_severity          REAL
) RETURNS void AS $$
BEGIN
  INSERT INTO brioela.anon_exposure_outcome_pairs (
    cohort_id, exposure_type, exposure_key,
    exposure_product_id, exposure_ingredient, exposure_food_category, exposure_additive_code,
    outcome_event_type,
    outcome_severity_avg, outcome_severity_p90,
    onset_lag_hours_avg, onset_lag_hours_p50, onset_lag_hours_p90,
    exposure_count, outcome_count, outcome_rate, is_significant,
    signal_weight, last_replicated_at, last_updated_at
  ) VALUES (
    p_cohort_id, p_exposure_type, p_exposure_key,
    -- route the canonical key into the matching type-specific column so its index stays usable
    CASE WHEN p_exposure_type = 'product'       THEN p_exposure_key END,
    CASE WHEN p_exposure_type = 'ingredient'    THEN p_exposure_key END,
    CASE WHEN p_exposure_type = 'food_category' THEN p_exposure_key END,
    CASE WHEN p_exposure_type = 'additive'      THEN p_exposure_key END,
    p_outcome_event_type,
    p_severity, p_severity,
    p_onset_lag_hours, p_onset_lag_hours, p_onset_lag_hours,
    1, 1, 1.0, false,
    1.0, now(), now()
  )
  ON CONFLICT (cohort_id, exposure_type, exposure_key, outcome_event_type)
  DO UPDATE SET
    outcome_count     = anon_exposure_outcome_pairs.outcome_count + 1,
    exposure_count    = anon_exposure_outcome_pairs.exposure_count + 1,
    outcome_rate      = (anon_exposure_outcome_pairs.outcome_count + 1.0) / (anon_exposure_outcome_pairs.exposure_count + 1),
    outcome_severity_avg = (anon_exposure_outcome_pairs.outcome_severity_avg + p_severity) / 2,
    onset_lag_hours_avg  = (anon_exposure_outcome_pairs.onset_lag_hours_avg + p_onset_lag_hours) / 2,
    signal_weight     = 1.0,    -- fresh observation re-lifts the signal to full weight
    last_replicated_at = now(),
    last_updated_at   = now();
END;
$$ LANGUAGE plpgsql;

-- Weekly temporal decay — runs from the same background job that refreshes the
-- materialized views. Any pair not replicated in the last week loses weight; an
-- 18-month-old signal with no new evidence decays toward zero instead of sitting
-- at full strength forever. Fresh observations reset signal_weight to 1.0 above.
CREATE OR REPLACE FUNCTION brioela.decay_exposure_outcome_weights()
RETURNS void AS $$
BEGIN
  UPDATE brioela.anon_exposure_outcome_pairs
  SET signal_weight = GREATEST(
        0.0,
        -- 0.92 per week since last replication ≈ half-life of ~8 weeks
        POWER(0.92, EXTRACT(EPOCH FROM (now() - last_replicated_at)) / (7 * 24 * 3600))
      )
  WHERE last_replicated_at < now() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Increment product conflict count (label extraction vs database mismatch)
CREATE OR REPLACE FUNCTION brioela.increment_product_conflict(p_product_id TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO brioela.product_community_trust (product_id, trust_score, data_richness, controversy_score, ingredient_conflict_count, last_updated_at)
  VALUES (p_product_id, 0.5, 0.1, 0.5, 1, now())
  ON CONFLICT (product_id) DO UPDATE SET
    ingredient_conflict_count = product_community_trust.ingredient_conflict_count + 1,
    controversy_score = LEAST(1.0, product_community_trust.controversy_score + 0.05),
    last_updated_at = now();
END;
$$ LANGUAGE plpgsql;
```

---

## Materialized Views — Fast Queries at Scale

Two materialized views for the highest-frequency query patterns. Refreshed weekly by the background job.

```sql
-- Top ingredient-harm pairs across all cohorts — refreshed weekly
CREATE MATERIALIZED VIEW brioela.mv_top_ingredient_harms AS
SELECT
  ingredient_name,
  condition_tag,
  event_type,
  MAX(harm_signal)            AS max_harm_signal,
  SUM(total_exposure_count)   AS total_exposures,
  SUM(total_outcome_count)    AS total_outcomes,
  array_agg(DISTINCT source_types) AS all_sources
FROM brioela.anon_ingredient_harm_index
WHERE harm_signal > 0.5 AND supporting_cohort_count >= 3
GROUP BY ingredient_name, condition_tag, event_type
ORDER BY max_harm_signal DESC;

CREATE UNIQUE INDEX ON brioela.mv_top_ingredient_harms (ingredient_name, condition_tag, event_type);

-- Products with elevated adverse rates — refreshed weekly
CREATE MATERIALIZED VIEW brioela.mv_flagged_products AS
SELECT
  p.id, p.name, p.upc,
  pct.trust_score,
  pct.adverse_event_rate,
  pct.allergen_community_flags,
  pct.high_risk_condition_tags,
  pct.controversy_score
FROM brioela.product_community_trust pct
JOIN brioela.products p ON p.id = pct.product_id
WHERE pct.adverse_event_rate > 0.01   -- > 1 adverse event per 100 scans
   OR pct.controversy_score > 0.6;

CREATE UNIQUE INDEX ON brioela.mv_flagged_products (id);
```
