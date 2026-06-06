# Mesa — Potential Members

## What This File Covers

How Brioela can quietly identify possible recurring people at the user's table and suggest Mesa only when evidence is strong.

---

## Core Rule

Potential members are candidates, not active Mesa members.

Brioela may notice repeated patterns, but it must ask before adding anyone.

---

## Evidence Sources

Potential signals:

- repeated guest sessions with overlapping constraints
- cooking sessions mentioning the same family role/person
- repeated "for the kids" meal planning
- repeated shopping/scanning for school snacks
- repeated menu scanning for multiple people
- repeated corrections like "my partner can't eat dairy"

Do not use one mention.

---

## Candidate Threshold

Create candidate only when:

- at least 3 meaningful mentions/events, or
- at least 2 high-confidence recurring cooking/meal sessions, and
- evidence spans more than one day/session, and
- candidate would improve future decisions

Do not prompt more than once every 14 days for Mesa setup.

---

## Candidate Shape

```typescript
type MesaPotentialMember = {
  id: string
  mesaId: string
  suggestedLabel: string
  roleGuess: "partner" | "child" | "elder" | "guest" | "caregiver" | "other" | null
  evidence: Array<{
    source: "cooking" | "scan" | "meal_plan" | "menu" | "guest_session" | "chat"
    summary: string
    capturedAt: number
  }>
  confidence: number
  status: "candidate" | "prompted" | "accepted" | "dismissed" | "expired"
}
```

---

## Prompt Copy

Do not say "track your family."

Use:

```text
I notice you often cook and shop with your kids in mind. Want me to keep their food needs in Mesa so I can check meals and groceries for everyone at your table?
```

Another:

```text
You've mentioned your partner's dairy restriction a few times. Want me to add them to Mesa so I can remember that when you scan, cook, or plan dinner?
```

---

## Dismissal

If user dismisses:

- mark candidate dismissed
- suppress similar prompt for 30 days
- do not keep asking
- keep no active member

If user accepts:

- run conversational setup
- confirm constraints
- create member and constraints through tools

---

## Privacy

Potential member evidence is private and internal. Do not show a timeline of inferred people. Do not sync candidates to other accounts.
