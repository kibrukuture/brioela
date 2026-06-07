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

// ── 1. anonymous_health_groups ───────────────────────────────────────────────

export const anonymousHealthGroups = brioela.table('anonymous_health_groups', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  kAnonymityGroupSize:    integer('k_anonymity_group_size').notNull(),
  ageBucket:              text('age_bucket').notNull(),
  sexBucket:              text('sex_bucket'),
  regionBucket:           text('region_bucket').notNull(),
  reportedConditionTags:  text('reported_condition_tags').array().notNull(),
  medicationCategories:   text('medication_categories').array().notNull(),
  dietaryTags:            text('dietary_tags').array().notNull(),

  // Enrichment — keeps anonymous groups specific enough that aggregate signals are not noise.
  dietaryPatternSignature: text('dietary_pattern_signature').notNull().default(''),
  cuisineProfile:          jsonb('cuisine_profile').notNull().default({}),
  metabolicMarkerBucket:   text('metabolic_marker_bucket').notNull().default('unknown'),

  anonymousHealthGroupHash: text('anonymous_health_group_hash').notNull().unique(),
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 2. anonymous_exposure_event_associations ────────────────────────────────

export const anonymousExposureEventAssociations = brioela.table('anonymous_exposure_event_associations', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  anonymousHealthGroupId: uuid('anonymous_health_group_id').notNull().references(() => anonymousHealthGroups.id),

  // Exposure
  exposureKind:          text('exposure_kind').notNull(),        // 'product' | 'ingredient' | 'food_category' | 'additive'
  exposureKey:           text('exposure_key').notNull(),         // canonical identity key — NOT NULL, used by the UNIQUE + upsert ON CONFLICT
  exposureProductId:     text('exposure_product_id'),            // mirrors exposureKey when type='product' (keeps idx_eop_product usable)
  exposureIngredientName: text('exposure_ingredient_name'),       // mirrors exposureKey when type='ingredient'
  exposureFoodCategory:  text('exposure_food_category'),
  exposureAdditiveCode:  text('exposure_additive_code'),

  // Post-exposure reported event
  postExposureEventKind: text('post_exposure_event_kind').notNull(),
  eventSeverityAverage:  real('event_severity_average').notNull(),
  eventSeverityP90:      real('event_severity_p90').notNull(),
  onsetLagHoursAvg:      real('onset_lag_hours_avg').notNull(),
  onsetLagHoursP50:      real('onset_lag_hours_p50').notNull(),
  onsetLagHoursP90:      real('onset_lag_hours_p90').notNull(),

  // Statistics
  exposureCount:         integer('exposure_count').notNull(),
  postExposureEventCount: integer('post_exposure_event_count').notNull(),
  postExposureEventRate: real('post_exposure_event_rate').notNull(),
  comparisonEventRate:   real('comparison_event_rate'),
  observedRateRatio:     real('observed_rate_ratio'),
  rateRatioConfidenceLow: real('rate_ratio_confidence_low'),
  rateRatioConfidenceHigh: real('rate_ratio_confidence_high'),
  pValue:                real('p_value'),
  statisticalThresholdPassed: boolean('statistical_threshold_passed').notNull(),

  supportingHealthGroupCount: integer('supporting_health_group_count').notNull().default(1),
  firstObservedAt:       timestamp('first_observed_at', { withTimezone: true }).notNull().defaultNow(),
  lastUpdatedAt:         timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),

  // Temporal decay — weekly job decays recencyWeight unless a fresh observation lands.
  recencyWeight:         real('recency_weight').notNull().default(1.0),
  lastReplicatedAt:      timestamp('last_replicated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  identity: uniqueIndex('uq_anonymous_exposure_event_association').on(t.anonymousHealthGroupId, t.exposureKind, t.exposureKey, t.postExposureEventKind),
}))

// ── 3. anonymous_ingredient_event_association_index ─────────────────────────

export const anonymousIngredientEventAssociationIndex = brioela.table('anonymous_ingredient_event_association_index', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  ingredientName:        text('ingredient_name').notNull(),
  ingredientAliases:     text('ingredient_aliases').array().notNull(),
  reportedConditionTag:  text('reported_condition_tag').notNull(),
  medicationCategory:    text('medication_category').notNull().default(''),  // '' = all meds. NOT NULL so the uniqueIndex below cannot be bypassed (Postgres NULL != NULL)
  postExposureEventKind: text('post_exposure_event_kind').notNull(),

  eventAssociationScore: real('event_association_score').notNull(),
  eventSeverityMedian:   real('event_severity_median').notNull(),
  eventSeverityP90:      real('event_severity_p90').notNull(),
  postExposureLagHoursMedian: real('post_exposure_lag_hours_median').notNull(),
  supportingHealthGroupCount: integer('supporting_health_group_count').notNull(),
  totalExposureCount:    integer('total_exposure_count').notNull(),
  totalPostExposureEventCount: integer('total_post_exposure_event_count').notNull(),

  evidenceSourceTypes:   text('evidence_source_types').array().notNull(),
  lastUpdatedAt:         timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueSignal: uniqueIndex('uq_ingredient_event_association').on(t.ingredientName, t.reportedConditionTag, t.medicationCategory, t.postExposureEventKind),
}))

// ── 4. product_community_health_summary ─────────────────────────────────────

export const productCommunityHealthSummary = brioela.table('product_community_health_summary', {
  productId:                  text('product_id').primaryKey(),

  communityHealthConfidenceScore: real('community_health_confidence_score').notNull(),
  communityEvidenceVolumeScore: real('community_evidence_volume_score').notNull(),
  communityEvidenceDisagreementScore: real('community_evidence_disagreement_score').notNull(),

  totalScans:                 integer('total_scans').notNull().default(0),
  uniqueHealthGroupCount:     integer('unique_health_group_count').notNull().default(0),

  reportedEventRate:          real('reported_event_rate'),
  reportedAllergenEventRates: jsonb('reported_allergen_event_rates'),
  conditionTagsWithElevatedEventRates: text('condition_tags_with_elevated_event_rates').array(),

  labelMatchScore:            real('label_match_score'),
  labelIngredientMismatchCount: integer('label_ingredient_mismatch_count').notNull().default(0),

  lastScanAt:                 timestamp('last_scan_at', { withTimezone: true }),
  lastUpdatedAt:              timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 5. anonymous_medication_food_event_associations ─────────────────────────

export const anonymousMedicationFoodEventAssociations = brioela.table('anonymous_medication_food_event_associations', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  medicationCategory:   text('medication_category').notNull(),
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
  uniqueInteraction: uniqueIndex('uq_medication_food_event_association').on(t.medicationCategory, t.foodIngredient, t.interactionType),
}))

// ── 6. anonymous_time_of_day_event_patterns ─────────────────────────────────

export const anonymousTimeOfDayEventPatterns = brioela.table('anonymous_time_of_day_event_patterns', {
  id:               uuid('id').primaryKey().defaultRandom(),
  anonymousHealthGroupId: uuid('anonymous_health_group_id').notNull().references(() => anonymousHealthGroups.id),
  exposureKind:     text('exposure_kind').notNull(),
  exposureKey:      text('exposure_key').notNull(),
  postExposureEventKind: text('post_exposure_event_kind').notNull(),

  hourEventRateProfile: jsonb('hour_event_rate_profile').notNull(),    // {0: 1.0, 6: 0.8, ...}
  weekdayProfile:   jsonb('weekday_profile'),
  seasonalProfile:  jsonb('seasonal_profile'),

  observationCount: integer('observation_count').notNull(),
  lastUpdatedAt:    timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 7. anonymous_region_event_patterns ──────────────────────────────────────

export const anonymousRegionEventPatterns = brioela.table('anonymous_region_event_patterns', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  geohash5:              text('geohash_5').notNull(),
  observationPeriod:     text('observation_period').notNull(),   // '2026-Q2'

  reportedConditionDistribution: jsonb('reported_condition_distribution').notNull(),
  topScannedIngredients: text('top_scanned_ingredients').array().notNull(),
  ingredientsWithElevatedEventRates: jsonb('ingredients_with_elevated_event_rates'),
  topEventTypes:         jsonb('top_event_types').notNull(),

  populationSizeBucket:  text('population_size_bucket').notNull(),
  lastUpdatedAt:         timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueGeoperiod: uniqueIndex('uq_geo_period').on(t.geohash5, t.observationPeriod),
}))

// ── 8. anonymous_research_association_candidates ────────────────────────────

export const anonymousResearchAssociationCandidates = brioela.table('anonymous_research_association_candidates', {
  id:                   uuid('id').primaryKey().defaultRandom(),

  exposureFeature:      jsonb('exposure_feature').notNull(),
  postExposureEventFeature: jsonb('post_exposure_event_feature').notNull(),
  cohortFeature:        jsonb('cohort_feature').notNull(),

  effectSize:           real('effect_size').notNull(),
  pValue:               real('p_value').notNull(),
  confidenceInterval:   jsonb('confidence_interval').notNull(),
  sampleSize:           integer('sample_size').notNull(),
  replicationCount:     integer('replication_count').notNull(),

  confoundersAddressed: text('confounders_addressed').array(),
  biasFlags:            text('bias_flags').array(),
  strengthRating:       text('strength_rating').notNull(),

  plainLanguageAssociationSummary: text('plain_language_association_summary').notNull(),

  promotedToSignalIndex: boolean('promoted_to_signal_index').default(false),
  firstObservedAt:      timestamp('first_observed_at', { withTimezone: true }).notNull().defaultNow(),
  lastReplicatedAt:     timestamp('last_replicated_at', { withTimezone: true }).notNull().defaultNow(),
})
```

---

## Indexes

```sql
-- anonymous_exposure_event_associations
CREATE INDEX idx_eea_product     ON brioela.anonymous_exposure_event_associations (exposure_product_id, post_exposure_event_kind, statistical_threshold_passed);
CREATE INDEX idx_eea_ingredient  ON brioela.anonymous_exposure_event_associations (exposure_ingredient_name, post_exposure_event_kind, statistical_threshold_passed);
CREATE INDEX idx_eea_ratio       ON brioela.anonymous_exposure_event_associations (observed_rate_ratio DESC) WHERE statistical_threshold_passed = true;
CREATE INDEX idx_eea_group       ON brioela.anonymous_exposure_event_associations (anonymous_health_group_id, statistical_threshold_passed);

-- anonymous_ingredient_event_association_index
CREATE INDEX idx_ieai_ingredient ON brioela.anonymous_ingredient_event_association_index (ingredient_name, event_association_score DESC);
CREATE INDEX idx_ieai_condition  ON brioela.anonymous_ingredient_event_association_index (reported_condition_tag, event_association_score DESC);
CREATE INDEX idx_ieai_aliases    ON brioela.anonymous_ingredient_event_association_index USING GIN (ingredient_aliases);

-- product_community_health_summary
CREATE INDEX idx_pchs_event_rate ON brioela.product_community_health_summary (reported_event_rate DESC NULLS LAST);
CREATE INDEX idx_pchs_confidence ON brioela.product_community_health_summary (community_health_confidence_score);
CREATE INDEX idx_pchs_allergens  ON brioela.product_community_health_summary USING GIN (reported_allergen_event_rates);
CREATE INDEX idx_pchs_conditions ON brioela.product_community_health_summary USING GIN (condition_tags_with_elevated_event_rates);

-- anonymous_medication_food_event_associations
CREATE INDEX idx_mfea_medication ON brioela.anonymous_medication_food_event_associations (medication_category, severity_category);
CREATE INDEX idx_mfea_ingredient ON brioela.anonymous_medication_food_event_associations (food_ingredient, severity_category);

-- anonymous_health_groups
CREATE INDEX idx_ahg_conditions  ON brioela.anonymous_health_groups USING GIN (reported_condition_tags);
CREATE INDEX idx_ahg_medications ON brioela.anonymous_health_groups USING GIN (medication_categories);

-- anonymous_region_event_patterns
CREATE INDEX idx_rep_geohash     ON brioela.anonymous_region_event_patterns (geohash_5);

-- anonymous_research_association_candidates
CREATE INDEX idx_rac_strength    ON brioela.anonymous_research_association_candidates (strength_rating, replication_count DESC);
CREATE INDEX idx_rac_promoted    ON brioela.anonymous_research_association_candidates (promoted_to_signal_index) WHERE promoted_to_signal_index = false;
```

---

## Postgres Functions (Upsert Helpers)

The Health Agent calls these via `supabase.rpc()`. They handle upsert logic, statistical recomputation, and significance testing atomically.

```sql
-- Upsert an exposure-event association, recomputing statistics
CREATE OR REPLACE FUNCTION brioela.upsert_exposure_event_association(
  p_anonymous_health_group_id UUID,
  p_exposure_kind     TEXT,
  p_exposure_key      TEXT,
  p_post_exposure_event_kind TEXT,
  p_onset_lag_hours   REAL,
  p_severity          REAL
) RETURNS void AS $$
BEGIN
  INSERT INTO brioela.anonymous_exposure_event_associations (
    anonymous_health_group_id, exposure_kind, exposure_key,
    exposure_product_id, exposure_ingredient_name, exposure_food_category, exposure_additive_code,
    post_exposure_event_kind,
    event_severity_average, event_severity_p90,
    onset_lag_hours_avg, onset_lag_hours_p50, onset_lag_hours_p90,
    exposure_count, post_exposure_event_count, post_exposure_event_rate, statistical_threshold_passed,
    recency_weight, last_replicated_at, last_updated_at
  ) VALUES (
    p_anonymous_health_group_id, p_exposure_kind, p_exposure_key,
    -- route the canonical key into the matching type-specific column so its index stays usable
    CASE WHEN p_exposure_kind = 'product'       THEN p_exposure_key END,
    CASE WHEN p_exposure_kind = 'ingredient'    THEN p_exposure_key END,
    CASE WHEN p_exposure_kind = 'food_category' THEN p_exposure_key END,
    CASE WHEN p_exposure_kind = 'additive'      THEN p_exposure_key END,
    p_post_exposure_event_kind,
    p_severity, p_severity,
    p_onset_lag_hours, p_onset_lag_hours, p_onset_lag_hours,
    1, 1, 1.0, false,
    1.0, now(), now()
  )
  ON CONFLICT (anonymous_health_group_id, exposure_kind, exposure_key, post_exposure_event_kind)
  DO UPDATE SET
    post_exposure_event_count = anonymous_exposure_event_associations.post_exposure_event_count + 1,
    exposure_count    = anonymous_exposure_event_associations.exposure_count + 1,
    post_exposure_event_rate = (anonymous_exposure_event_associations.post_exposure_event_count + 1.0) / (anonymous_exposure_event_associations.exposure_count + 1),
    event_severity_average = (anonymous_exposure_event_associations.event_severity_average + p_severity) / 2,
    onset_lag_hours_avg = (anonymous_exposure_event_associations.onset_lag_hours_avg + p_onset_lag_hours) / 2,
    recency_weight    = 1.0,    -- fresh observation re-lifts the signal to full weight
    last_replicated_at = now(),
    last_updated_at   = now();
END;
$$ LANGUAGE plpgsql;

-- Weekly temporal decay — runs from the same background job that refreshes the
-- materialized views. Any pair not replicated in the last week loses weight; an
-- 18-month-old signal with no new evidence decays toward zero instead of sitting
-- at full strength forever. Fresh observations reset recency_weight to 1.0 above.
CREATE OR REPLACE FUNCTION brioela.decay_exposure_event_recency_weights()
RETURNS void AS $$
BEGIN
  UPDATE brioela.anonymous_exposure_event_associations
  SET recency_weight = GREATEST(
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
  INSERT INTO brioela.product_community_health_summary (product_id, community_health_confidence_score, community_evidence_volume_score, community_evidence_disagreement_score, label_ingredient_mismatch_count, last_updated_at)
  VALUES (p_product_id, 0.5, 0.1, 0.5, 1, now())
  ON CONFLICT (product_id) DO UPDATE SET
    label_ingredient_mismatch_count = product_community_health_summary.label_ingredient_mismatch_count + 1,
    community_evidence_disagreement_score = LEAST(1.0, product_community_health_summary.community_evidence_disagreement_score + 0.05),
    last_updated_at = now();
END;
$$ LANGUAGE plpgsql;
```

---

## Materialized Views — Fast Queries at Scale

Two materialized views for the highest-frequency query patterns. Refreshed weekly by the background job.

```sql
-- Top ingredient-event associations across all anonymous health groups — refreshed weekly
CREATE MATERIALIZED VIEW brioela.mv_top_ingredient_event_associations AS
SELECT
  ingredient_name,
  reported_condition_tag,
  post_exposure_event_kind,
  MAX(event_association_score) AS max_event_association_score,
  SUM(total_exposure_count)   AS total_exposures,
  SUM(total_post_exposure_event_count) AS total_post_exposure_events,
  array_agg(DISTINCT evidence_source_types) AS all_sources
FROM brioela.anonymous_ingredient_event_association_index
WHERE event_association_score > 0.5 AND supporting_health_group_count >= 3
GROUP BY ingredient_name, reported_condition_tag, post_exposure_event_kind
ORDER BY max_event_association_score DESC;

CREATE UNIQUE INDEX ON brioela.mv_top_ingredient_event_associations (ingredient_name, reported_condition_tag, post_exposure_event_kind);

-- Products with elevated adverse rates — refreshed weekly
CREATE MATERIALIZED VIEW brioela.mv_flagged_products AS
SELECT
  p.id, p.name, p.upc,
  pchs.community_health_confidence_score,
  pchs.reported_event_rate,
  pchs.reported_allergen_event_rates,
  pchs.condition_tags_with_elevated_event_rates,
  pchs.community_evidence_disagreement_score
FROM brioela.product_community_health_summary pchs
JOIN brioela.products p ON p.id = pchs.product_id
WHERE pchs.reported_event_rate > 0.01   -- > 1 reported event per 100 scans
   OR pchs.community_evidence_disagreement_score > 0.6;

CREATE UNIQUE INDEX ON brioela.mv_flagged_products (id);
```
