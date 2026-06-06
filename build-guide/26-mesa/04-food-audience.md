# Mesa — Food Audience

## What This File Covers

How each scan, recipe, menu, meal plan, cooking session, and Bela order decides who the food is for.

---

## Core Concept

Food Audience is the active evaluation context.

```typescript
type FoodAudience = {
  mode: "just_me" | "mesa" | "selected_members" | "guest_session"
  mesaId: string | null
  memberIds: string[]
  source: "explicit" | "inferred" | "session_default"
  expiresAt: number | null
}
```

---

## Modes

`just_me`:

- evaluate only signed-in user's personal constraints
- default for solo scans unless context suggests otherwise

`mesa`:

- evaluate all active Mesa members
- useful for groceries, family meals, restaurant choice

`selected_members`:

- evaluate subset, such as "the kids" or "me and grandma"

`guest_session`:

- temporary guest constraints from Guest Mode
- can combine with Mesa if user says "Mesa plus my friend tonight"

---

## Audience Selection

Selection should be conversational and sticky within a session.

Examples:

```text
Check this for everyone.
```

```text
This is just for me.
```

```text
Plan dinner for me, my partner, and the kids.
```

```text
Which dishes work for the whole table?
```

Ask only when needed. Do not ask "who is this for?" on every scan.

---

## Defaults

Initial defaults:

- grocery store context + Mesa active → suggest Mesa audience after pattern observed
- cooking dinner → ask once if likely shared meal
- Kids co-scan → child learning mode, but parent constraints still safety-first
- menu scanning for group → offer Mesa if active
- Bela order → default to Mesa only if user selected Mesa for the order

---

## Expiry

Audience can expire.

Examples:

- `just_me`: no expiry needed
- `selected_members` for a cooking session: expires at session end
- `guest_session`: expires at guest session archive
- `mesa` grocery run: expires after several hours or app session

This prevents yesterday's dinner audience from affecting today's solo scan.
