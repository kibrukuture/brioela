# Wearables — Privacy And Disconnect

## What This File Covers

The privacy model for health biometric data, disconnection/deletion behavior, export boundaries, auditability, and non-medical product language.

---

## Sensitivity Rule

Wearable data is among the most sensitive data in Brioela.

It is more sensitive than normal scan history because it can reveal sleep, recovery, illness onset, activity, glucose response, and daily body state.

Default posture: collect less, summarize early, store privately, surface rarely.

---

## Non-Negotiables

- Wearable data lives only in the user's Brain DO SQLite.
- No wearable data in Supabase.
- No wearable data in Ground.
- No wearable data in shared map, menu, price, or community tables.
- No ad targeting.
- No insurer/employer/third-party sharing.
- No generic analytics pipelines.
- No medical diagnosis, treatment, or dosing guidance.

---

## Disconnect Flow

When a user disconnects a device:

1. Stop future sync immediately.
2. Mark connection `disconnected`.
3. Ask whether to delete already stored data from that device.
4. If yes, delete `health.*` memory entries sourced from that connection.
5. Delete provider tokens/credentials where applicable.
6. Flag any derived personality traits citing that device for Curator review.

Copy:

```text
Disconnect Oura? I can also remove health data already stored from this device.
```

Options:

- Disconnect only
- Disconnect and delete stored data

---

## Deletion Scope

Deletion by connection should remove:

- daily summary-derived `health.*` memories
- glucose meal windows from that provider
- unresolved wearable candidates
- provider auth tokens
- sync metadata not required for legal/security logs

Deletion should flag, not automatically erase:

- personality traits that mixed wearable evidence with non-wearable evidence
- meal plan history already generated from wearable context
- user-authored notes mentioning wearable data

Flagged traits go to Curator for review or are hidden until revalidated.

---

## Export Boundary

Wearable data is not included in default exports.

If the user explicitly exports health data:

- include summaries and derived memories
- include source provider and dates
- include glucose derived metrics if present
- do not include deleted raw readings
- clearly label derived observations versus source-provided data

The user must opt health data into export intentionally.

---

## Audit Trail

Track internal audit events privately:

- device connected
- permission categories granted
- summary ingested
- memory written
- glucose window derived
- device disconnected
- data deleted

Do not track raw health values in generic analytics events. Audit events should prove control and deletion, not become a shadow copy of health data.

---

## Medical Language Boundary

Allowed:

- "Your sleep was lower than usual."
- "Your past glucose response to this food has been high."
- "This may be a lower-effort meal for a low-recovery day."
- "This is an observation, not medical advice."

Blocked:

- "This food treats your glucose."
- "You have diabetes."
- "Take insulin."
- "This wearable proves food poisoning."
- "You should follow this diet for your condition."

Brioela observes patterns and adapts food guidance. It does not diagnose, treat, prescribe, or replace the user's medical apps.
