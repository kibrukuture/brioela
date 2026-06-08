# Health Intelligence — Medication Reminders

## What This File Covers

How medication reminders are delivered: AI voice call as primary (Vapi/Bland AI), OneSignal push notification as fallback. The call flow, webhook response logging, and when each path is used.

---

## Where the Outcome Is Recorded

There is no `medication_reminders` table. A medication reminder *is* a `scheduled_alarms` row (`alarm_type = 'medication_reminder'`). The outcome of the call — did they take it, which provider call ID, when they answered — lands back on that same row through the two generic outcome columns (`06-brain-memory/01-sqlite-schema.md`):

- `action_outcome_status` — `'calling'` | `'answered'` | `'missed'` | `'notified'` | `'failed'`
- `action_outcome_json` — `{"took": 1, "call_sid": "vapi_xxx", "answered_at": 1718000000000}`

Throughout this file, `reminderId` is the id of the firing `scheduled_alarms` row. Every "update the reminder" step is an update to that row's `action_outcome_status` / `action_outcome_json`.

---

## Why AI Voice Call, Not Just Push Notification

A push notification can be ignored, swiped away, or missed entirely. For critical medications — Warfarin, insulin, immunosuppressants, seizure medications — a missed dose has real consequences. An actual phone call from an AI agent is much harder to ignore. The user answers, says yes or no, and the response is logged.

Voice calls are used sparingly — only for medications flagged as high-stakes. For routine supplements or lower-stakes medications, OneSignal push is sufficient.

---

## Alarm Fire — What Happens

When a `medication_reminder` alarm fires in the Brain DO alarm handler:

```typescript
// In alarm.handler.ts — medication_reminder case

case 'medication_reminder': {
  const { medicationId, drugName, doseInfo } = JSON.parse(alarm.payload)

  // Get user's phone number
  const userPhone = await getUserPhone(db, alarm.userId, env)

  // Determine call vs push based on medication category
  const medication = db.select().from(medications)
    .where(eq(medications.id, medicationId)).get()

  const requiresCall = medication && HIGH_STAKES_MEDICATION_CATEGORIES.includes(medication.medicationCategory)

  if (requiresCall && userPhone) {
    // Primary: AI voice call
    await triggerMedicationCall({
      phone:        userPhone,
      drugName,
      doseInfo,
      reminderId:   alarm.id,
      userId:       alarm.userId,
      env,
    })
  } else {
    // Direct to push
    await triggerMedicationPush({ drugName, doseInfo, reminderId: alarm.id, userId: alarm.userId, env })
    await updateReminderStatus(db, alarm.id, 'notified')
  }

  // Schedule next reminder (same time tomorrow)
  await scheduleNextMedicationReminder(db, alarm.ctx, medicationId)

  break
}

const HIGH_STAKES_MEDICATION_CATEGORIES = [
  'anticoagulant',     // Warfarin, Eliquis
  'insulin',           // any insulin type
  'immunosuppressant', // transplant medications
  'antiepileptic',     // seizure medications
  'antipsychotic',     // psychiatric medications
  'cardiac',           // heart rhythm medications
]
```


---

## AI Voice Call — Vapi Integration

```typescript
// backend/src/api/health/medication-call.helper.ts

const VAPI_BASE = 'https://api.vapi.ai'

export async function triggerMedicationCall(params: {
  phone:      string
  drugName:   string
  doseInfo:   string
  reminderId: string
  userId:     string
  env:        Env
}): Promise<void> {
  const { phone, drugName, doseInfo, reminderId, userId, env } = params

  // Update alarm outcome state to 'calling'
  // (done via Brain DO — reminder is a scheduled_alarms row)
  await updateAlarmResultViaBrain(userId, reminderId, {
    actionOutcomeStatus: 'calling',
    actionOutcomeJson: JSON.stringify({ provider: 'vapi', call_started_at: Date.now() }),
  }, env)

  const resp = await fetch(`${VAPI_BASE}/call`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.VAPI_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      phoneNumberId: env.VAPI_PHONE_NUMBER_ID,
      customer: {
        number: phone,
      },
      assistant: {
        firstMessage: `Hi, this is your Brioela health reminder. It's time for your ${drugName} — ${doseInfo}. Did you take it? Please say yes or no.`,
        model: {
          provider: 'anthropic',
          model:    'claude-haiku-4-5-20251001',
          messages: [{
            role:    'system',
            content: `You are a health reminder assistant for Brioela. 
Keep it brief. Ask if the user took their ${drugName} (${doseInfo}). 
If they say yes: thank them and end the call.
If they say no or not yet: acknowledge it and tell them to follow their prescribed instructions or contact their clinician/pharmacist for missed-dose guidance.
If they say they already took it earlier: note that and end the call.
Never discuss medical advice. Never suggest dose changes. One topic only: did they take the medication.`,
          }],
        },
        voice: {
          provider:  'elevenlabs',
          voiceId:   env.ELEVENLABS_VOICE_ID,    // warm, calm voice
        },
        endCallPhrases:   ['goodbye', 'bye', 'thanks', 'thank you'],
        maxDurationSeconds: 60,
      },
      metadata: {
        reminderId,
        userId,
        drugName,
      },
      serverUrl: `${env.WORKER_BASE_URL}/api/health/reminder-webhook`,
    }),
  })

  if (!resp.ok) {
    // Vapi call failed — fall through to push notification
    console.error('Vapi call failed:', await resp.text())
    await triggerMedicationPush({ drugName, doseInfo: params.doseInfo, reminderId, userId, env })
    await updateReminderStatusViaBrain(userId, reminderId, 'notified', env)
  }
  // If call succeeded: Vapi will fire the webhook when the call completes
}
```

---

## Webhook — Call Result

Vapi calls this endpoint when the call ends:

```typescript
// backend/src/api/health/reminder-webhook.handler.ts

export async function handleReminderWebhook(c: AppContext): Promise<Response> {
  const body = await c.req.json() as VapiWebhookPayload

  if (body.type !== 'end-of-call-report') return c.json({ ok: true })

  const { reminderId, userId } = body.call.metadata as { reminderId: string; userId: string }
  const transcript = body.transcript?.toLowerCase() ?? ''

  // Prefer provider structured analysis/final output. Transcript substring parsing is not reliable
  // enough for adherence. Fall back to null when no structured result is available.
  const took = body.analysis?.structuredData?.took ?? null

  // Record the outcome on the firing scheduled_alarms row (Brain DO SQLite)
  const brainId = c.env.BRAIN.idFromName(userId)
  const brain   = c.env.BRAIN.get(brainId)
  await brain.fetch(new Request('https://internal/update-alarm-result', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${c.env.INTERNAL_SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alarmId:      reminderId,        // reminderId IS the scheduled_alarms row id
      actionOutcomeStatus: 'answered',
      actionOutcomeJson:   JSON.stringify({ took, provider_call_id: body.call.id, answered_at: Date.now(), raw_end_reason: body.endedReason }),
    }),
  }))

  return c.json({ ok: true })
}
```

---

## No-Answer Fallback — Timeout to Push

If Vapi fires the call but gets no answer (voicemail, declined, phone off):

```typescript
// Vapi webhook body.endedReason tells us why
if (body.endedReason === 'no-answer' || body.endedReason === 'voicemail') {
  // Fall through to OneSignal push
  await triggerMedicationPush({ drugName, doseInfo, reminderId, userId, env })
  await updateReminderStatus(reminderId, 'missed', userId, env, {
    answered: false,
    call_ended_reason: body.endedReason,
    fallback_push_sent: true,
  })
}
```

```typescript
// backend/src/api/health/medication-push.helper.ts

export async function triggerMedicationPush(params: {
  drugName:  string
  doseInfo:  string
  reminderId: string
  userId:    string
  env:       Env
}): Promise<void> {
  const { drugName, doseInfo, reminderId, userId, env } = params

  await fetch('https://api.onesignal.com/notifications?c=push', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${env.ONESIGNAL_REST_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      app_id:            env.ONESIGNAL_APP_ID,
      include_aliases:   { external_id: [userId] },
      target_channel:    'push',
      idempotency_key:   reminderId,
      collapse_id:       `medication_reminder:${reminderId}`,
      headings:          { en: `Time for your ${drugName}` },
      contents:          { en: `${drugName} ${doseInfo} — tap to confirm you took it.` },
      priority:          10,
      ttl:               3600,   // expires after 1 hour — stale medication reminders are useless
      data: { type: 'medication_reminder', drug_name: drugName },
    }),
  })
}
```

Push taps deep-link to a confirmation screen with `alarm_id`. Confirming updates the same
`scheduled_alarms` row with `action_outcome_status = 'confirmed'` and
`action_outcome_json.confirmed_at`.

---

## Call Frequency Rules

- Never call the same user more than once per 4 hours for any reason
- Never call between 22:00 and 07:00 local time (derived from user's geohash timezone)
- If user has missed 3+ reminders in a row for the same medication → escalate to a different notification message: "You've missed several reminders — would you like to adjust the timing?"
- User can say "stop calling me about this" during any call → `medication.reminderTimes` cleared, future reminders are push-only

---

## Bland AI as Alternative

If Vapi is unavailable or too expensive at scale, Bland AI can be evaluated behind the same provider
adapter contract. It is not assumed to be identical. The `env.CALL_PROVIDER` flag switches between
provider adapters:

```typescript
const CALL_PROVIDER = env.CALL_PROVIDER ?? 'vapi'   // 'vapi' | 'bland'
```
