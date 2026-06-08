# Wearables — Memory Routing

## What This File Covers

How wearable daily summaries become private `health.*` memories and how sustained patterns can influence `user_personality` without overreacting to one day of data.

---

## Routing Target

Wearable-derived facts live in Brain DO SQLite.

Primary tables:

- `user_memory`
- `user_personality`
- feature-specific private CGM table from `04-cgm-food-response.md`

No wearable data is written to Supabase, Ground, shared map tables, or public analytics.

---

## Memory Namespaces

| Namespace | Example key | Value |
|---|---|---|
| `health.biometrics` | `recovery_today` | readiness/recovery score, HRV delta, resting HR |
| `health.sleep` | `sleep_quality_trend` | rolling sleep duration/quality and last-night score |
| `health.activity` | `weekly_activity_level` | steps, active energy, workout minutes |
| `health.glucose` | `baseline_fasting` | personal fasting glucose range |
| `health.glucose` | `spike_triggers` | foods/products correlated with personal spikes |

Values must be JSON objects, not bare strings.

---

## Memory Write Shape

```typescript
type WearableMemoryWrite = {
  namespace: "health.biometrics" | "health.sleep" | "health.activity" | "health.glucose"
  key: string
  value: Record<string, unknown>
  confidence: number
  source: "wearable"
  sourceConnectionId: string
  sourceProvider: string
  observedAt: number
}
```

Use the existing Brain tool boundary for writes. Do not let the wearable ingestion endpoint write SQLite directly outside the Brain's validated path.

---

## Update Rules

Daily summary memories are rolling facts.

Rules:

- Update `recovery_today` daily.
- Keep rolling 7-day/30-day fields inside JSON values.
- Preserve provider/source metadata.
- If multiple providers overlap, keep source-specific values and one resolved summary.
- Do not let a single abnormal day become a personality trait.

---

## Personality Promotion

`user_personality` updates require sustained patterns over 30+ days.

Examples:

- physically active: 7000+ steps at least 5 days/week for 30 days
- sleep-deprived pattern: sleep quality below threshold for 3+ weeks
- metabolically sensitive: repeated glucose spikes across multiple foods and weeks

Blocked:

- one poor sleep night → personality trait
- one glucose spike → personality trait
- temporary illness week → personality trait

Personality writes should be handled by Brain maintenance or ambient pattern review, not the daily summary ingestion path.

---

## Session Context

When loaded into prompts, wearable context must be compact.

Good context:

```text
Recovery today is lower than usual; sleep quality was poor last night. Prefer low-effort meal suggestions.
```

Bad context:

```text
Full sleep/HRV/activity/glucose table for the last 90 days...
```

The agent needs actionable state, not health records dumped into the prompt.

---

## Conflict Resolution

If Apple Health and Oura disagree:

- keep provider-specific summaries
- compute a resolved summary with confidence
- prefer provider-native domain strengths when appropriate (Oura for readiness/sleep, HealthKit as broad aggregator)
- never hide conflict if it changes a recommendation

Example:

```text
Your recovery signals are mixed today, so I'll avoid making strong suggestions from wearable data alone.
```
