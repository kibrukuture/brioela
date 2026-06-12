# Status

open

`buildSystemPrompt()` — static blocks 1–9 in prefix-cache order; format helpers; namespace selection; SQLite prompt reads. **No production code shipped.**

---

## Shipped vs gap summary

| Component | Shipped |
|---|---|
| `_handlers/build.system.prompt.handler.ts` | ✗ |
| `getRelevantNamespaces` | ✗ |
| `formatConstraints` / `formatPersonality` / `formatMemory` / `formatSkillsIndex` / `formatRecipeIndex` / `formatPendingAlarms` / `formatMemoryNamespaces` | ✗ |
| `loadMemoryForPrompt` + read_count side effect | ✗ |
| Prompt-block repositories (constraints, personality, skills, recipes, alarms, sessions) | ✗ |
| `PERSONALITY_TRAIT_LIMIT` constant | ✗ — **spec does not define N** |
| Tests | ✗ |
| **10** `BrioelaIdentity` | ✗ — **blocks Block 1** |
| **11** `openSession` wiring | ✗ |

---

## Gaps

| ID | Gap | Spec / evidence |
|---|---|---|
| G1 | **`BrioelaIdentity` missing** — builder cannot compile Block 1 | **10** `status.md`; no `identity-prompt.ts` in `backend/` |
| G2 | **`buildSystemPrompt` handler not created** | Ledger `0002.system-prompt-builder.md` open |
| G3 | **All format helpers missing** | Referenced in `build-guide/03-session-lifecycle.md`; zero `format*.helper.ts` in repo |
| G4 | **`getRelevantNamespaces` missing** | `03-session-lifecycle.md` lines 121–126 |
| G5 | **Constraint prompt repo** — `listNonRejectedUserConstraints` not built | **07** tools/repos open; build-guide uses `confirmed` only — **15** prefers non-rejected per `06-constraints.md` |
| G6 | **Personality prompt repo + top-N limit** | `03-user-personality.md` — top N unspecified |
| G7 | **`loadMemoryForPrompt` not implemented** | `02-user-memory.md` § read_count side effect; **05** G3 |
| G8 | **Skill index repo** — `listSkillIndexRows` | **06** G12 |
| G9 | **Recipe index repo** — `listActiveUserRecipeIndexRows` | **08** G2 |
| G10 | **Pending alarms list repo** — exclude `session_watchdog` | **09** — no list-all-pending |
| G11 | **Memory namespace catalog repo** | **16** / `16-load-session-context.md` |
| G12 | **`readLastCompletedSessionOutcome`** | **11** session repos open |
| G13 | **Block order conflict unresolved in code** — `00-overview.md` permutes skills before personality/memory | Documented in `spec.md`; implement 16-agent-identity order |
| G14 | **Recipe index block absent from build-guide builder sample** | Extended in `spec.md` from `09-recipes.md` / `13-view-user-recipe.md` |
| G15 | **Pending alarms + namespace blocks absent from build-guide builder sample** | Extended from `00-overview.md` + **16** |
| G16 | **Mira uses inline identity stub** — not shared builder | `cooking-session/03-gemini-session.md` — **29** / **10** G5 |
| G17 | **Continuation block attachment** — `formatContinuationContext` in **13**, not wired to builder | **13** draft exists; **15** documents boundary only |
| G18 | **No token budget enforcement** for full static prefix (only identity 800 cap) | Product gap — monitor total prefix size |
| G19 | **Tests missing** | No `build.system.prompt.handler.test.ts` |

---

## Blocked by

- **10-brain-agent-identity** — Block 1 constant
- **04-brain-foundation** — schemas ✓ (unblocked for reads once repos exist)
- **05-brain-memory-tools** — partial repos; prompt loader gap
- **06-brain-skill-tools** — index repo gap
- **07-brain-constraint-tools** — list repo gap
- **08-brain-recipe-tools** — index repo gap (**08** G2)
- **09-brain-alarm-tools** — list pending gap
- **11-brain-sessions-lifecycle** — outcome read + open wiring (circular: 11 waits on 15, 15 can ship handler before 11)

---

## Blocks

- **11-brain-sessions-lifecycle** — `openSession` needs prompt string
- **20-brain-chat-runtime** — model system message
- **29-cooking-session** — shared context payload

---

## Ambiguous sources (implementation choices recorded in spec.md)

| Topic | Sources | Resolution |
|---|---|---|
| Block order | `00-overview` vs `16-agent-identity` + build-guide | Identity → constraints → personality → memory → skills → recipes → alarms → namespaces → previous session |
| Constraints filter | build-guide `confirmed` vs `06-constraints` non-rejected | Non-rejected |
| Personality limit | "top N" without N | `PERSONALITY_TRAIT_LIMIT` constant — **default 15 recommended; spec does not say** |
| Recipe index scope | build-guide sample omits; tool spec says every session | Every session kind |
| `load_session_context` vs builder | **16** tool vs **15** static injection | Both valid — builder for prefix cache; tool for richer first-turn hydration |
| Continuation Block 9 | Compressed parent has JSON in `outcome_summary` | Block 9 reads `completed` only; **13** supplies continuation tail |

---

## Obsolete ledgers

| Ledger | Note |
|---|---|
| `brain/05-session-lifecycle/0002.system-prompt-builder.md` | Scope still valid — keep; status open |
| `brain/03-tool-protocol/implementation/0003.constraint-tools.md` | Obsolete constraint model — do not use `listActiveUserConstraints` / `active` status |
| `brain/03-tool-protocol/implementation/0005.recipe-tools.md` | Wrong index shape (title+description) — use `id: title` |

---

## Draft inventory

See `draft/` — **14 gap snapshots** (handler, helpers, repos, constants, test).

---

## Sources read for this migration

Listed in `spec.md` § Sources plus `_features/README.md`.
