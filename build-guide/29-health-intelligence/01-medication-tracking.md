# Health Intelligence — Medication Tracking

## What This File Covers

New private SQLite tables in the Brain DO: `medications`, `health_events`, and one generic `health_captures` table that holds every captured measurement, lab result, prescription, and medical document. How users add data (voice, photo, wearable). How medication data feeds into medication-food interaction checks at scan time.

---

## New DO SQLite Tables

Three tables are added to the Brain DO schema alongside the existing 12. They follow all the same rules: per-user private, never shared, Drizzle ORM, WAL mode.

There is no `medication_reminders` table — the medication-call outcome is recorded on the firing alarm via `scheduled_alarms.action_outcome_status` + `action_outcome_json` (see `06-brain-memory/01-sqlite-schema.md`). There is no `biometric_readings` or `medical_documents` table either — both fold into the single generic `health_captures` table below.

```typescript
// backend/src/agents/brain/_schema/medications.schema.ts

export const medications = sqliteTable('medications', {
  id:            text('id').primaryKey(),        // UUID
  userId:        text('user_id').notNull(),
  drugName:      text('drug_name').notNull(),    // "Metformin"
  medicationCategory: text('medication_category').notNull(), // "biguanide" — normalized category for anonymization
  doseMg:        real('dose_mg'),
  doseUnit:      text('dose_unit'),              // 'mg' | 'mcg' | 'units' | 'ml'
  frequency:     text('frequency').notNull(),    // "2x daily" | "once morning"
  reminderTimes: text('reminder_times').notNull(), // JSON: ["08:00", "20:00"]
  withFood:      integer('with_food'),           // 1 = must take with food, 0 = fasting, NULL = no rule
  notes:         text('notes'),                  // "take 30 min before meal"
  source:        text('source').notNull(),       // 'photo' | 'voice' | 'manual'
  isActive:      integer('is_active', { mode: 'boolean' }).notNull().default(true),
  startedAt:     integer('started_at'),          // unix ms
  endedAt:       integer('ended_at'),
  createdAt:     integer('created_at').notNull(),
  updatedAt:     integer('updated_at').notNull(),
})

export const healthEvents = sqliteTable('health_events', {
  id:             text('id').primaryKey(),
  userId:         text('user_id').notNull(),
  eventType:      text('event_type').notNull(),  // 'allergic_reaction' | 'gi_distress' | 'glucose_spike' | 'fatigue' | 'headache' | 'inflammation' | 'sickness' | 'bp_elevated' | 'stool_bristol'
  severity:       integer('severity'),           // 1–10
  onsetAt:        integer('onset_at').notNull(), // unix ms — when it actually happened
  loggedAt:       integer('logged_at').notNull(), // when Brioela recorded it
  source:         text('source').notNull(),      // 'voice' | 'photo' | 'wearable' | 'agent_inferred'
  payloadJson:    text('payload_json').notNull(), // full event detail (type-specific fields)
  resolvedAt:     integer('resolved_at'),
  possibleAssociations: text('possible_associations'), // JSON: [{product_id, scan_event_id, lag_hours, confidence}]
  createdAt:      integer('created_at').notNull(),
})

export const healthCaptures = sqliteTable('health_captures', {
  id:           text('id').primaryKey(),          // UUID
  userId:       text('user_id').notNull(),
  captureType:  text('capture_type').notNull(),   // 'measurement' | 'lab_result' | 'prescription' | 'doctor_note' | 'image' | 'document'
  domain:       text('domain').notNull(),         // 'cardiovascular' | 'metabolic' | 'medication' | 'sleep' | 'activity' | 'mental' | 'general'
  metricKey:    text('metric_key'),               // 'blood_pressure' | 'glucose' | 'hba1c' | 'ldl' — NULL for documents
  valueJson:    text('value_json').notNull(),      // ALL value data as JSON — completely flexible, no per-metric columns
  unit:         text('unit'),                      // if applicable
  sourceType:   text('source_type').notNull(),    // 'apple_health' | 'oura' | 'dexcom' | 'withings' | 'photo' | 'pdf' | 'voice' | 'manual'
  sourceDetail: text('source_detail'),            // 'Dexcom G7' | 'LabCorp report' | NULL
  capturedAt:   integer('captured_at').notNull(),  // when the measurement/event actually happened (unix ms)
  ingestedAt:   integer('ingested_at').notNull(),  // when Brioela recorded it
  confidence:   real('confidence'),                // 0.0–1.0 for extracted data (photo/PDF/voice), NULL for direct device sync
  tags:         text('tags'),                       // JSON array: ['fasting', 'post_meal', 'morning', 'post_exercise']
  createdAt:    integer('created_at').notNull(),
})
```

### Why one generic `health_captures` instead of `biometric_readings` + `medical_documents`

`biometric_readings` had `value_systolic` and `value_diastolic` — blood-pressure-specific columns on a supposedly generic table. Every other metric wasted those two columns, and any metric with a non-standard shape needed a schema change. It also could not hold lab PDFs, doctor notes, or prescription photos at all — that required a *second* table (`medical_documents`).

`health_captures` is an append-only health-data event log (analogous to `memory_event`). Every value lives in `value_json`, so any source and any shape slots in without a migration:

```
Blood pressure         → captureType:'measurement', metricKey:'blood_pressure', value_json:{"systolic":120,"diastolic":80,"pulse":72}
Glucose (CGM)          → captureType:'measurement', metricKey:'glucose',        value_json:{"value":95,"trend":"stable","reading_type":"interstitial"}, unit:'mg/dL'
HbA1c (lab PDF)        → captureType:'lab_result',  metricKey:'hba1c',          value_json:{"value":6.2,"reference_range":{"low":4.0,"high":5.6},"lab":"LabCorp"}, unit:'%'
Prescription (photo)   → captureType:'prescription', metricKey:null,           value_json:{"drug_name":"Warfarin","dose_mg":5,"frequency":"once daily","prescriber":"Dr. Meles"}
Doctor note (PDF)      → captureType:'doctor_note', metricKey:null,             value_json:{"filename":"visit_2026_06.pdf","key_findings":["hypertension well controlled"],"extracted_text":"..."}
Sleep (Oura)           → captureType:'measurement', metricKey:'sleep',          value_json:{"total_hours":7.2,"deep_hours":1.4,"rem_hours":1.8,"score":82}
Stool (Bristol)        → captureType:'measurement', metricKey:'bristol',        value_json:{"bristol_type":5,"context":"post high-fat meal"}
```

`health_events` stays separate — it is the *symptomatic outcome* log (headache, GI distress, with severity and `possible_associations`), the outcome side of the correlation engine. `health_captures` is the *measurement/document* log, the data side. Different roles, kept distinct.

---

## How Users Add Medication Data

### Via Photo (most common)

User photographs a prescription bottle or medication packaging. The visual intake pipeline (`06-brain-memory/04-visual-intake.md`) handles this — GPT-4o mini vision extraction returns structured data and writes it to the `medications` table after Zod validation.

The extraction prompt for medications:

```typescript
const MEDICATION_EXTRACTION_PROMPT = `
This is a photograph of a medication label or prescription bottle.
Extract the following as JSON:
{
  "drug_name": string,            // exact name on label
  "medication_category": string | null, // pharmaceutical category if identifiable
  "dose_mg": number | null,       // numeric dose
  "dose_unit": string | null,     // "mg" | "mcg" | "units" | "ml"
  "frequency": string | null,     // as written: "twice daily", "once at bedtime"
  "with_food": boolean | null,    // true = take with food, false = fasting, null = not specified
  "notes": string | null,         // any additional instructions on the label
  "confidence": number            // 0.0-1.0 — how confident you are in this extraction
}

If this is not a medication label, return { "is_medication": false }.
Never invent drug names or doses not visible on the label.
`
```

### Via Voice (conversational)

User tells Brioela: "I started taking Warfarin 5mg every morning." The Gemini voice agent extracts this and calls the `create_medication` internal handler via tool call. Drug name is normalized against a drug category map to enable anonymized reporting.

### Via Medical Document Photo

Prescription photos, lab results, doctor notes — extracted by GPT-4o mini vision or document extraction and stored in `health_captures` (`capture_type` = `'prescription'` | `'lab_result'` | `'doctor_note'`), the parsed fields in `value_json` and raw extracted text under `value_json.extracted_text`. Relevant medications are also mirrored to the `medications` table.

---

## Medication-Food Interaction Check at Scan Time

When the scanner runs the constraint check (`07-scanner/03-constraint-check.md`), it asks the Brain for active medications through typed Brain RPC. The Brain reads the private `medications` table through its Drizzle repository. `user_memory.health.medications` is only a prompt/session summary mirror.

```typescript
// In checkProductConstraints() — new section added

const activeMedications = await brain.readActiveMedicationsForConstraintCheck({
  userId,
})

if (activeMedications.length > 0) {
  // Reviewed rules can create hard medication-food warnings.
  const reviewedInteractions = await fetchMedicationFoodInteractionRules(
    activeMedications.map(m => m.medicationCategory),
    product.ingredients,
    env,
  )

  for (const interaction of reviewedInteractions) {
    if (interaction.severityCategory === 'contraindicated' || interaction.severityCategory === 'major') {
      medicationFoodInteractions.push({
        medication:  interaction.medicationCategory,
        ingredient:  interaction.foodIngredient,
        interaction: interaction.interactionDirection,
        severity:    interaction.severityCategory === 'contraindicated' ? 'high' : 'moderate',
      })
    }
  }

  // Anonymous community medication-food event associations are caution context only.
  // They never create a hard block unless separately mapped to a reviewed rule.
  const communityAssociations = await fetchMedicationFoodEventAssociations(
    activeMedications.map(m => m.medicationCategory),
    product.ingredients,
    env,
  )
}
```

This means: the moment a user photographs their Warfarin prescription, every subsequent scan automatically checks for Vitamin K interactions — without the user doing anything else.

---

## Medication Reminder Scheduling

When a new medication is created, reminder records are written to `scheduled_alarms`. There is no
separate `medication_reminders` table. The `scheduled_alarms` row stores the reminder data and later
stores the call/push outcome in `action_outcome_status` and `action_outcome_json`.

```typescript
async function scheduleMedicationReminders(
  medication: Medication,
  db:         DrizzleDB,
): Promise<void> {
  const reminderTimes = JSON.parse(medication.reminderTimes) as string[]  // ["08:00", "20:00"]

  for (const timeStr of reminderTimes) {
    const nextFire = getNextAlarmTime(timeStr)  // next occurrence of this time

    // One row in scheduled_alarms — this IS the reminder. The medication-call
    // outcome lands back on this same row via action_outcome_status / action_outcome_json.
    db.insert(scheduledAlarms).values({
      id:        crypto.randomUUID(),
      userId:    medication.userId,
      alarmType: 'medication_reminder',
      payload:   JSON.stringify({ medicationId: medication.id, drugName: medication.drugName, doseInfo: `${medication.doseMg}${medication.doseUnit}` }),
      scheduledAt: nextFire,
      label:     `${medication.drugName} reminder`,
      status:    'pending',
      actionOutcomeStatus: null,
      actionOutcomeJson: null,
      createdAt: Date.now(),
    }).run()
  }
}
```

See `02-medication-reminders.md` for what happens when the alarm fires.
