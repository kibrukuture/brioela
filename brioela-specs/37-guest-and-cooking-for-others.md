# 37. Guest Mode — Cooking for Others

## Goal

Allow the user to temporarily add another person's dietary constraints to their session when cooking for guests, without permanently altering their own profile. After the session ends, the guest data is archived and the AI decides over time whether recurring patterns deserve to be promoted to real memory.

## Why This Exists

One of the most stressful cooking situations is cooking for someone with dietary restrictions you are not familiar with. The app currently assumes the user is always cooking for themselves. But cooking for guests is a regular, high-stakes event — one mistake (peanuts for an allergic guest) matters.

Brioela already has the full constraint engine, recipe system, shopping list, and Mira cooking voice. Guest Mode is applying all of that intelligence temporarily to someone else's profile layered on top of the user's own.

## How It Activates

Guest Mode is conversational, not a settings screen.

During any voice session, the user says something like:
- "My sister is coming for dinner Saturday, she's vegan."
- "I'm cooking for four people, one of them has celiac."
- "My friend can't eat shellfish."

The Brain DO detects the guest constraint signal from the transcript and does two things:
1. Creates a `guest_session` with the stated constraints.
2. Responds: "Got it — keeping that in mind for everything today. I'll flag anything that doesn't work for them."

From that point in the session, all recipe suggestions, ingredient checks, scan verdicts, and shopping list generation apply the guest constraints alongside the user's own. The constraints are layered — the user's permanent profile is never modified.

If multiple guests have different constraints, all are tracked. The system finds the intersection that satisfies everyone.

## During the Session

- **Scan verdict**: a product that is fine for the user but violates a guest constraint shows a yellow flag with the reason: "Fine for you. Contains gluten — not safe for your guest."
- **Recipe suggestions**: filtered to clear all active guest constraints, not just the user's own.
- **Mira cooking voice**: when guiding through a recipe, proactively flags any step involving a constrained ingredient: "This calls for soy sauce — does your vegan guest eat soy, or should we use coconut aminos?"
- **Shopping list**: items on the list that violate guest constraints are flagged. Alternatives are suggested.

## Session End and Archiving

When the cooking session ends (or after 24 hours of inactivity on the guest session), the guest constraints are not deleted. They move to `guest_session_archive` in the Brain DO SQLite.

What is archived:
- The guest constraint set (dietary restrictions, allergens)
- The occasion context if stated ("dinner party", "birthday")
- The recipes used
- The session date

The guest profile is not named or identified — only the constraint set matters. No personal information about the guest is stored.

Guest constraints are fully removed from active filtering immediately when the session ends. The user's live experience returns to their own profile only.

## Archive to Memory Promotion

This is where the feature becomes intelligent over time.

The Brain DO's weekly alarm cycle includes a guest pattern review. The review asks: has the user cooked with overlapping guest constraint sets multiple times?

If yes, the AI evaluates whether to promote the pattern to real memory. This is an AI judgment call using the session archive — not a hard threshold rule.

**What gets promoted (examples):**

If the user has 4+ archived guest sessions with gluten-free constraints:
```
user_memory:
  namespace: social.cooking_patterns
  key: frequent_guest_restrictions
  value: { restrictions: ["gluten_free"], session_count: 4, last_occasion: <date> }
  confidence: 0.8
```

If a specific constraint type recurs seasonally (holiday guests, recurring dinner parties):
```
user_memory:
  namespace: social.cooking_patterns
  key: seasonal_occasion_constraints
  value: { occasion: "holiday_dinner", constraints: ["vegan", "nut_free"], recurrence: "annual" }
```

**What never gets promoted:**
- One-time guest constraints. A single session is never enough.
- Low-confidence inferences. If the constraint set varies too widely across sessions, no promotion happens.
- Named personal information. The AI only promotes the constraint pattern, never a person's identity.

**What the promotion enables:**
Once a pattern is in memory, the weekly meal plan (spec 33) can optionally account for it: "You often cook for someone gluten-free. Want me to keep a gluten-free option each week?" The user can confirm or decline.

The cooking voice agent also becomes preemptively aware: if a memory pattern exists for frequent guest restrictions, the agent can ask early in relevant sessions: "Is anyone joining you tonight with dietary needs?"

## The AI's Decision Logic

The promotion decision is made by the AI during the alarm-triggered weekly review. The AI receives:
- The guest session archive (constraint sets, dates, recipe contexts)
- The current `user_memory` for the `social` namespace
- A prompt to evaluate: are there patterns here worth remembering?

The AI writes to memory using the standard `memory_update` tool if it decides a pattern is worth preserving. It does not write if the evidence is weak. The Curator (spec 09) applies the same rules to guest-promoted memories as to any other memory — they age, they can be pruned, they can be overridden.

## Data Model

Stored in Brain DO SQLite (private, per-user):

```sql
guest_session (
  session_id      text primary key,
  constraints_json text not null,   -- [{type: "allergen", value: "gluten"}, ...]
  occasion        text,             -- nullable, e.g. "dinner party", "birthday"
  recipes_used    text,             -- JSON array of recipe IDs
  started_at      integer,
  ended_at        integer,
  status          text default 'active' check(status in ('active','archived'))
)
```

Memory promotion records are standard `user_memory` entries — no separate table.

## What This Does Not Do

- Does not store or display guest names.
- Does not create a "contacts with dietary restrictions" feature — that is a social graph, which Brioela does not build.
- Does not push guest constraints to any shared or community surface.
- Does not permanently modify the user's dietary profile based on guest sessions.

## Success Metrics

- Guest session activation rate per active user per month.
- Constraint-safe recipe suggestion acceptance rate during guest sessions vs. solo sessions.
- Archive-to-memory promotion rate (proxy for how often users cook for the same kind of guest repeatedly).
- User action on promoted memory (accepting the "keep a gluten-free option in meal plans" suggestion).
