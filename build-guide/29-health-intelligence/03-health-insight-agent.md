# Health Intelligence — Health Insight Agent

## What This File Covers

The Health Insight Agent: a weekly per-user background agent that reads bounded private health data, detects food-health correlations, enforces explicit contribution consent and k-anonymity, and writes eligible anonymized aggregate evidence to community Postgres tables.

---

## Architecture — Brain-Owned Health Pass

The Health Insight Agent is a per-run sub-agent/facet started by the Brain. It does not own user
truth. The Brain remains the only writer of user SQLite truth.

The Health Insight Agent can reason over a bounded snapshot and propose writes. The Brain performs
the actual reads/writes through typed parent calls or Brain-owned tools. Do not use custom
`/internal/tool-call` HTTP forwarding for this path unless a later platform boundary requires it.

```
scheduled_alarms row: health_insight_run
  ↓
Brain wake method runs
  ↓
Brain starts HealthInsightAgent sub-agent/run
  key: health_{userId}_{runId}
  no user-truth ownership
  ↓
HealthInsightAgent receives bounded snapshot:
  - All active medications
  - health_events from last 14 days
  - health_captures from last 14 days
  - memory_event (scan history, food consumption) from last 14 days
  ↓
Detects correlations → builds anonymized signals
  ↓
k-anonymity check via Supabase:
  Does the cohort have >= 100 members?
  No → Brain stores pending contribution in agent_state, retry next week
  Yes + user opted in → write eligible aggregate evidence to community Postgres tables
  ↓
Brain writes action outcome to scheduled_alarms.action_outcome_status/action_outcome_json and schedules next health_insight_run
```

---

## Capability Subset for Health Insight Agent

The Health Insight Agent is allowed only these Brain-owned capabilities:

```typescript
health_insight: [
  // Read tools
  'get_medications_for_health_insight',     // all active medications
  'get_health_events_since',              // health_events since N days ago
  'get_health_captures_since',            // health_captures (measurements, labs, documents) since N days ago
  'get_memory_events_since',              // scan + food history from memory_event
  // Write tools
  'write_user_memory',                    // write detected patterns to user_memory (patterns.* namespace)
  'schedule_user_alarm',                  // create next scheduled_alarms row
  // Community write (direct Supabase — not via Brain SQLite)
  'write_community_health_signal',        // writes to anonymized community Postgres tables after k-anonymity
]
```

These are capability names, not permission to query arbitrary SQLite. The Brain exposes only
bounded methods needed for the pass.

---

## The Three Passes

### Pass 1 — Food-Health Correlation Detection

The agent reads all health events from the last 14 days and all scan/food events from the same window. It looks for temporal correlations: food consumed → health event within a lag window.

```typescript
const HEALTH_AGENT_CORRELATION_PROMPT = `
You are Brioela's Health Insight Agent. You have a complete 14-day history of this user's food consumption and health events.

Your job: find food-health correlations worth recording.

For each health event:
1. Look at what was consumed in the 0–72 hours before the event
2. Identify candidate food exposures (specific products, ingredients, or food categories)
3. Compute approximate onset lag (hours between exposure and event)
4. Rate your confidence (0.0–1.0)

Only report correlations that:
- Have occurred at least 2 times in the last 14 days (or 1 time if very high severity ≥ 7)
- Have a plausible onset lag (0–72 hours depending on event type)
- Are not obviously explained by a known condition or medication effect already captured

Return JSON array:
[{
  "exposure_type": "product" | "ingredient" | "food_category",
  "exposure_key": string,    // product_id, ingredient name, or category
  "post_exposure_event_kind": string,
  "onset_lag_hours": number,
  "confidence": number,
  "exposure_count": number,
  "post_exposure_event_count": number,
  "occurrence_count": number,
  "plain_language": string   // "You tend to feel tired about 4 hours after eating X"
}]

Return empty array if no meaningful correlations found. Never fabricate correlations.
`
```

Detected correlations are written to `user_memory` under `patterns.*` namespace (personal, private). If the user explicitly opted into health contribution and the anonymous health group has k ≥ 100 members, eligible aggregate fields are also written to `anonymous_exposure_event_associations` (anonymous, community).

---

### Pass 2 — Medication Adherence and Caution Summary

Reviews the last 7 days of fired `scheduled_alarms` where `alarm_type = 'medication_reminder'`. Adherence per medication = fraction of those alarms whose `action_outcome_json.took = 1` (alarms still `action_outcome_status = 'missed'` or with `took = 0` count against it). For any medication with adherence < 70% over 7 days:
- Writes a note to `user_memory` under `health.medication_adherence`
- Schedules a check-in via the voice agent at the next appropriate time

Also cross-references active medications against product scans:
- "You scanned 6 products containing Vitamin K this week while on Warfarin — here are the ones flagged."
- Writes summary to `user_memory` under `health.medication_food_exposure_summary`

---

### Pass 3 — k-Anonymous Community Contribution

This is the pass that makes Brioela's data better for everyone who opted into health contribution.

```typescript
async function runCommunityContributionPass(
  correlations: DetectedCorrelation[],
  userId:        string,
  db:            DrizzleDB,
  env:           Env,
): Promise<void> {
  if (!hasHealthContributionOptIn(db, userId)) return

  // Build user's anonymous health group fingerprint from approved derived fields only.
  const anonymousHealthGroupFingerprint = buildAnonymousHealthGroupFingerprint(db, userId)

  // Check if this anonymous health group exists in Supabase — and if it has >= 100 members
  const { data: anonymousHealthGroup } = await supabase
    .from('brioela.anonymous_health_groups')
    .select('id, k_anonymity_group_size')
    .eq('anonymous_health_group_hash', anonymousHealthGroupFingerprint.hash)
    .maybeSingle()

  if (!anonymousHealthGroup || anonymousHealthGroup.k_anonymity_group_size < 100) {
    // Anonymous health group too small — store locally and retry next week
    await db.insert(agentState).values({
      key:       `health_insight.pending_contribution.${crypto.randomUUID()}`,
      userId,
      value:     JSON.stringify({ correlations, anonymousHealthGroupFingerprint, pendingSince: Date.now() }),
      updatedAt: Date.now(),
    }).onConflictDoUpdate({
      target: agentState.key,
      set: { value: JSON.stringify({ correlations, anonymousHealthGroupFingerprint, pendingSince: Date.now() }), updatedAt: Date.now() }
    }).run()
    return
  }

  // Anonymous health group is large enough — write community signals
  for (const correlation of correlations) {
    if (correlation.confidence < 0.60) continue   // below confidence floor — do not contribute

    // Upsert into anonymous_exposure_event_associations with separately counted exposure denominator.
    await supabase.rpc('upsert_exposure_event_association', {
      p_anonymous_health_group_id: anonymousHealthGroup.id,
      p_exposure_kind:     correlation.exposureType,
      p_exposure_key:      correlation.exposureKey,
      p_post_exposure_event_kind: correlation.postExposureEventKind,
      p_exposure_count:    correlation.exposureCount,
      p_post_exposure_event_count: correlation.postExposureEventCount,
      p_onset_lag_hours:   correlation.onsetLagHours,
      p_severity:          correlation.severity,
    })

    // Update ingredient event association index if ingredient-level
    if (correlation.exposureType === 'ingredient') {
      await supabase.rpc('update_ingredient_event_association_index', {
        p_ingredient_name:  correlation.exposureKey,
        p_reported_condition_tags: anonymousHealthGroupFingerprint.conditionTags,
        p_medication_cats:  anonymousHealthGroupFingerprint.medicationCategories,
        p_post_exposure_event_kind: correlation.postExposureEventKind,
        p_event_association_score: correlation.confidence,
        p_severity:         correlation.severity,
        p_supporting_health_group_count: 1,
        p_exposure_count:   1,
        p_post_exposure_event_count: 1,
      })
    }

    // Update product community health summary if product-level
    if (correlation.exposureType === 'product') {
      await supabase.rpc('update_product_community_health_summary', {
        p_product_id:    correlation.exposureKey,
        p_post_exposure_event_kind: correlation.postExposureEventKind,
        p_reported_condition_tags: anonymousHealthGroupFingerprint.conditionTags,
        p_severity:      correlation.severity,
      })
    }
  }
}

function buildAnonymousHealthGroupFingerprint(db: DrizzleDB, userId: string): AnonymousHealthGroupFingerprint {
  const activeMeds        = db.select().from(medications).where(eq(medications.active, 1)).all()
  const activeConstraints = db.select().from(constraints).where(eq(constraints.status, 'confirmed')).all()
  const memories          = db.select().from(userMemory).where(and(eq(userMemory.namespace, 'health'), eq(userMemory.active, 1))).all()
  const captures          = getApprovedDerivedHealthFeatures(db, userId)
  const scanHistory       = db.select().from(memoryEvent).where(eq(memoryEvent.eventType, 'scan')).all()

  const conditionTags        = extractConditionTags(memories, activeConstraints)
  const medicationCategories = [...new Set(activeMeds.map(m => m.medicationCategory))]
  const dietaryTags          = extractDietaryTags(activeConstraints)
  const ageBucket            = extractAgeBucket(memories)
  const regionBucket         = extractRegionBucket(memories)

  // ── Enrichment: makes cohorts homogeneous so aggregated signals are not noise ──
  // "50s + west_africa + hypertension" alone can hold 10k members with wildly
  // different diets and metabolic states. These three fields sharpen the anonymous health group.
  const dietaryPatternSignature = computeDietaryPatternSignature(scanHistory)  // e.g. 'high_sodium_ultra_processed' | 'whole_food_low_carb'
  const cuisineProfile          = inferCuisineProfile(scanHistory)             // {"west_african":0.6,"western_packaged":0.3,"south_asian":0.1}
  const metabolicMarkerBucket   = computeMetabolicMarkerBucket(captures, conditionTags)  // 'low' | 'moderate' | 'elevated' | 'high' — from glucose/HbA1c/BP captures

  const hash = hashFingerprint({
    conditionTags, medicationCategories, dietaryTags, ageBucket, regionBucket,
    dietaryPatternSignature, cuisineProfileTopKey: topKey(cuisineProfile), metabolicMarkerBucket,
  })

  return {
    hash, conditionTags, medicationCategories, dietaryTags, ageBucket, regionBucket,
    dietaryPatternSignature, cuisineProfile, metabolicMarkerBucket,
  }
}
```

---

## Privacy Guarantees

The Health Insight Agent enforces these before any community write:

1. **Explicit opt-in.** No health-derived community contribution is written unless the user opted into health contribution.
2. **k-anonymity ≥ 100.** No row is written to community tables unless the anonymous health group has at least 100 members in Supabase.
3. **Category-level only.** Medication names become medication categories. Specific conditions become condition tags. Geographic data becomes region buckets or approved coarse geography.
4. **No temporal precision.** Timestamps contributed to community tables are rounded to the week.
5. **No linking.** A user's individual contributions across multiple weeks cannot be linked — each contribution uses the anonymous health group hash, not any user identifier.
6. **Stop sharing.** If the user says "stop sharing my data with the community" — `agent_state` key `health_insight.community_contribution_opt_in = "0"` is set and Pass 3 is skipped permanently until the user opts back in.

---

## Scheduling

```typescript
// First-boot initialization — added to DO first-boot sequence

db.insert(scheduledAlarms).values({
  id:          crypto.randomUUID(),
  userId,
  alarmType:   'health_insight_run',
  payload:     JSON.stringify({ userId }),
  scheduledAt: Date.now() + 7 * 24 * 60 * 60 * 1000,  // first run: 7 days from account creation
  status:      'pending',
  createdAt:   Date.now(),
}).run()
```

The Health Insight Agent re-schedules itself at the end of each run. It runs at a time the user is likely asleep — derived from their scan pattern (when they stop scanning) — so the run never overlaps with an active session.

---

## What the Health Insight Agent Never Does

- Never modifies `constraints` — safety-critical, only the agent and user interaction can do that
- Never deletes `health_events` or `medications` — these are permanent records
- Never writes community data unless the user explicitly opted in
- Never runs while a cooking session or active voice/session flow is active (checks `active_session_id` in agent_state)
- Never creates clinical conclusions — the `plain_language_association_summary` in `anonymous_research_association_candidates` describes patterns, not clinical conclusions
