# Brain System Prompt — Spec

Feature **15**. `buildSystemPrompt()` and all prompt **format helpers**, **namespace selection** (`getRelevantNamespaces`), **SQLite read paths** for static blocks, **prefix-cache join order**, and the contract for what is assembled once at session open vs appended later by **13** / **20**.

**Not in this feature:** `BrioelaIdentity` string content (**10-brain-agent-identity**); `openSession` calling the builder (**11-brain-sessions-lifecycle**); `load_session_context` / `search_session_history` tools (**16-brain-session-tools**); live turn append + `generateText` loop (**20-brain-chat-runtime**); Mira/Gemini scene-specific system instructions (**29-cooking-session**, **30-mira-speech-engine**); `formatContinuationContext` implementation (**13-brain-session-compression** — **15** documents where it attaches); sub-agent system prompts (**12-brain-sub-agents**).

---

## Purpose

Every Brain session needs a **stable static prefix** before conversation turns. Without a single builder:

- Block order drifts → Anthropic prefix cache invalidates every turn
- Safety constraints bury under personality/memory
- Skills and recipes load full content instead of index-then-load
- Session kinds load wrong memory namespaces
- Pending alarms and namespace catalogs are missing or duplicated with **16**

Feature **15** owns **orchestration**: read SQLite once at open, format each block, join with `\n\n---\n\n`, return one string. **11** calls it; **20** keeps the prefix immutable for the session lifetime and appends turns below.

---

## Architecture placement

```text
openSession()                              ← 11
        │
        ▼
buildSystemPrompt(db, sessionType, userId) ← 15 (THIS FEATURE)
        │
        ├── import BrioelaIdentity           ← 10
        ├── SQLite reads (blocks 2–9)
        ├── format* helpers
        └── join → systemPrompt string
        │
        ▼
{ sessionId, systemPrompt } returned to caller
        │
        ├── load_session_context tool      ← 16 (optional first turn — richer than Block 6/8 alone)
        ├── formatContinuationContext      ← 13 (only after compression — appended to prefix)
        └── session_turns append           ← 20 (never interleaved into static prefix)
```

**Prefix-cache contract** (`implementable-specs/00-overview.md`, `build-guide/05-brain/06-agent-identity.md`): static blocks are loaded **once at session start** and must appear **before** all conversation turns. Mid-session tool results must not be spliced into the prefix.

---

## Entry point

**Target:** `backend/src/agents/brain/_handlers/build.system.prompt.handler.ts`

```typescript
export async function buildSystemPrompt(
  database: BrainDatabase,
  sessionType: 'chat' | 'cooking' | 'alarm' | 'background',
  userId: string,
): Promise<string>
```

**Call site:** `openSession` (**11**) — immediately after session row insert and watchdog schedule.

**Not called:** mid-session, per turn, or from Mira DO directly (Mira should receive a payload built from the same blocks or import shared helpers — **29** consumer contract).

---

## Canonical static block order (authoritative for implementation)

**Prefer:** `implementable-specs/16-agent-identity.md` + `build-guide/05-brain/03-session-lifecycle.md` + `build-guide/05-brain/06-agent-identity.md`.

| Block | Content | Stable per session? |
|---|---|---|
| **1** | `BrioelaIdentity` | Yes (Worker constant) |
| **2** | Constraints (non-rejected) | Yes |
| **3** | User personality (active traits) | Yes |
| **4** | User memory (namespace-filtered) | Yes |
| **5** | Skills index (`name: description`) | Yes |
| **6** | Recipe index (`id: title`) | Yes — **living block** (product added after core 6) |
| **7** | Pending alarms summary | Yes — **living block** |
| **8** | Active memory namespace catalog | Yes — **living block** |
| **9** | Previous completed session `outcome_summary` | Yes |
| **—** | `[CONTINUATION CONTEXT]` + last 10 turns | After compression only — **13** formats, **15/20** attaches |
| **—** | Conversation turns | **20** — never in `buildSystemPrompt` return |

**Separator:** `blocks.join('\n\n---\n\n')` (build-guide `03-session-lifecycle.md`).

**Empty blocks:** Omit entirely — do not emit headers for empty sections (except Block 1 identity is always present).

---

## Order conflicts between sources (documented — do not hide)

| Source | Order difference |
|---|---|
| `implementable-specs/00-overview.md` | Skills index **before** personality and memory; bundles “session context” as one item (last session + pending alarms + namespaces) |
| `implementable-specs/17-session-lifecycle.md` continuation diagram | Lists `[user_memory, skills index, constraints, personality]` — **not** open order |
| `build-guide/03-session-lifecycle.md` | Core 6 only; constraints **confirmed only**; no recipe/alarms/namespaces blocks |
| `implementable-specs/cooking-session/03-gemini-session.md` | Mira stub order: identity stub → constraints → memory → skills → session lines — **not** Brain builder; must converge on **10** + **15** |

**Resolution for feature 15:** Implement table above (blocks 1–9). Treat `00-overview` as prefix-cache **intent** (static before turns) but **not** block permutation. Treat Mira `buildSystemInstruction` as **consumer gap** until it imports `BrioelaIdentity` and shared format helpers (**29**, **10** G5).

---

## Per-block specification

### Block 1 — Agent identity

| Field | Value |
|---|---|
| **Owner feature** | **10** |
| **Source data** | Worker constant — not SQLite |
| **File** | `identity-prompt.ts` → `BrioelaIdentity` |
| **Format helper** | None — raw string push |
| **When included** | Every session kind |
| **Token cap** | 800 hard cap on identity alone (**16-agent-identity.md**) |
| **Shipped** | ✗ (**10** G1) |

---

### Block 2 — Constraints

| Field | Value |
|---|---|
| **Source table** | `constraints` |
| **Repository** | `listNonRejectedUserConstraints(database, userId)` — **gap** |
| **Format helper** | `formatConstraints(rows)` |
| **When included** | Every session kind |
| **Query filter** | **Prefer** `implementable-specs/06-constraints.md`: `status IN ('proposed', 'confirmed', 'auto_confirmed')` — exclude `rejected` |
| **Build-guide drift** | `03-session-lifecycle.md` uses `status = 'confirmed'` only — **too narrow** for proposed allergy warnings |
| **Ledger drift** | `0003.constraint-tools.md` uses obsolete `active`/`revoked`/`scope` — **ignore** |
| **Shipped** | ✗ tools/repos (**07**); ✗ prompt block (**15**) |

**Format contract (intended — no canonical prose in implementable specs; infer from table columns + product safety):**

```text
## Constraints
Safety and dietary restrictions for this user. Proposed items are not yet verified — warn; confirmed/auto_confirmed items are binding.

- [CONFIRMED] hard_allergy / ingredient / peanuts — notes if any
- [PROPOSED] intolerance / ingredient / dairy — confidence 0.72
...
```

Include: `constraint_type`, `entity_kind`, `entity_value`, `status`, optional `notes`. Order: hard allergies first, then by `proposed_at` ASC within status groups (implementation choice — document in helper).

---

### Block 3 — User personality

| Field | Value |
|---|---|
| **Source table** | `user_personality` |
| **Repository** | `listActiveUserPersonalityTraits(database, userId, { limit })` — **gap** |
| **Format helper** | `formatPersonality(traits)` |
| **When included** | Every session kind |
| **Query** | `is_active = true`, `ORDER BY strength DESC` |
| **Limit** | **Top N only** — `implementable-specs/03-user-personality.md` says not bulk load; **the spec does not define N**. Use `_constants/prompt.block.limits.constant.ts` → `PERSONALITY_TRAIT_LIMIT` (recommended default **15** until product sets explicit cap) |
| **Shipped** | ✗ table exists (**04**); ✗ prompt block |

**Format contract:**

```text
## User personality
Inferred behavioral patterns (Brain maintenance). Apply gently — not diagnoses.

- stress-eater (strength 0.82): description text from row
- meal-planner (strength 0.61): ...
```

Include `trait`, `strength` (2 decimal), `description`. Never include raw `evidence` JSON in prompt — too large.

---

### Block 4 — User memory

| Field | Value |
|---|---|
| **Source table** | `user_memory` |
| **Repository** | `listActiveUserMemoriesForNamespaces(database, userId, namespaces)` — **gap** (extend **05** `listUserMemories` pattern) |
| **Loader** | `loadMemoryForPrompt(namespaces)` per `02-user-memory.md` — fire-and-forget `read_count` / `last_read` bump |
| **Format helper** | `formatMemory(entries)` |
| **When included** | Every session kind — namespaces from `getRelevantNamespaces(sessionType)` |
| **Shipped** | Partial — single-namespace `listUserMemories` exists; namespace-scoped prompt loader ✗ |

**Namespace selection** — `getRelevantNamespaces(sessionType)`:

| `session_type` | Namespaces |
|---|---|
| `cooking` | `health`, `cooking`, `life.dietary`, `health.medications` |
| `chat`, `alarm`, `background` | `health`, `life`, `cooking.preferences` |

**Format contract:**

```text
## User memory
Active facts for relevant namespaces. Extend existing namespaces before creating new ones.

### health
- medications:metformin → {"dose":"500mg",...} (confidence 0.95, stated)
### cooking.preferences
- heat_tolerance → {"level":"medium",...} (confidence 0.8, observed)
```

Group by `namespace`, then `key`. Serialize `value` as compact JSON. Include `confidence` and `source`. Active entries only (`is_active = true`).

---

### Block 5 — Skills index

| Field | Value |
|---|---|
| **Source table** | `skills` |
| **Repository** | `listSkillIndexRows(database, userId)` — **gap** |
| **Format helper** | `formatSkillsIndex(rows)` |
| **When included** | Every session kind |
| **Query** | `status IN ('active', 'stale')`, `ORDER BY use_count DESC` |
| **Columns in index** | `name`, `description` only — never `content` |
| **Shipped** | ✗ |

**Format contract** (from `brioela-specs/09-per-user-brain.md`):

```text
## Available skills
Before replying, scan this list. If one matches your current task, call view_user_skill(name) first.

- cooking-coach: Step-by-step voice cooking methodology with intervention logic
- allergy-detection: Behavioral inference workflow for detecting and confirming allergens
```

Stale skills appear after active at same `use_count` ordering (index `(status, use_count DESC)`).

---

### Block 6 — Recipe index (living block)

| Field | Value |
|---|---|
| **Source table** | `recipes` |
| **Repository** | `listActiveUserRecipeIndexRows(database, userId)` → `{ id, title }[]` — **gap** (**08** G2) |
| **Format helper** | `formatRecipeIndex(rows)` |
| **When included** | **Every session** per `implementable-specs/brioela-tools/13-view-user-recipe.md` and `09-recipes.md` — not cooking-only |
| **Query** | `status = 'active'`, order by `title ASC` (or `last_cooked_at DESC` — product choice; spec says scale is tens–low hundreds) |
| **Line format** | `{id}: {title}` |
| **Shipped** | ✗ |

**Format contract:**

```text
## Recipe index
Call view_user_recipe(id) to load full content when needed.

- 550e8400-e29b-41d4-a716-446655440000: Grandma's Doro Wat
- 6ba7b810-9dad-11d1-80b4-00c04fd430c8: Shiro
```

---

### Block 7 — Pending alarms summary (living block)

| Field | Value |
|---|---|
| **Source table** | `scheduled_alarms` |
| **Repository** | `listPendingUserAlarmsForPrompt(database, userId)` — **gap** |
| **Format helper** | `formatPendingAlarms(rows)` |
| **When included** | `chat`, `cooking`, `alarm` — optional omit for `background` (maintenance reads DB directly) |
| **Query** | `status = 'pending'`, `ORDER BY scheduled_at ASC` |
| **Exclude** | `alarm_type = 'session_watchdog'` — infrastructure, not user-facing reminder |
| **Shipped** | ✗ (**09** has no list-all-pending repo) |

**Relationship to `load_session_context` (**16**):** Tool returns structured JSON (alarms + last 3 sessions + abandoned flag + namespaces). **15** injects a **compact prose block** at open for prefix cache. **16** is optional richer hydration on first turn — not a duplicate of the whole builder. Agent may call tool once if runtime wires it (**20**).

**Format contract:**

```text
## Pending reminders
Agent-scheduled follow-ups still pending. Surface to user when relevant.

- sickness_followup @ 2026-06-14T09:00:00Z (id: …)
- travel_preload @ 2026-06-20T08:00:00Z — payload summary if small
```

Do not include full large JSON payloads — truncate or summarize keys.

---

### Block 8 — Active memory namespace catalog (living block)

| Field | Value |
|---|---|
| **Source table** | `user_memory` |
| **Repository** | `listDistinctActiveMemoryNamespaces(database, userId)` — **gap** |
| **Format helper** | `formatMemoryNamespaces(namespaces: string[])` |
| **When included** | `chat`, `cooking` — agent must see namespace list before first `write_user_memory` |
| **Query** | `SELECT DISTINCT namespace WHERE is_active = true ORDER BY namespace ASC` (max 40) |
| **Shipped** | ✗ |

**Source:** `implementable-specs/brioela-tools/16-load-session-context.md` § Active Memory Namespaces; `02-user-memory.md` session-start injection rationale.

**Format contract:**

```text
## Memory namespaces
Existing active namespaces — reuse before inventing new ones.

cooking.preferences, health, health.medications, life.dietary, life.places
```

---

### Block 9 — Previous session outcome

| Field | Value |
|---|---|
| **Source table** | `sessions` |
| **Repository** | `readLastCompletedSessionOutcome(database, userId)` — **gap** (**11**) |
| **Format helper** | Inline in builder or `formatPreviousSession(summary: string)` |
| **When included** | Every session kind when a prior **completed** session exists |
| **Query** | `status = 'completed'`, `ended_at IS NOT NULL`, `outcome_summary IS NOT NULL`, `ORDER BY ended_at DESC LIMIT 1` |
| **Exclude** | `compressed` parent JSON summaries on continuation open — continuation uses **13** block instead (**13** spec: Block 9 is NOT the compressed parent) |
| **Shipped** | ✗ |

**Format contract** (build-guide):

```text
## Previous Session
Cooked doro wat with grandma. Captured egg-marbling technique. Updated recipe.
```

Plain prose from agent-written `outcome_summary` at close — not turn transcripts.

---

### Block 10 — Continuation context (not in `buildSystemPrompt` at normal open)

| Field | Value |
|---|---|
| **Owner** | **13** — `formatContinuationContext` |
| **When** | After compression, appended to system prompt / initial messages for **new** continuation session |
| **Content** | Four-field JSON summary + last 10 verbatim turns |
| **15 role** | Document attachment point: after blocks 1–9, before live turns; same prefix-cache rules (static tail for that session) |

---

### Block 11 — Conversation turns (not feature 15)

| Field | Value |
|---|---|
| **Owner** | **20** |
| **Storage** | `session_turns` |
| **Rule** | Append only below static prefix — never interleaved |

---

## Session kind matrix

| Block | chat | cooking | alarm | background |
|---|:---:|:---:|:---:|:---:|
| 1 Identity | ✓ | ✓ | ✓ | ✓ |
| 2 Constraints | ✓ | ✓ | ✓ | ✓ |
| 3 Personality | ✓ | ✓ | ✓ | ✓ |
| 4 Memory | chat namespaces | cooking namespaces | chat namespaces | chat namespaces |
| 5 Skills index | ✓ | ✓ | ✓ | ✓ |
| 6 Recipe index | ✓ | ✓ | ✓ | ✓ |
| 7 Pending alarms | ✓ | ✓ | ✓ | omit |
| 8 Namespace catalog | ✓ | ✓ | omit | omit |
| 9 Previous session | ✓ | ✓ | ✓ | ✓ |

---

## Prefix cache and token budget

- **Identity cap:** 800 tokens (**10**).
- **Remaining static prefix:** No single hard cap in implementable specs — product must monitor total prefix size. Skills + recipes scale with user library; personality uses top-N truncation.
- **Stability rule:** No block in the static prefix may change mid-session without invalidating cache. Writes to SQLite during session (**05**–**08**) take effect on **next** session open only.
- **Provider note:** Prefix caching described for Anthropic in specs; Gemini Live (**29**) uses its own caching semantics — still benefit from stable-first ordering.

---

## Mira / scene prompts (boundary)

**NOT assembled by `buildSystemPrompt`:**

- Camera/voice/session lines from `implementable-specs/cooking-session/03-gemini-session.md`
- Mid-session observation prompts (`[URGENT KITCHEN CHECK]`) — **30**
- Acoustic awareness — **39**

**Contract:** Mira should import `BrioelaIdentity` (**10**) and reuse **15** format helpers or receive pre-built blocks from Brain RPC — not parallel stub identity strings.

---

## Feature boundaries

| Feature | Scope |
|---|---|
| **10** | `BrioelaIdentity` constant only |
| **11** | Calls `buildSystemPrompt` at `openSession` |
| **05** | `user_memory` tables + tools; **15** reads for Block 4/8 |
| **06** | Skills tools; **15** reads index for Block 5 |
| **07** | Constraint tools; **15** reads for Block 2 |
| **08** | Recipe tools; **15** reads index for Block 6 |
| **09** | Alarm tools; **15** reads pending rows for Block 7 |
| **13** | Continuation block formatting + when to append |
| **16** | Tool-shaped superset of session-start reads — does not replace builder |
| **20** | Turn loop; keeps prefix immutable; may call **16** once |

---

## Living / evolving prompt blocks

Product may add blocks without renumbering the feature — document new blocks here and in `build.md` when added:

| Block | Status |
|---|---|
| Recipe index | Specified — implement in **15** |
| Pending alarms | Specified in `00-overview` + **16** — implement in **15** |
| Memory namespace catalog | Specified in **16** / **02** — implement in **15** |
| Vectorize session recall snippets | **17** — not in current builder |
| Medical conditions / wearables signals | **22** / **36** — future suffix blocks |
| Kids mode prompt modifiers | **44** — future |

---

## Obsolete ledgers (do not implement from body)

| Ledger | Why obsolete |
|---|---|
| `brain/05-session-lifecycle/0002.system-prompt-builder.md` | Accurate scope; still **open** — use this feature folder |
| `brain/03-tool-protocol/implementation/0003.constraint-tools.md` | Wrong constraint statuses, scope field, Block 4 placement |
| `brain/03-tool-protocol/implementation/0005.recipe-tools.md` | Says "title + description" for recipe index — **wrong**; spec is `id: title` |

---

## Sources

- `implementable-specs/00-overview.md`
- `implementable-specs/02-user-memory.md`
- `implementable-specs/03-user-personality.md`
- `implementable-specs/04-skills.md`
- `implementable-specs/06-constraints.md`
- `implementable-specs/07-sessions.md`
- `implementable-specs/09-recipes.md`
- `implementable-specs/16-agent-identity.md`
- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/brioela-tools/13-view-user-recipe.md`
- `implementable-specs/brioela-tools/16-load-session-context.md`
- `implementable-specs/cooking-session/03-gemini-session.md`
- `build-guide/05-brain/00-overview.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/05-brain/06-agent-identity.md`
- `build-guide/06-brain-memory/01-sqlite-schema.md`
- `brioela-specs/09-per-user-brain.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0002.system-prompt-builder.md`
- `_records/implementation-ledger/brain/04-agent-identity/0001.identity-prompt.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0003.constraint-tools.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0005.recipe-tools.md`
- `_features/05-brain-memory-tools/spec.md`
- `_features/06-brain-skill-tools/spec.md`
- `_features/07-brain-constraint-tools/spec.md`
- `_features/08-brain-recipe-tools/spec.md`
- `_features/09-brain-alarm-tools/spec.md`
- `_features/10-brain-agent-identity/spec.md`
- `_features/11-brain-sessions-lifecycle/spec.md`
- `_features/13-brain-session-compression/spec.md`
