# Kids Mode — Data Model And Metrics

## What This File Covers

Kids Mode profile/event data, storage boundaries, privacy, and success metrics.

---

## Data Model

```typescript
type KidsModeProfile = {
  userId: string
  enabled: boolean
  ageRange: "5-7" | "8-10" | "11-12"
  createdAt: number
  updatedAt: number
}

type KidsModeScanEvent = {
  scanEventId: string
  userId: string
  ageRange: "5-7" | "8-10" | "11-12"
  explanationText: string
  explanationSpoken: boolean
  shared: boolean
  createdAt: number
}
```

This data can live in Orchestrator/private app storage. If analytics events are needed, they must not include child identity or private allergy details.

---

## Event Rules

Track:

- Kids Mode profile enabled
- age range selected
- explanation generated
- audio played
- share card generated
- share card shared

Do not track:

- child name
- child personal traits
- child health facts
- exact location
- raw voice audio
- private allergy text in analytics

---

## Explanation Storage

The explanation text can be stored for the scan event so the parent can revisit/share it.

Rules:

- tie explanation to `scanEventId`
- keep age range used
- keep source confidence
- do not store a child profile or child identity
- allow deletion with scan history deletion

---

## Privacy

Kids Mode is parent-controlled.

The child does not have an account, profile, or public presence.

Share cards are generated only after parent action. Brioela never shares child-directed content automatically.

---

## Metrics

Success metrics:

- Kids Mode activation rate among family/multi-user households
- scan-to-explanation rate
- voice explanation play rate
- share card generation rate
- share card actual share rate
- retention delta for users with Kids Mode active
- upgrade conversion from Kids Mode teaser

Quality metrics:

- explanation regeneration rate
- parent dismissal rate
- safety conflict rate
- low-confidence explanation suppression rate

The key product metric is repeated use in real grocery moments, not one-time novelty.
