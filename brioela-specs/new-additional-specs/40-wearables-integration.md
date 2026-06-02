# 40. Wearables Integration

## Goal

Let users connect health wearables and continuous glucose monitors to Brioela so that physiological data — sleep, recovery, heart rate variability, and real-time glucose response — enriches food intelligence with actual biometrics rather than population averages.

## Why This Exists

Every food intelligence system today uses population-level data. Glycemic index is an average across hundreds of people. "This is high in sodium" is a generic warning with no knowledge of your kidneys, your blood pressure history, or how your body actually handles it.

Brioela already has what you ate (scan and receipt history). Wearables add what happened in your body after. The combination produces something no other consumer app can build: personal metabolic intelligence tied to your actual foods.

## Phase 1 Devices (Launch)

Two integrations to do deeply before expanding:

**Apple HealthKit** — covers all Apple Watch users (the largest wearable demographic in Western markets). Single integration covers: HRV, sleep stages, resting heart rate, activity/steps, blood oxygen, body weight. HealthKit is the aggregator — it pulls from Apple Watch, third-party scales, and other connected devices automatically.

**Oura Ring** — the health-conscious early adopter market, which is Brioela's core demographic. Best-in-class sleep stage accuracy, readiness score, body temperature deviation (early illness signal). Official Oura API.

## Phase 2 Devices (Prioritized by Impact)

**CGM (Continuous Glucose Monitor)**: Dexcom (G7/Stelo), Abbott LibreFreeStyle. Stelo is Dexcom's OTC CGM for non-diabetics — no prescription needed — making this accessible to anyone interested in metabolic health, not just diabetics. This is the single most impactful wearable integration Brioela can build. Details in the CGM section below.

**Google Health Connect** — Android equivalent of HealthKit. Covers Fitbit, Garmin, Samsung Watch, and others on Android.

**Whoop** — athlete and recovery-focused users. Strain + recovery + sleep.

**Withings** — body composition scale. Weight and body fat trends over time as context for food pattern changes.

## Data Architecture — The Core Rule

**Never stream raw sensor data to the Orchestrator DO.** A heart beats 70 times a minute. Oura reads temperature every minute. A CGM reads every 5 minutes. None of this raw stream reaches Cloudflare. It would be expensive, noisy, and meaningless at that granularity.

The flow:

```
Wearable device
      ↓ native SDK (HealthKit, Oura API, Dexcom API)
Client-side aggregation (app background task)
      ↓ daily summary JSON — NOT raw readings
Orchestrator DO (via HTTP when app opens or backgrounded)
      ↓ memory routing
user_memory (health.biometrics, health.sleep, health.glucose namespaces)
user_personality (sustained 30-day patterns → trait updates)
```

The client produces one daily summary per connected device. That summary — structured JSON under ~500 bytes — is what the DO receives.

**Daily summary shape (Apple Health example):**
```json
{
  "source": "apple_health",
  "date": "2026-06-02",
  "sleep": {
    "duration_min": 412,
    "efficiency": 0.87,
    "deep_min": 62,
    "rem_min": 94,
    "quality_score": 78
  },
  "hrv_avg_ms": 48,
  "hrv_baseline_7d": 52,
  "hrv_delta": -4,
  "resting_hr_bpm": 58,
  "steps": 8420,
  "active_energy_kcal": 480
}
```

The DO handler receives this, extracts the values that matter for food intelligence, and writes to memory namespaces using `memory_update`.

## Memory Routing

Wearable data maps to `user_memory` under the `health.*` namespace hierarchy. Examples:

| namespace | key | what it holds |
|---|---|---|
| `health.biometrics` | `sleep_quality_trend` | 7-day rolling average sleep score + last night's result |
| `health.biometrics` | `recovery_today` | Today's readiness/recovery score + HRV delta from baseline |
| `health.biometrics` | `resting_hr_trend` | 30-day resting HR trend (rising = possible overtraining or illness) |
| `health.activity` | `weekly_activity_level` | Average daily steps + active energy, rolling 7 days |
| `health.glucose` | `spike_triggers` | Foods correlated with personal glucose spikes above threshold |
| `health.glucose` | `baseline_fasting` | User's personal fasting glucose range (from CGM morning readings) |

These facts are injected into session context via `buildMemoryContext()` (spec 09) — the cooking agent, voice agent, and scan pipeline all see this data without any additional fetch.

**Personality layer** — sustained patterns over 30+ days promote to `user_personality` traits. Not from a single night's data. Examples:
- Consistent high activity (7000+ steps, 5 days/week for 30 days) → trait `"physically-active"` strength rises
- Consistent poor sleep (below 70 quality score, 3+ weeks) → trait `"sleep-deprived"` noted (affects meal complexity suggestions)
- HRV consistently higher on days with light eating → AI may infer `"metabolically-sensitive"` trait

**Skill creation** — wearable data does not create skills directly. But a wearable pattern combined with a food pattern can prompt the AI to create a procedural skill — same logic as spec 34 (medication photos). CGM showing consistent spikes after refined carbs → AI may create skill: *"Surface lower-glycemic alternatives when this user is planning dinner, especially starchy carbs."* The data is the evidence. The skill is the response.

## CGM Integration — The Killer Feature

This deserves its own section because it changes what Brioela fundamentally is for users who connect a CGM.

**What CGM adds that nothing else can:**

Standard glycemic index tells you that white rice has a GI of 73. But your personal glucose response to white rice might be a mild 20-point rise, while a seemingly "safe" whole grain sends you to 180. Individual response varies enormously and population averages are nearly useless for personal dietary decision-making.

Brioela has the scan event (you know exactly what was eaten, when) and the CGM has the glucose curve (you know exactly what happened in the body 30–90 minutes after). Time-correlating these two data streams produces *personal metabolic intelligence* tied to specific foods. No other consumer app has both sides of this equation.

**The correlation logic:**

When a scan event occurs and CGM is connected, the Orchestrator DO opens a 2-hour observation window. The client sends glucose readings at 15-minute intervals during this window (not continuously — just during meal-adjacent windows). After the window closes, the DO computes:

- Peak glucose value
- Time to peak (minutes from scan)
- Area under the curve (proxy for total glucose load)
- Return to baseline time

These four values are stored against the scanned product in `health.glucose` memory. After 3+ correlation events for the same product, the AI can write a `spike_trigger` memory fact with confidence.

**What changes downstream when glucose data exists:**

- Scan verdict for any flagged product now shows *your personal response*, not population GI: "Based on your glucose history, this tends to spike you significantly. You might prefer [alternative] which has shown a flatter curve for you."
- Recipe suggestions favor ingredients where your personal curves are flat.
- The meal plan (spec 33) can optimize for metabolic stability, not just nutrition labels.
- The behavioral pattern engine (spec 17) has real physiological data instead of conversational inference.

**CGM data model:**

```sql
-- Stored in Orchestrator DO SQLite (private, not Supabase)
glucose_meal_window (
  window_id       text primary key,
  scan_event_id   text,               -- linked to the triggering scan
  product_id      text,
  readings_json   text,               -- [{t: relative_minutes, glucose: mgdl}, ...]
  peak_mgdl       real,
  peak_time_min   integer,
  auc             real,               -- area under curve
  baseline_mgdl   real,               -- fasting baseline at window start
  captured_at     integer
)
```

Raw readings in `readings_json` are deleted after the derived values (peak, AUC) are computed. Only derived values are kept long-term.

## How Wearables Make Existing Features Better

**Spec 17 (Behavioral Pattern Detection):**
Before wearables, the agent infers energy from what users say in conversation. After: HRV and sleep data are actual physiological evidence. Correlations between food and energy become real biology, not linguistic inference. The wellbeing signal table in spec 17 gains a `wearable_corroboration` field — when a user says "I'm exhausted" and HRV confirms it, confidence is higher.

**Spec 30 (Food Illness Detective):**
Oura's body temperature deviation is an early illness signal — often elevated 12–24 hours before the user feels sick. If temperature deviation is rising AND resting HR is elevated AND the user mentions digestive discomfort, the illness detective can flag a possible onset even before the user says "I feel sick." Early warning, not reactive diagnosis.

**Spec 28 (Medical Condition Food Profile):**
T2 diabetes + CGM is the most powerful combination in the app. The declared condition provides the context (blood sugar management is the goal). The CGM provides the feedback (this food, these results). Meal plan generation, scan verdicts, and recipe suggestions all become evidence-based for this user's actual metabolic response, not theoretical.

**Spec 33 (Minimum Spend Meal Plan):**
If today's readiness score is low (poor sleep, recovery needed), the meal plan surfaces nourishing, low-effort meals. If tomorrow shows a scheduled long workout (from Garmin), tonight's plan surfaces higher carb, higher energy meals. The plan adapts to physiological state, not just ingredient inventory.

**Spec 10 (Voice Cooking Agent):**
The agent sees from memory that last night's sleep quality was poor (score 55). Mid-session, naturally: *"Looks like a low-energy night — want something simple that doesn't need much attention?"* The user didn't say they're tired. The agent read their biometric state and responded to it.

## Connection Model

Users connect wearables from a dedicated "Connected Devices" section in settings. Each device requires explicit permission grant:

1. User taps "Connect Apple Health" (or Oura, Dexcom, etc.)
2. Native permission dialog — platform-controlled, not Brioela-controlled
3. User grants access to specific data types (sleep, HRV, activity) — granular permission, not all-or-nothing
4. First sync happens immediately in background
5. Ongoing: client background task syncs daily summary when app is active or backgrounded

**Disconnection:**
User can disconnect any device at any time from settings. On disconnect:
- Future syncs stop immediately
- The user is asked: "Remove health data already stored from this device?" — explicit choice
- If yes: all `health.biometrics`, `health.sleep`, `health.activity`, `health.glucose` memory entries sourced from that device are deleted from DO SQLite
- Derived personality traits that cited wearable evidence are flagged for curator review

## Privacy — The Non-Negotiables

This is the most sensitive data in the entire app. More sensitive than medication photos. More sensitive than dietary restrictions.

- All wearable data lives **only** in the user's DO SQLite. Never Supabase. Never any shared table. Never Ground.
- Raw readings are never stored long-term — only daily aggregates and derived memory facts.
- Wearable data is never used for any purpose outside the user's own personalization. Not for analytics, not for product improvement, not for anything.
- The "what Brioela knows about me" screen (spec 34) must display all health biometric memory entries with individual delete controls.
- Health data is encrypted at rest in DO SQLite using CF's encryption at rest.
- Wearable data is never included in any export by default — the user must explicitly opt health data into any export they initiate.

## What This Does Not Do

- Does not diagnose, treat, or prescribe anything. Glucose correlations are observations, not medical advice.
- Does not replace CGM apps (Dexcom app, LibreLinkUp) — it reads their data, it does not compete with them.
- Does not perform real-time health monitoring or send emergency alerts.
- Does not access health data without explicit per-data-type permission.
- Does not share any health data with insurers, employers, or any third party under any circumstances.

## Success Metrics

- Wearable connection rate among active users.
- Sleep data influence rate: how often does sleep quality affect a session recommendation (proxy for whether the data is actually being used).
- CGM correlation count per user: how many glucose-food correlation events accumulate per CGM user per month.
- Scan verdict engagement uplift for CGM users vs non-CGM users (does personal glucose data make users engage more with verdicts?).
- Illness detection lead time: for users with Oura, how many hours before a user-reported illness event did body temperature deviation first appear?
