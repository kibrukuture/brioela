# Ambient Intelligence — Surfacing And Privacy

## What This File Covers

How Ambient Intelligence reaches the user: conversation-first surfaces, notification limits, suppression, consent boundaries, and privacy rules across all four ambient features.

---

## Product Rule

Ambient Intelligence should feel like preparation, not surveillance.

It should appear only when useful, relevant, and easy to ignore.

---

## Surface Hierarchy

Prefer lower-interruption surfaces first:

1. Existing conversation line.
2. Inline scan or recipe secondary text.
3. Weekly summary line.
4. In-app map/app-open moment.
5. Push notification only when timing matters.

Pattern insights and Time Machine moments should almost never use push. Travel preload can use one quiet notification when complete. Guest Mode surfaces inside the active session.

---

## Feature Surface Rules

| Feature | Primary surface | Push allowed? |
|---|---|---|
| behavioral patterns | conversation | no by default |
| pre-trip intelligence | travel-ready notification or app-open/map | yes, once |
| food time machine | inline scan/recipe/summary | no |
| guest mode | active cooking/chat/scan session | no standalone push |

All push behavior must follow `12-notifications`:

- one thing rule
- quiet hours
- active session suppression
- daily caps
- dismissal suppression

---

## Conversation Copy

Ambient copy should be tentative and respectful.

Use:

```text
I've noticed this pattern a few times. Want me to keep an eye on it?
```

Avoid:

```text
You always do this.
```

Use:

```text
I loaded food intel for your London trip.
```

Avoid:

```text
I tracked your travel plans.
```

Use:

```text
You first cooked this last winter.
```

Avoid:

```text
Your eating history says you should cook this again.
```

---

## Suppression

Each ambient family needs suppression state.

```typescript
type AmbientSuppression = {
  userId: string
  family: "patterns" | "travel" | "time_machine" | "guest_mode"
  dismissedCount: number
  suppressedUntil: number | null
  permanentlySuppressed: boolean
}
```

Rules:

- 2 dismissals of the same ambient family suppress for 14 days.
- 3 dismissals can permanently suppress that family.
- Critical safety features are not governed by ambient suppression.
- User can still trigger the feature manually through conversation.

---

## Privacy Rules

Ambient Intelligence uses private user data.

Non-negotiable rules:

- No ad targeting from travel, behavior, guest, or Time Machine data.
- No shared/community writes from guest mode or Time Machine.
- No mental health diagnosis.
- No medical claims from correlations.
- No guest identities or contacts.
- No public timeline or profile.
- No raw transcript exposure outside the Orchestrator-controlled processing path.

Menu and map shared data can help travel preload, but personalized results must be recomputed from private user constraints.

---

## Auditability

Every surfaced ambient moment should be traceable.

Trace data:

- candidate ID
- source event IDs
- surfaced surface
- copy shown
- user action: expanded, dismissed, accepted, ignored
- suppression result if any

This is for product safety and debugging. It is not user-facing social analytics.

---

## Success Metrics

Track usefulness, not volume.

- positive response rate to pattern insights
- travel preload completion before departure
- destination map/scan engagement
- Time Machine moment expansion rate
- guest-safe recipe acceptance
- dismissal and suppression rates

High volume is not a win. Ambient Intelligence succeeds when rare moments feel uncanny in a good way.
