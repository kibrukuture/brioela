# Brain Constraint Tools — Build

Feature **07**. Production paths under `backend/src/agents/brain/`.

---

## Shipped today

| Area | Status |
|---|---|
| `_schemas/constraint.schema.ts` | ✓ |
| `propose.user.constraint.tool.ts` + split files | ✗ |
| `confirm.user.constraint.tool.ts` + split files | ✗ |
| Repositories | ✗ |
| `get.brain.tools.ts` entries | ✗ |
| Tests | ✗ |

---

## File manifest (intended)

### Schema (04 owns DDL; 07 owns tool semantics)

| File | Role |
|---|---|
| `_schemas/constraint.schema.ts` | Table + enums + CHECKs + three indexes |

### Repositories (to implement)

| File | Functions |
|---|---|
| `_repositories/read.user.constraint.repository.ts` | `readUserConstraint`, `findActiveUserConstraintByEntity`, `listNonRejectedUserConstraints` (prompt/scanner helpers) |
| `_repositories/write.user.constraint.repository.ts` | `insertUserConstraint`, `updateUserConstraint` (confirm path merges surfaced + resolution fields) |

Export from `_repositories/index.ts`.

**Note:** Ledger 0003 proposed `listActiveUserConstraints` with `status = 'active'` — **wrong**. Use spec statuses (`proposed`, `confirmed`, `auto_confirmed`, `rejected`).

### Tools — split layout (2 × 4 = 8 files)

| Tool | `.tool.ts` | `_schemas/` | `_prompts/` | `_executables/` |
|---|---|---|---|---|
| `propose_user_constraint` | `propose.user.constraint.tool.ts` | `propose.user.constraint.schema.ts` | `propose.user.constraint.prompt.ts` | `propose.user.constraint.executable.ts` |
| `confirm_user_constraint` | `confirm.user.constraint.tool.ts` | `confirm.user.constraint.schema.ts` | `confirm.user.constraint.prompt.ts` | `confirm.user.constraint.executable.ts` |

Reference: `schedule.user.alarm.tool.ts` + siblings (thin wrapper pattern).

### Registration

| File | Change |
|---|---|
| `_tools/get.brain.tools.ts` | Add both tools; **propose** in `chat` + `cooking`; **confirm** in `chat` only |
| `_tools/_schemas/index.ts` | Export constraint schemas |
| `_tools/_prompts/index.ts` | Export constraint prompts |
| `_tools/_executables/index.ts` | Export constraint executables |

---

## Executable contracts

### `proposeUserConstraintExecutable`

1. Parse Zod (`ProposeUserConstraintSchema` with `.strict()`).
2. `findActiveUserConstraintByEntity(type, kind, value)` — if hit, return `constraint_already_active`.
3. `insertUserConstraint` with `evidence: JSON.stringify(evidence)`, `createId()` for `id`, `readCurrentEpochMs()` for timestamps.
4. Optional hook: increment session `constraints_proposed` when session context exists (future).

### `confirmUserConstraintExecutable`

1. Load row by `id` — `constraint_not_found` if missing.
2. If `outcome`: guard `status === 'proposed'`; block auto_confirm on hard_allergy/dietary_identity.
3. Merge patch: surfaced fields if `mark_surfaced`; resolution fields if `outcome`.
4. Single `updateUserConstraint` write.

**Zod:** Port `.refine()` rules from `10-confirm-user-constraint.md` into schema file.

---

## Permission matrix (this feature)

| Tool | chat | cooking | alarm | brain_maintenance | behavior_pattern |
|---|---|---|---|---|---|
| `propose_user_constraint` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `confirm_user_constraint` | ✓ | ✗ | ✗ | ✗ | ✗ |

---

## Tests (to implement)

| File | Cases |
|---|---|
| `_tools/constraint.tool.test.ts` | propose inserts proposed row; duplicate guard; confirm confirmed with user_explicit; auto_confirm blocked for hard_allergy; mark_surfaced increments; reject preserves row; confirm on non-proposed fails |

Ledger wrongly suggested adding to `memory.tool.test.ts` — use dedicated file like recipe/alarm tests.

---

## Verification (when implemented)

```bash
cd backend && bun run brain:typecheck
cd backend && bun run brain:test
```

---

## Draft folder

**2** snapshots today: `constraint.schema.ts` + `get.brain.tools` gap excerpt. Regenerate when tools ship.
