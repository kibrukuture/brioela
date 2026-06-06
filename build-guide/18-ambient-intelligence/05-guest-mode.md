# Ambient Intelligence — Guest Mode

## What This File Covers

Temporary dietary constraint layering when cooking for others, guest session archiving, and later memory promotion for recurring guest patterns.

---

## Core Rule

Guest Mode is conversational and temporary.

The user says something like:

- "My sister is coming for dinner Saturday, she's vegan."
- "I'm cooking for four people, one has celiac."
- "My friend can't eat shellfish."

Brioela creates an active guest constraint layer. It does not modify the user's permanent constraints.

---

## Activation

Activation can happen in chat, cooking, scan, or meal planning context.

```typescript
type GuestSession = {
  sessionId: string
  constraints: Array<{
    type: "allergen" | "intolerance" | "dietary_identity" | "preference"
    value: string
    severity: "hard" | "soft"
  }>
  occasion: string | null
  recipesUsed: string[]
  startedAt: number
  endedAt: number | null
  status: "active" | "archived"
}
```

Response shape:

```text
Got it - I'll keep vegan in mind for this meal and flag anything that does not work for them.
```

Do not ask the user to create a contact or guest profile.

---

## Constraint Layering

Guest constraints are layered on top of the user's own profile.

Effective constraints = user constraints + active guest constraints.

Rules:

- User hard allergies always remain active.
- Guest hard constraints also block suggestions during the active session.
- Multiple guests produce an intersection that works for everyone.
- Guest constraints can flag products that are fine for the user.
- Guest constraints disappear from active filtering when the session ends.

Example scan copy:

```text
Fine for you. Contains gluten - not OK for your guest.
```

---

## Surfaces During Session

Guest Mode affects:

- recipe suggestions
- ingredient substitutions
- product scan verdicts
- shopping list items
- cooking guidance
- menu scanning if the user is choosing restaurant food for a group

The assistant should proactively mention conflicts when they matter:

```text
This recipe uses soy sauce. For your gluten-free guest, use tamari or coconut aminos instead.
```

---

## Session End And Archive

Guest constraints archive when:

- the user ends the cooking/meal session
- 24 hours pass with no activity
- the user says the guest context is no longer needed

Archive contains:

- constraint set
- occasion if stated
- recipes used
- session date

Archive does not contain:

- guest name
- contact information
- personal identity details
- shared/community records

---

## Memory Promotion

The weekly ambient pass reviews archived guest sessions.

Promotion requires repeated overlapping patterns, normally 4+ sessions. The AI can decide not to promote if evidence is weak.

Possible memory:

```typescript
type GuestPatternMemory = {
  namespace: "social.cooking_patterns"
  key: "frequent_guest_restrictions"
  value: {
    restrictions: string[]
    sessionCount: number
    lastOccasion: string | null
  }
  confidence: number
}
```

What can be promoted:

- frequent gluten-free guest constraints
- recurring vegan holiday meals
- frequent nut-free group cooking

What cannot be promoted:

- one-time guest constraints
- guest names
- contact-like guest profiles
- low-confidence assumptions

---

## Future Uses

Once promoted, a guest pattern can make Brioela more helpful:

- "You often cook gluten-free for guests. Want one gluten-free option in this week's plan?"
- "Is anyone joining tonight with dietary needs?"
- "This shopping list has a guest-safe alternative ready."

These prompts should be rare and contextual. Do not turn guest mode into a social graph.

---

## Privacy Boundary

Guest Mode is private to the user's Orchestrator SQLite.

- No shared community signals.
- No public guest profile.
- No named person memory.
- No contact sync.
- No permanent user constraint changes.

The system remembers recurring cooking situations, not people.
