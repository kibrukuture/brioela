# Medical Conditions — Condition Profile Data

## What This File Covers

The private condition profile data model, active/inactive lifecycle, severity/strictness, deletion behavior, and how conditions are loaded into app context.

---

## Storage Rule

Medical condition profile data lives in the user's Orchestrator DO SQLite.

Do not store active conditions in Supabase, Ground, shared map tables, analytics, or public profiles.

---

## Profile Shape

```typescript
type MedicalConditionProfile = {
  profileId: string
  userId: string
  conditionType: MedicalConditionType
  strictness: "strict" | "moderate" | "standard"
  status: "active" | "inactive" | "deleted"
  confirmedBy: "self_voice" | "self_chat" | "settings" | "practitioner_suggested_user_confirmed"
  confirmedAt: number
  deactivatedAt: number | null
  ruleVersion: string
  notes: string | null
  updatedAt: number
}
```

This can be an explicit table in the Orchestrator schema or a structured `user_memory` entry under `health.conditions`. If implementation creates a new table, update Memory Engine docs and migrations intentionally.

---

## Active Context Shape

Every scan/recipe/cooking context should receive compact active condition context:

```typescript
type ActiveMedicalConditionContext = {
  conditionType: MedicalConditionType
  strictness: "strict" | "moderate" | "standard"
  ruleVersion: string
  displayName: string
}
```

Do not inject long medical explanations into every prompt. Use condition IDs and rule lookups.

---

## Multiple Conditions

Users can have multiple active conditions.

Rules:

- apply all active hard rules
- when rules conflict, choose safer/more restrictive output and explain conflict
- never silently suppress one condition because another exists
- keep flags separate in UI when multiple conditions trigger

Example:

```text
Pregnancy flag: unpasteurized cheese risk.
Hypertension flag: high sodium.
```

---

## Deletion

User can delete all condition data from settings.

Deletion removes:

- active condition profiles
- inactive condition profiles if user requests full deletion
- condition flag event history where required
- practitioner annotations tied only to that condition, unless legal/account records require audit retention

Deletion does not delete generic scan history unless the user deletes scan history separately.

---

## Audit And Safety

Track private audit events:

- candidate detected
- user confirmed
- strictness changed
- condition deactivated
- condition deleted
- practitioner note added/removed later

Audit events should not include full transcripts or unnecessary medical detail.

---

## Mesa Boundary

Mesa may later evaluate food for multiple people, but medical condition profiles remain member-specific and permissioned.

Do not expose one Mesa member's condition to another member unless the Mesa owner/member permission model explicitly allows it.
