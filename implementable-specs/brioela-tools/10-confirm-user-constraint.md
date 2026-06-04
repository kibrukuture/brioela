# Tool: confirm_user_constraint

## Purpose

`confirm_user_constraint` resolves a `proposed` constraint — moving it to `confirmed`, `auto_confirmed`, or `rejected`. It is also the mechanism for recording that the agent has surfaced a constraint to the user for confirmation (incrementing `surfaced_count` without resolving the constraint yet).

This tool is the only way a constraint's status changes after proposal. The Curator never calls this tool. The agent calls it at two distinct moments:

1. **Surfacing moment** — Agent surfaces the constraint to the user ("You've been avoiding peanuts — is that an allergy?"). Before or after surfacing, call this tool with `mark_surfaced: true` and no `outcome`. This records the attempt.
2. **Resolution moment** — User responds. Agent calls this tool with `outcome` set to the user's answer. Or the agent determines behavioral threshold is met and auto-confirms.

Both moments can be combined in one call if the resolution is immediate (user stated the constraint explicitly in conversation and agent proposes + confirms in the same turn).

## When to Call It

**Surfacing (no outcome):**
- Before surfacing a proposed constraint to the user — to record the attempt
- `mark_surfaced: true`, no `outcome` field

**Resolution:**
- User explicitly says yes to a proposed constraint → `outcome: 'confirmed'`, `confirmation_source: 'user_explicit'`
- User explicitly says no → `outcome: 'rejected'`
- Behavioral threshold is met (only valid for dislike, intolerance, boycott) → `outcome: 'auto_confirmed'`, `confirmation_source: 'behavioral_threshold'`

Do NOT call `confirm_user_constraint` for:
- Proposing a new constraint → `propose_user_constraint`
- Constraints that are already confirmed, auto_confirmed, or rejected — only `proposed` rows can be resolved
- `hard_allergy` or `dietary_identity` with `confirmation_source: 'behavioral_threshold'` — these types require explicit user confirmation, never auto-confirmed

## Input Schema

```typescript
import { z } from 'zod'

export const ConfirmUserConstraintSchema = z.object({
  id: z.string().uuid(),
  // The constraint row to act on. From the id returned by propose_user_constraint.

  mark_surfaced: z.boolean().optional().default(false),
  // Set to true to record that the agent surfaced this constraint to the user.
  // Increments surfaced_count and sets last_surfaced_at = now.
  // Can be true with or without an outcome.
  // Agent must not surface the same constraint more than once per 7 days —
  // check last_surfaced_at before surfacing, not after.

  outcome: z.enum(['confirmed', 'auto_confirmed', 'rejected']).optional(),
  // The resolution outcome. If omitted, only mark_surfaced is processed.
  //   confirmed       — user explicitly said yes. Requires confirmation_source = 'user_explicit'.
  //   auto_confirmed  — behavioral threshold met. Only valid for: dislike, intolerance, boycott.
  //                     Requires confirmation_source = 'behavioral_threshold'.
  //                     NEVER valid for: hard_allergy, dietary_identity.
  //   rejected        — user said no. Row preserved as rejected. No confirmation_source needed.

  confirmation_source: z.enum(['user_explicit', 'behavioral_threshold']).optional(),
  // Required when outcome is 'confirmed' or 'auto_confirmed'.
  // Not needed when outcome is 'rejected'.
  //   user_explicit         — user said yes in this conversation
  //   behavioral_threshold  — agent determined threshold met from accumulated evidence
})
.refine(
  (data) => {
    // If outcome is confirmed or auto_confirmed, confirmation_source is required
    if (data.outcome === 'confirmed' || data.outcome === 'auto_confirmed') {
      return !!data.confirmation_source
    }
    return true
  },
  { message: 'confirmation_source is required when outcome is confirmed or auto_confirmed' }
)
.refine(
  (data) => {
    // If neither mark_surfaced nor outcome is provided, the call does nothing
    if (!data.mark_surfaced && !data.outcome) {
      return false
    }
    return true
  },
  { message: 'Must provide outcome or mark_surfaced: true — an empty call does nothing' }
)
```

## Pre-Resolution Guards

```typescript
const constraint = db.select()
  .from(constraints)
  .where(eq(constraints.id, input.id))
  .get()

if (!constraint) {
  return { error: 'constraint_not_found', id: input.id }
}

if (input.outcome && constraint.status !== 'proposed') {
  return {
    error: 'constraint_already_resolved',
    id: input.id,
    current_status: constraint.status,
    hint: 'Only proposed constraints can be resolved. This one is already ' + constraint.status + '.'
  }
}

// Block auto_confirmed for types that require explicit user confirmation
if (input.outcome === 'auto_confirmed' &&
    input.confirmation_source === 'behavioral_threshold' &&
    ['hard_allergy', 'dietary_identity'].includes(constraint.constraintType)) {
  return {
    error: 'auto_confirm_not_allowed',
    id: input.id,
    constraint_type: constraint.constraintType,
    hint: 'hard_allergy and dietary_identity require explicit user confirmation. Surface this constraint and wait for a user_explicit response.'
  }
}
```

## What It Writes

### When mark_surfaced is true

Regardless of whether outcome is also present:

```typescript
const surfacedUpdates: Partial<typeof constraints.$inferInsert> = {
  surfacedCount:  constraint.surfacedCount + 1,
  lastSurfacedAt: Date.now(),
  updatedAt:      Date.now(),
}
```

### When outcome is 'confirmed' or 'auto_confirmed'

```typescript
const resolutionUpdates = {
  status:              input.outcome,                   // 'confirmed' | 'auto_confirmed'
  confirmationSource:  input.confirmation_source,       // 'user_explicit' | 'behavioral_threshold'
  confirmedAt:         Date.now(),
  updatedAt:           Date.now(),
}
```

### When outcome is 'rejected'

```typescript
const resolutionUpdates = {
  status:    'rejected',
  updatedAt: Date.now(),
  // confirmedAt stays NULL — rejection is not a confirmation
  // confirmationSource stays NULL
}
```

All updates merged and written in a single `db.update().set({...}).where(eq(constraints.id, input.id)).run()`.

## Full Behavior Table

| mark_surfaced | outcome | What Happens |
|---|---|---|
| `true` | none | surfaced_count++, last_surfaced_at = now |
| `false` | `confirmed` | status → confirmed, confirmed_at set, confirmation_source set |
| `false` | `auto_confirmed` | status → auto_confirmed, confirmed_at set, confirmation_source set |
| `false` | `rejected` | status → rejected |
| `true` | `confirmed` | both: surfaced_count++ AND confirm in one call |
| `true` | `rejected` | both: surfaced_count++ AND reject in one call |

## What It Returns

On surfaced-only (no outcome):

```json
{
  "id": "a1b2c3d4-...",
  "surfaced_count": 2,
  "last_surfaced_at": 1748390400000,
  "status": "proposed"
}
```

On confirmed/auto_confirmed:

```json
{
  "id": "a1b2c3d4-...",
  "status": "confirmed",
  "confirmation_source": "user_explicit",
  "confirmed_at": 1748390400000,
  "entity_value": "peanuts",
  "constraint_type": "hard_allergy"
}
```

On rejected:

```json
{
  "id": "a1b2c3d4-...",
  "status": "rejected",
  "entity_value": "peanuts",
  "constraint_type": "hard_allergy"
}
```

## Surfacing Frequency Rules

The agent must enforce these before calling with `mark_surfaced: true`:

- Never surface the same constraint more than **once per 7 days** — check `last_surfaced_at` first
- After **5 rejections** (tracked outside this table — the row has been rejected; any new behavioral evidence for the same entity requires a new proposal via `propose_user_constraint`) — stop actively pursuing
- `hard_allergy` and `dietary_identity` — surface more urgently. These are safety-critical. If the user is about to consume the constrained item, override the 7-day rule and surface immediately

## Behavioral Auto-Confirmation Thresholds (Agent Logic, Not SQL)

Auto-confirmation is valid only for `dislike`, `intolerance`, `boycott`. The thresholds are enforced in agent logic — SQL stores only the result.

| Type | Threshold |
|---|---|
| `dislike` | 5+ avoidance events across 3+ different sessions, zero contradictions |
| `intolerance` | 3+ negative outcome events (felt unwell after consuming), no contradictions |
| `boycott` | 7+ scan/receipt events where brand/place consistently avoided, no purchases |

When threshold is met, call `confirm_user_constraint` with `outcome: 'auto_confirmed'` and `confirmation_source: 'behavioral_threshold'`. The agent does not need to surface this to the user — auto-confirmation is silent.

## Side Effects

None beyond the row update. No alarm triggered. The resolved constraint takes effect immediately — on the next scan, recipe load, or recommendation within this session, the agent applies the confirmed/rejected status.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | Missing required fields, invalid enum | Zod error with failing field |
| Constraint not found | No row with this ID | `{ error: 'constraint_not_found', id }` |
| Already resolved | Status is not 'proposed' | `{ error: 'constraint_already_resolved', id, current_status, hint }` |
| Auto-confirm blocked | hard_allergy or dietary_identity with behavioral_threshold | `{ error: 'auto_confirm_not_allowed', id, constraint_type, hint }` |
| Write failure | SQLite error (rare) | Error message |

## Who Can Call It

- **Agent** — during any active session, for surfacing and resolution
- **NOT the Curator** — Curator never writes to the constraints table
- **NOT device SDK** — tool-layer only

## What Is NOT This Tool's Job

- Proposing a new constraint → `propose_user_constraint`
- Checking whether a product triggers a constraint → agent reads constraints table directly (no tool needed)
- Re-opening a rejected constraint → propose a new one with fresh evidence if new behavioral signals emerge
- Managing surfacing frequency → agent enforces frequency rules before calling this tool
