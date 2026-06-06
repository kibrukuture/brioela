# Wearables — CGM Food Response

## What This File Covers

Continuous glucose monitor food-response logic: scan-triggered observation windows, short-window glucose readings, derived metrics, spike-trigger memory facts, and UI boundaries.

---

## Product Thesis

CGM turns Brioela from generic nutrition scoring into personal metabolic intelligence.

The product no longer only asks:

```text
Is this food generally healthy?
```

It can ask:

```text
What does this food do to this user's body?
```

---

## Observation Window

When the user scans a product and CGM is connected, open a 2-hour glucose observation window.

```typescript
type GlucoseMealWindow = {
  windowId: string
  userId: string
  scanEventId: string
  productId: string | null
  openedAt: number
  closesAt: number
  status: "open" | "derived" | "expired" | "cancelled"
}
```

Do not open a window for every app event. The first trigger is scan events because they have food identity.

---

## Reading Collection

During the 2-hour window, collect coarse interval readings, not continuous streams.

Spec target: 15-minute interval readings during the meal-adjacent window.

```typescript
type GlucoseWindowReading = {
  relativeMinute: number
  glucoseMgdl: number
}
```

Raw readings are short-lived. After derived metrics are computed, delete raw readings unless the user explicitly exports them.

---

## Derived Metrics

```typescript
type GlucoseWindowDerivedMetrics = {
  windowId: string
  baselineMgdl: number | null
  peakMgdl: number | null
  peakTimeMin: number | null
  auc: number | null
  returnToBaselineMin: number | null
  readingCount: number
  confidence: number
}
```

Confidence depends on:

- enough readings in the 2-hour window
- baseline available
- no obvious missing-data gap
- scan likely represented eating, not browsing
- no overlapping meal windows that confuse attribution

---

## Private Table

Add a private Orchestrator SQLite table when implementing CGM:

```sql
CREATE TABLE glucose_meal_window (
  window_id        TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL,
  scan_event_id    TEXT,
  product_id       TEXT,
  derived_json     TEXT NOT NULL,
  peak_mgdl        REAL,
  peak_time_min    INTEGER,
  auc              REAL,
  baseline_mgdl    REAL,
  confidence       REAL NOT NULL,
  captured_at      INTEGER NOT NULL
);
```

Do not store this in Supabase.

---

## Spike Trigger Rule

After 3+ high-confidence windows for the same product or ingredient pattern, Brioela can write a `health.glucose:spike_triggers` memory fact.

```typescript
type GlucoseSpikeTrigger = {
  entityKind: "product" | "ingredient" | "recipe" | "category"
  entityId: string | null
  entityName: string
  evidenceWindowIds: string[]
  averagePeakDeltaMgdl: number
  averageAuc: number
  confidence: number
  lastObservedAt: number
}
```

One spike is a signal. Three repeated spikes can become memory. Even then, copy stays observational.

---

## Scan Verdict Overlay

If glucose memory exists, scan verdicts can include a personal response line.

Use:

```text
Your past glucose response to this product has been high.
```

Avoid:

```text
This product is bad for your diabetes.
```

Allowed actions:

- suggest lower-spike alternatives if known
- offer to compare similar products
- let user hide glucose overlays

Blocked:

- emergency glucose alerts
- insulin dosing guidance
- diagnosis/treatment language
- sharing glucose results with community data

---

## Ambiguous Attribution

Food response is noisy.

Mark low confidence when:

- multiple foods scanned/eaten in the same window
- user scanned but did not eat
- workout happened during window
- missing baseline
- readings sparse
- illness or stress markers are elevated

Low-confidence windows can be stored as evidence but should not produce user-facing claims.
