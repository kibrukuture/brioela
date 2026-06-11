# Brain Constraint Tools — Spec

Feature **07**. Two AI-callable tools for safety-critical dietary restrictions: `propose_user_constraint` and `confirm_user_constraint`. Constraints gate scanning, recipes, cooking, and recommendations across the product.

---

## Purpose

- **`constraints`** — allergies, intolerances, dislikes, dietary identity, boycotts with a **propose → confirm** workflow.
- **Not `user_memory`** — constraints have `proposed` / `confirmed` / `auto_confirmed` / `rejected` lifecycle; facts table has no confirmation model.

Hard rule: **Brain maintenance never writes** to `constraints` (`06-constraints.md`, `15-brain-maintenance`). Only the live agent via these two tools (plus agent-side auto-confirm logic calling `confirm_user_constraint`).

There is **no delete tool** — rejections preserve history. Re-proposal after `rejected` is allowed when new evidence exists.

---

## Why a separate table

A proposed peanut allergy surfaces warnings; a **confirmed** hard allergy blocks unconditionally. That is two behaviors, not a confidence score on a memory fact. Evidence points to **`memory_event` IDs** (raw behavior), not `user_memory` IDs.

Confirmation is **ambient** — mid-scan voice prompts, cooking moments, behavioral auto-confirm for soft types. No settings forms.

---

## Tables owned (tool semantics)

Schema: `backend/src/agents/brain/_schemas/constraint.schema.ts` (**04-brain-foundation**). This feature owns tool behavior.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | `createId()` |
| `user_id` | TEXT | Owner |
| `constraint_type` | TEXT enum | See five types below |
| `entity_kind` | TEXT enum | `ingredient \| category \| brand \| place` |
| `entity_value` | TEXT | Match target: `"peanuts"`, `"vegan"`, `"Nestlé"` |
| `status` | TEXT enum | `proposed \| confirmed \| auto_confirmed \| rejected` |
| `confidence` | REAL 0–1 | Snapshot at proposal — **never updated** |
| `evidence` | TEXT JSON array | `memory_event` IDs — min 1 at propose |
| `surfaced_count` | INTEGER | Confirmation surfacing attempts |
| `last_surfaced_at` | INTEGER ms nullable | Last surfacing |
| `confirmation_source` | TEXT nullable | `user_explicit \| behavioral_threshold` |
| `notes` | TEXT nullable | Agent context at proposal |
| `proposed_at` | INTEGER ms | Immutable |
| `confirmed_at` | INTEGER ms nullable | Set on confirm/auto_confirm |
| `updated_at` | INTEGER ms | Any row change |

**Indexes (shipped):** `(constraint_type, status)`, `(entity_kind, entity_value, status)`, partial `(last_surfaced_at) WHERE status = 'proposed'`.

---

## Five constraint types — post-confirmation behavior

| Type | Behavior | Auto-confirm allowed? |
|---|---|---|
| `hard_allergy` | **BLOCK** unconditionally | **Never** — `user_explicit` only |
| `intolerance` | **WARN**, user may proceed | Yes — behavioral threshold |
| `dislike` | **DEPRIORITIZE** silently | Yes — behavioral threshold |
| `dietary_identity` | **FILTER** categories (vegan, halal, …) | **Never** — explicit only |
| `boycott` | **BLOCK** brand/place | Yes — behavioral threshold |

**Proposed** rows are active-but-unverified: warnings may apply; full block/filter behavior strengthens after confirmation (`09-propose-user-constraint.md`).

---

## Tool split layout (mandatory)

Same as **05** / **06**: four files per tool (`_schemas/`, `_prompts/`, `_executables/`, `.tool.ts`). Complaints **007–010** apply.

---

## Tool 1: `propose_user_constraint`

**Purpose:** Insert row with `status = 'proposed'`.

**When:** Behavioral inference supported by logged `memory_event` evidence; no active duplicate for same `(constraint_type, entity_kind, entity_value)`.

**When NOT:** Guessing without events; duplicate active row exists (`proposed`, `confirmed`, `auto_confirmed`).

**Direct user statement flow:** Propose first, then **immediately** `confirm_user_constraint` with `outcome: 'confirmed'`, `confirmation_source: 'user_explicit'` — especially hard allergies.

**Input:**

| Field | Required | Notes |
|---|---|---|
| `constraint_type` | yes | Five-type enum |
| `entity_kind` | yes | Four-kind enum |
| `entity_value` | yes | 1–200 chars |
| `confidence` | yes | 0–1 snapshot |
| `evidence` | yes | `z.array(z.uuid()).min(1)` — event IDs |
| `notes` | no | max 500 |

**System-filled:** `id`, `user_id`, `status='proposed'`, `surfaced_count=0`, `last_surfaced_at=null`, timestamps.

**Duplicate guard:** Query active statuses for same type + entity; return `constraint_already_active` with existing `id`.

**Returns:** `{ id, constraint_type, entity_kind, entity_value, status: 'proposed', confidence }`

**Who:** Agent only — not Brain maintenance, not device SDK.

---

## Tool 2: `confirm_user_constraint`

**Purpose:** (1) Record surfacing attempt; (2) resolve `proposed` → `confirmed` / `auto_confirmed` / `rejected`.

**Input:**

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Constraint UUID |
| `mark_surfaced` | no | Default false — increments `surfaced_count`, sets `last_surfaced_at` |
| `outcome` | no | `confirmed \| auto_confirmed \| rejected` |
| `confirmation_source` | conditional | Required when outcome is `confirmed` or `auto_confirmed` |

**Zod refines:**

- Must provide `outcome` and/or `mark_surfaced: true` (empty call illegal).
- `confirmation_source` required for confirm outcomes.

**Pre-guards:**

- Row exists; `outcome` only if `status === 'proposed'`.
- Block `auto_confirmed` + `behavioral_threshold` for `hard_allergy` and `dietary_identity`.

**Behavior matrix:**

| mark_surfaced | outcome | Effect |
|---|---|---|
| true | — | surfaced_count++, last_surfaced_at |
| — | confirmed | status, confirmation_source, confirmed_at |
| — | auto_confirmed | same |
| — | rejected | status rejected; confirmed_at stays null |
| true | confirmed/rejected | Both surfacing + resolution |

**Surfacing rules (agent-enforced before `mark_surfaced`):**

- Same constraint max **once per 7 days** (check `last_surfaced_at`).
- **Hard allergy / dietary identity:** may override 7-day rule when user about to consume constrained item.
- After **rejection**, stop pursuing until new proposal with fresh evidence.

**Auto-confirm thresholds (agent logic, not SQL):**

| Type | Threshold | Time window (`15-brain-maintenance` gap fix) |
|---|---|---|
| `dislike` | 5+ avoidance events, 3+ sessions, zero contradictions | 90 days |
| `intolerance` | 3+ negative outcome events | 60 days |
| `boycott` | 7+ consistent avoidance events, no purchases | 120 days |

Silent auto-confirm — no user prompt required when threshold met (eligible types only).

**Who:** Agent only — **chat sessions per tool protocol** (see Permissions).

**Not this tool:** Product ingredient matching (scanner/read paths); proposing new rows.

---

## Permission matrix (`SessionKind`)

From `build-guide/05-brain/02-tool-protocol.md` (authoritative over stale ledger 0003):

| Tool | chat | cooking | alarm | brain_maintenance | behavior_pattern |
|---|---|---|---|---|---|
| `propose_user_constraint` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `confirm_user_constraint` | ✓ | ✗ | ✗ | ✗ | ✗ |

**Cooking may propose** (e.g. voice mid-recipe) but **cannot confirm** — confirm happens in chat or same-session agent must use chat path. Product implication: Mira cooking flow needs design for confirm handoff (**20-brain-chat-runtime** / **29-cooking-session**).

`getBrainTools()` must reflect this matrix (not shipped — G2).

---

## Read paths (no read tool)

Per specs, the agent does **not** call a constraint read tool:

- **Session prompt** — constraints block injected at session start (**15-brain-system-prompt**). Build guide Block 2 currently loads only `status = 'confirmed'`; table spec says all **non-rejected** for full picture — alignment gap (**15**, G13).
- **Scanner** — reads confirmed constraints from Brain SQLite (**24-scanner**, `build-guide/07-scanner/03-constraint-check.md`).
- **Duplicate check / confirm guards** — repositories inside executables.

---

## Memory event linkage

- Before propose: agent must `log_memory_event` (or have system events) and pass IDs in `evidence`.
- Known kind: `constraint_declared` when user explicitly states allergy/dislike (`01-memory-event.md`).

---

## Session counters

`propose_user_constraint` should increment `sessions.constraints_proposed` during active session (`07-sessions.md`) — session handler not built (G12).

---

## Ledger drift warning

`_records/.../0003.constraint-tools.md` describes **obsolete** model: `scope`, `pending`/`active`/`revoked`, wrong permissions. **Do not implement from ledger body** — use implementable specs + this folder. Ledger kept as historical touch-file list only.

---

## Cross-feature boundaries

| Feature | Relationship |
|---|---|
| **04-brain-foundation** | Schema + migration indexes |
| **05-brain-memory-tools** | `log_memory_event` supplies evidence IDs |
| **15-brain-system-prompt** | Block 2 constraints injection |
| **20-brain-chat-runtime** | Tool registration + confirm in chat |
| **29-cooking-session** | Propose during Mira; confirm gap |
| **24-scanner** | Ingredient match against confirmed rows |
| **12-brain-sub-agents** | Maintenance **reads only**, never writes |

---

## Sources

- `implementable-specs/06-constraints.md`
- `implementable-specs/brioela-tools/09-propose-user-constraint.md`
- `implementable-specs/brioela-tools/10-confirm-user-constraint.md`
- `implementable-specs/brioela-tools/00-index.md`
- `implementable-specs/brioela-tools/01-log-memory-event.md` (evidence chain, `constraint_declared`)
- `implementable-specs/01-memory-event.md`
- `implementable-specs/07-sessions.md` (`constraints_proposed`)
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md` (hard boundaries, time windows)
- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/00-overview.md`
- `implementable-specs/13-gaps-and-missing-specs.md` (threshold time windows — addressed in 15)
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/03-session-lifecycle.md` (Block 2)
- `build-guide/06-brain-memory/01-sqlite-schema.md` (Table 6)
- `build-guide/07-scanner/03-constraint-check.md` (downstream read pattern)
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0003.constraint-tools.md` (obsolete model — file list only)
- `_records/implementation-ledger/brain/02-sqlite-migration-runtime/implementation/0001.schema-indexes-alignment.md`
- `_records/while-implementation-user-complaints/02-user-complaints/007-tool-monolithic-file-structure-mismatch.md`

**Product context (not Brain tool implementation):** `brioela-specs/07-allergy-dislike-and-dietary-guardrails.md` — legacy API naming; Brain truth is DO SQLite + these tools.
