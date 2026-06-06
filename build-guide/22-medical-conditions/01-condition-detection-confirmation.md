# Medical Conditions — Condition Detection And Confirmation

## What This File Covers

How Brioela detects possible medical condition mentions, asks for explicit confirmation, activates a condition profile, and handles deactivation.

---

## Core Rule

Medical conditions are never assumed.

The agent may detect a signal, but the user must confirm before Brioela applies condition-specific food rules across scans, recipes, maps, meal plans, or cooking sessions.

---

## Detection Sources

Condition signals can appear in:

- voice sessions
- cooking sessions
- chat
- scan comments
- recipe conversations
- practitioner notes later, if user grants access

Examples:

- "I'm pregnant."
- "My doctor said I'm pre-diabetic."
- "I'm on Warfarin."
- "I have celiac."
- "I need to watch potassium because of kidney disease."

Detection writes a candidate only. It does not activate the condition.

---

## Candidate Shape

```typescript
type MedicalConditionCandidate = {
  candidateId: string
  userId: string
  conditionType: MedicalConditionType
  detectedFrom: "voice" | "chat" | "scan_comment" | "recipe_session" | "practitioner_note"
  sourceSessionId: string | null
  evidenceText: string
  confidence: number
  status: "pending_confirmation" | "confirmed" | "dismissed" | "expired"
  detectedAt: number
}
```

Candidate evidence must be minimal and private. Do not store full transcripts if a short evidence quote is enough.

---

## Confirmation Prompt

Ask once, at the next natural pause.

Example:

```text
You mentioned you're pregnant. Do you want me to apply pregnancy-safe food guidelines across scans, recipes, and meal ideas?
```

For ambiguous rules:

```text
For gout, people use different strictness levels. Do you want strict or moderate food guidance?
```

Confirmation must include:

- condition name
- what changes in the app
- reminder that this is food guidance, not medical advice
- explicit yes/no or strict/moderate choice when applicable

---

## Supported Conditions

```typescript
type MedicalConditionType =
  | "pregnancy"
  | "type_2_diabetes"
  | "pre_diabetes"
  | "gout"
  | "hypertension"
  | "high_cholesterol"
  | "warfarin_blood_thinner"
  | "ibs_low_fodmap"
  | "celiac"
  | "chronic_kidney_disease"
  | "pku"
```

Additional conditions require rule config and product/ingredient data quality review before activation.

---

## Deactivation

The user can deactivate by voice or settings.

Examples:

- "I'm no longer pregnant."
- "Stop applying low-FODMAP rules."
- "Remove my gout profile."

Deactivation behavior:

- mark condition inactive immediately
- stop applying rules to scans/recipes/maps/meal plans
- keep audit record privately unless user deletes all condition data
- never infer reactivation without confirmation

---

## Medical Boundary

Allowed:

- "Apply pregnancy-safe food guidelines."
- "Flag high-sodium products for hypertension."
- "This does not replace clinician guidance."

Blocked:

- "You have diabetes."
- "This will treat your condition."
- "Ignore your doctor."
- "Change your medication."

Brioela applies food filters from confirmed user context. It does not diagnose.
