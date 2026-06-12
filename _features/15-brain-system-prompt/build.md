# Brain System Prompt — Build

Feature **15**. Production paths under `backend/src/agents/brain/`.

**Depends on:** **10** `BrioelaIdentity`; **04** schemas; **05**–**09** tables (repos partially shipped); **11** `openSession` caller.

**Blocks:** **11** session open prompt; **20** chat runtime; **29** Mira context payload (consumer).

---

## Shipped today

| Area | Status |
|---|---|
| Drizzle schemas (`constraints`, `user_personality`, `user_memory`, `skills`, `recipes`, `sessions`, `scheduled_alarms`) | ✓ (**04**) |
| `listUserMemories` / `readUserMemory` / namespace count (**05**) | ✓ partial |
| `readUserRecipe` / `readActiveUserRecipe` (**08**) | ✓ |
| Alarm MIN-pending repos (**09**) | ✓ |
| `identity-prompt.ts` / `BrioelaIdentity` | ✗ (**10**) |
| `build.system.prompt.handler.ts` | ✗ |
| All `format*` helpers | ✗ |
| `getRelevantNamespaces` | ✗ |
| Prompt-block read repositories | ✗ |
| `loadMemoryForPrompt` + read_count side effect | ✗ |
| `build.system.prompt.handler.test.ts` | ✗ |
| `openSession` → builder wiring | ✗ (**11**) |

**No system prompt production code exists.** `rg buildSystemPrompt backend/src/agents/brain` — zero matches.

---

## File manifest

### Handler (15 core)

| File | Role |
|---|---|
| `_handlers/build.system.prompt.handler.ts` | `buildSystemPrompt(db, sessionType, userId)` — orchestrates blocks 1–9, join, return string |

### Namespace selection

| File | Role |
|---|---|
| `_helpers/get.relevant.namespaces.helper.ts` | `getRelevantNamespaces(sessionType)` — cooking vs default namespace arrays |

### Format helpers (one file per block — colocate or `_helpers/prompt/`)

| File | Role |
|---|---|
| `_helpers/format.constraints.helper.ts` | `formatConstraints(rows)` → Block 2 markdown |
| `_helpers/format.personality.helper.ts` | `formatPersonality(traits)` → Block 3 |
| `_helpers/format.memory.helper.ts` | `formatMemory(entries)` → Block 4 |
| `_helpers/format.skills.index.helper.ts` | `formatSkillsIndex(rows)` → Block 5 |
| `_helpers/format.recipe.index.helper.ts` | `formatRecipeIndex(rows)` → Block 6 |
| `_helpers/format.pending.alarms.helper.ts` | `formatPendingAlarms(rows)` → Block 7 |
| `_helpers/format.memory.namespaces.helper.ts` | `formatMemoryNamespaces(namespaces)` → Block 8 |
| `_helpers/format.previous.session.helper.ts` | `formatPreviousSession(outcomeSummary)` → Block 9 (optional thin wrapper) |

### Memory loader (side effects)

| File | Role |
|---|---|
| `_helpers/load.memory.for.prompt.helper.ts` | `loadMemoryForPrompt(db, userId, namespaces)` — select + fire-and-forget read_count bump per **02-user-memory.md** |

### Constants

| File | Role |
|---|---|
| `_constants/prompt.block.limits.constant.ts` | `PERSONALITY_TRAIT_LIMIT`, optional `MAX_RECIPE_INDEX_LINES` — **N not in spec** |

### Repositories (prompt reads — extend `_repositories/`)

| File | Functions |
|---|---|
| `_repositories/read.prompt.constraints.repository.ts` | `listNonRejectedUserConstraints` |
| `_repositories/read.prompt.personality.repository.ts` | `listActiveUserPersonalityTraits` |
| `_repositories/read.prompt.skills.repository.ts` | `listSkillIndexRows` |
| `_repositories/read.prompt.recipes.repository.ts` | `listActiveUserRecipeIndexRows` |
| `_repositories/read.prompt.alarms.repository.ts` | `listPendingUserAlarmsForPrompt` (exclude `session_watchdog`) |
| `_repositories/read.prompt.memory.repository.ts` | `listActiveUserMemoriesForNamespaces`, `listDistinctActiveMemoryNamespaces` |
| `_repositories/read.prompt.sessions.repository.ts` | `readLastCompletedSessionOutcome` (may merge into **11** session repo) |

Export new functions from `_repositories/index.ts`.

### Tests

| File | Role |
|---|---|
| `_handlers/build.system.prompt.handler.test.ts` | Block order, empty-block omission, namespace matrix, join separator, continuation exclusion |

### Consumers (verify integration when shipping)

| File | Role |
|---|---|
| `_handlers/open.session.handler.ts` | Calls `buildSystemPrompt` — **11** |
| `_handlers/format.continuation.context.helper.ts` | Appended after compression — **13** |
| `brioela.brain.agent.ts` | Chat entry returns prompt — **20** |

### Not in scope (do not add in 15)

| Path | Owner |
|---|---|
| `identity-prompt.ts` | **10** |
| `load.session.context.tool.ts` | **16** |
| Mira `buildSystemInstruction` | **29** |

---

## Implementation contract — `buildSystemPrompt`

```typescript
export async function buildSystemPrompt(
  database: BrainDatabase,
  sessionType: BrainSession['sessionType'],
  userId: string,
): Promise<string> {
  const blocks: string[] = []

  blocks.push(BrioelaIdentity) // 10 — import fails until shipped

  const constraints = listNonRejectedUserConstraints(database, userId)
  if (constraints.length > 0) blocks.push(formatConstraints(constraints))

  const traits = listActiveUserPersonalityTraits(database, userId, {
    limit: PERSONALITY_TRAIT_LIMIT,
  })
  if (traits.length > 0) blocks.push(formatPersonality(traits))

  const namespaces = getRelevantNamespaces(sessionType)
  const memories = await loadMemoryForPrompt(database, userId, namespaces)
  if (memories.length > 0) blocks.push(formatMemory(memories))

  const skills = listSkillIndexRows(database, userId)
  if (skills.length > 0) blocks.push(formatSkillsIndex(skills))

  const recipes = listActiveUserRecipeIndexRows(database, userId)
  if (recipes.length > 0) blocks.push(formatRecipeIndex(recipes))

  if (sessionType !== 'background') {
    const alarms = listPendingUserAlarmsForPrompt(database, userId)
    if (alarms.length > 0) blocks.push(formatPendingAlarms(alarms))
  }

  if (sessionType === 'chat' || sessionType === 'cooking') {
    const nsCatalog = listDistinctActiveMemoryNamespaces(database, userId)
    if (nsCatalog.length > 0) blocks.push(formatMemoryNamespaces(nsCatalog))
  }

  const lastOutcome = readLastCompletedSessionOutcome(database, userId)
  if (lastOutcome) blocks.push(formatPreviousSession(lastOutcome))

  return blocks.join('\n\n---\n\n')
}
```

**Rules:**

1. Block order is **fixed** — tests must assert array push order.
2. `BrioelaIdentity` always first — even if over token cap (**10** owns trim).
3. No `await` on read_count fire-and-forget except `loadMemoryForPrompt` may use `waitUntil` when ctx available — helper accepts optional `ExecutionContext`.
4. Return type is plain `string` — not `{ blocks, joined }`.
5. Continuation sessions: `readLastCompletedSessionOutcome` must not return compressed parent's JSON — filter `status = 'completed'` only.

---

## Acceptance criteria

1. `build.system.prompt.handler.ts` exports `buildSystemPrompt` with signature above.
2. Block order matches `spec.md` table (1–9) for each session kind matrix.
3. Empty sections omitted — only identity guaranteed non-empty once **10** ships.
4. `getRelevantNamespaces('cooking')` returns four namespaces; default path returns three.
5. Constraints query uses non-rejected statuses — not ledger `active`.
6. Skills index includes `active` + `stale`, ordered by `use_count DESC`.
7. Recipe index lines are `{uuid}: {title}`.
8. Pending alarms exclude `session_watchdog`.
9. `loadMemoryForPrompt` increments `read_count` / `last_read` fire-and-forget.
10. Join separator is exactly `\n\n---\n\n`.
11. `bun run verify` passes after implementation.
12. `build.system.prompt.handler.test.ts` covers order, cooking namespaces, empty user, and alarm exclusion.
13. **11** `openSession` imports builder without circular deps.

---

## Verification commands

```sh
cd backend && bun run brain:typecheck
cd backend && bunx vitest run src/agents/brain/_handlers/build.system.prompt.handler.test.ts
cd backend && rg 'buildSystemPrompt|formatConstraints|getRelevantNamespaces' src/agents/brain
```

---

## Blocked by

| Feature | Blocker |
|---|---|
| **10** | `BrioelaIdentity` import |
| **07** | Constraint list repo (tools optional for prompt read) |
| **06** | Skill index repo |
| **08** | Recipe index repo (**08** G2) |
| **11** | Session outcome read repo |

## Blocks

- **11-brain-sessions-lifecycle** — open returns prompt
- **20-brain-chat-runtime** — uses prompt in model call
- **29-cooking-session** — should consume shared blocks

---

## Sources

- `_features/15-brain-system-prompt/spec.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0002.system-prompt-builder.md`
