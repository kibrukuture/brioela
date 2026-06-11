# Tool: propose_user_constraint

## Purpose

`propose_user_constraint` inserts a new row into `constraints` with `status = 'proposed'`. The agent calls this when it has inferred, from behavioral evidence, that a constraint likely applies to this user — but has not yet confirmed it with the user.

A proposed constraint is active but unverified. It surfaces warnings but does not yet block (for hard allergies) or filter silently (for dislikes). The full blocking and filtering behavior activates only after `confirm_user_constraint` transitions it to `confirmed` or `auto_confirmed`.

This tool is the agent's only way to write to `constraints`. The Brain maintenance never writes to this table — constraints are too safety-critical for autonomous background modification.

## Why Evidence Is Mandatory

A constraint with no evidence is a hallucination. If the agent cannot point to specific `memory_event` IDs that led to this inference, it should not be proposing the constraint. This is enforced by Zod — `evidence` must be a non-empty array of at least one UUID. The agent must have already logged the triggering events via `log_memory_event` before calling this tool.

## Duplicate Detection

Before proposing, check whether an active constraint of the same type and entity already exists:

```typescript
const existing = db.select()
  .from(constraints)
  .where(
    and(
      eq(constraints.constraintType, input.constraint_type),
      eq(constraints.entityKind,     input.entity_kind),
      eq(constraints.entityValue,    input.entity_value),
      inArray(constraints.status, ['proposed', 'confirmed', 'auto_confirmed'])
    )
  )
  .get()

if (existing) {
  return {
    error: 'constraint_already_active',
    id: existing.id,
    status: existing.status,
    hint: 'An active constraint for this entity and type already exists. Use confirm_user_constraint to resolve it, or add more evidence via log_memory_event.'
  }
}
```

A `rejected` constraint CAN be re-proposed if new evidence appears. A `proposed` or `confirmed` one cannot — no duplicate rows for the same (type, entity_kind, entity_value) tuple in active states.

## When to Call It

Call `propose_user_constraint` when:
- The agent has observed repeated behavioral signals pointing to a restriction (user avoids a product consistently, user reacts negatively after consuming something)
- Evidence exists in `memory_event` — the triggering events are already logged
- No active constraint for this entity + type already exists

Do NOT call `propose_user_constraint` when:
- The user has directly stated the constraint mid-conversation — use `propose_user_constraint` first to record it, then immediately call `confirm_user_constraint` with `outcome = 'confirmed'` and `confirmation_source = 'user_explicit'`. The row must exist before it can be confirmed.
- An active constraint already exists for this entity + type — check first
- The agent is guessing without supporting events — evidence is required

## Input Schema

```typescript
import { z } from 'zod'

export const ProposeUserConstraintSchema = z.object({
  constraint_type: z.enum(['hard_allergy', 'intolerance', 'dislike', 'dietary_identity', 'boycott']),
  // The type of constraint inferred. Determines blocking behavior after confirmation:
  //   hard_allergy     — BLOCK unconditionally. Must be user_explicit to confirm. Never auto_confirmed.
  //   intolerance      — WARN but do not block. Can auto_confirm after high behavioral threshold.
  //   dislike          — DEPRIORITIZE silently. Can auto_confirm after 5+ avoidance events.
  //   dietary_identity — FILTER entire category (vegan, halal, kosher). Must be user_explicit to confirm. Never auto_confirmed.
  //   boycott          — BLOCK a specific brand or place. Can auto_confirm after 7+ avoidance events.

  entity_kind: z.enum(['ingredient', 'category', 'brand', 'place']),
  // What kind of thing this constraint applies to.
  //   ingredient  — a food component: "peanuts", "lactose", "gluten"
  //   category    — a food class: "vegan", "halal", "kosher", "shellfish"
  //   brand       — a specific brand: "Nestlé", "Coca-Cola"
  //   place       — a specific venue: "Bole Road shawarma place", "that sushi spot near work"

  entity_value: z.string().min(1).max(200),
  // The actual constrained thing. Freeform text.
  // This value is what gets matched against product ingredients, recipe contents,
  // and place IDs at check time. Be as specific and consistent as possible —
  // "peanuts" not "peanut", "Nestlé" not "nestle".

  confidence: z.number().min(0).max(1),
  // Agent's certainty at inference time. 0.0 to 1.0.
  // This is a snapshot — set at proposal time and never updated.
  // Used by the agent when deciding whether and how urgently to surface this for confirmation.
  // Not a dynamic score. After confirmation or rejection, confidence is for historical context only.

  evidence: z.array(z.uuid()).min(1),
  // IDs from memory_event — the raw events that led to this inference.
  // Minimum one ID. The agent must have logged the triggering events first.
  // No evidence = no proposal.

  notes: z.string().max(500).optional(),
  // Optional freeform context captured at proposal time.
  // Helps the agent surface a richer, more specific confirmation message later.
  // Example: "User said 'that place made me sick' after receipt from Bole Road shawarma"
  // Not required. If the evidence speaks for itself, omit.
})
```

## What the System Fills In Automatically

| Field | Value |
|---|---|
| `id` | UUID v4 |
| `user_id` | From DO context |
| `status` | `'proposed'` |
| `surfaced_count` | `0` |
| `last_surfaced_at` | `NULL` |
| `confirmation_source` | `NULL` |
| `confirmed_at` | `NULL` |
| `proposed_at` | `Date.now()` |
| `updated_at` | `Date.now()` |

## What It Writes

One insert into `constraints`:

```typescript
db.insert(constraints).values({
  id:               createId(),
  userId:           ctx.userId,
  constraintType:   input.constraint_type,
  entityKind:       input.entity_kind,
  entityValue:      input.entity_value,
  status:           'proposed',
  confidence:       input.confidence,
  evidence:         JSON.stringify(input.evidence),
  surfacedCount:    0,
  lastSurfacedAt:   null,
  confirmationSource: null,
  notes:            input.notes ?? null,
  proposedAt:       Date.now(),
  confirmedAt:      null,
  updatedAt:        Date.now(),
}).run()
```

## What It Returns

On success:

```json
{
  "id": "a1b2c3d4-...",
  "constraint_type": "hard_allergy",
  "entity_kind": "ingredient",
  "entity_value": "peanuts",
  "status": "proposed",
  "confidence": 0.85
}
```

The agent should now plan when and how to surface this to the user. High confidence + `hard_allergy` = surface immediately or at the next natural opportunity. Low confidence + `dislike` = surface when there are enough sessions to auto-confirm or contradict.

## Immediate Actions After Propose

If the user stated the constraint directly in this conversation (not inferred — directly stated), call `confirm_user_constraint` immediately after this tool returns, using the ID from the response:

```
propose_user_constraint → receives id
confirm_user_constraint(id, outcome='confirmed', confirmation_source='user_explicit')
```

Do not leave a directly-stated hard allergy as `proposed`. Confirm it in the same session.

## Side Effects

None beyond the insert. No alarm triggered. The constraint is active as `proposed` immediately — the agent uses it for warnings on the next scan or recipe load within this session.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | Missing fields, evidence empty, confidence out of range | Zod error with failing field |
| Constraint already active | Same type + entity_kind + entity_value in proposed/confirmed/auto_confirmed | `{ error: 'constraint_already_active', id, status, hint }` |
| Write failure | SQLite error (rare) | Error message |

## Who Can Call It

- **Agent** — during any active session, when behavioral inference is supported by memory_event evidence
- **NOT the Brain maintenance** — Brain maintenance reads constraints for context, never writes to this table
- **NOT device SDK** — tool-layer only

## What Is NOT This Tool's Job

- Confirming or rejecting a proposed constraint → `confirm_user_constraint`
- Resolving which constraints apply to a product → the agent reads the constraints index directly
- Incrementing `surfaced_count` → handled by `confirm_user_constraint` with `mark_surfaced: true`
