# Status

open

**Nothing shipped.** `identity-prompt.ts` does not exist. No `BrioelaIdentity` export in `backend/`. Ledger `brain/04-agent-identity/0001` remains open. Feature is not done per full spec.

# Shipped in backend (none)

- [ ] `identity-prompt.ts` with `BrioelaIdentity` constant
- [ ] Token budget ≤ 800 verified
- [ ] Canonical text matches `16-agent-identity.md` (or approved trim)
- [ ] Import path ready for **15** system prompt builder
- [ ] Mira runtimes consume canonical constant (not inline stubs)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | `identity-prompt.ts` missing | No file under `backend/src/agents/brain/`; ledger `0001.identity-prompt.md` Status `[ ] Open` |
| G2 | No `BrioelaIdentity` in codebase | `rg BrioelaIdentity backend/` — zero matches |
| G3 | `build.system.prompt.handler.ts` missing — cannot consume Block 1 | Ledger `05-session-lifecycle/0002` open; no `_handlers/` in brain package |
| G4 | `BrioelaBrain` has no session/chat path — identity not injectable live | `brioela.brain.agent.ts` — memory RPC only; **20** open |
| G5 | Mira cooking spec uses inline identity stub, not shared constant | `03-gemini-session.md` `buildSystemInstruction` — 3-line stub vs full `BrioelaIdentity` |
| G6 | Brioela vs Mira naming unresolved in identity text | Identity says `You are Brioela`; `30-mira/00-overview` — user-facing live name is Mira |
| G7 | Canonical document may exceed 800-token cap | Spec body ~3,545 chars ≈ 886 tokens at 4 chars/token; cap is hard in spec |
| G8 | No token verification test or CI gate | Ledger verification requires ≤ 800; no test file |
| G9 | `00-overview.md` block order differs from `16-agent-identity` | Overview: skills before personality/memory; 16 + build-guide: personality → memory → skills |
| G10 | `13-gaps-and-missing-specs.md` item 1 still reads "no equivalent" in historical CRITICAL section | Status CLOSED → `16-agent-identity.md` but prose still describes pre-spec gap |
| G11 | Inventory marks spec done but production not started | `_records/inventory/inventory.md` `[x] 16-agent-identity.md` vs open ledger |

# 10 vs 15 boundary

| In **10** (this feature) | In **15** (separate) |
|---|---|
| `BrioelaIdentity` content + export | `buildSystemPrompt(db, sessionKind, userId)` |
| 800-token cap for identity block | SQLite queries for constraints, personality, memory, skills |
| `identity-prompt.ts` | `formatConstraints`, `formatPersonality`, `formatMemory`, `formatSkillsIndex` |
| Developer-only update rules | `getRelevantNamespaces(sessionKind)` |
| Canonical voice/values/boundaries text | Block joiner + prefix-cache static ordering |
| Mira import contract (consumer) | `load_session_context` / pending alarms block (if added) |

# Blocked by

- 04-brain-foundation (Brain package path — shipped)

# Blocks

- 15-brain-system-prompt (Block 1 import)
- 11-brain-sessions-lifecycle (`openSession` → builder)
- 20-brain-chat-runtime (live chat system prompt)
- 29-cooking-session (Mira system instruction prefix)
- 30-mira-speech-engine (speech policy layers on identity)

# Obsolete ledger entries

| Ledger | Issue |
|---|---|
| `brain/04-agent-identity/0001.identity-prompt.md` | Still correctly **open** — not obsolete; production missing |
| `13-gaps-and-missing-specs.md` §1 | Historical "no equivalent" prose — superseded by `16-agent-identity.md`; item marked CLOSED |

# Ambiguous / conflicting sources

1. **Token cap vs canonical text:** `16-agent-identity.md` mandates 800 tokens and ships ~886-token body at 4 chars/token estimate. **Must trim or revise cap before ship** — do not ignore.
2. **System prompt block order:** `implementable-specs/00-overview.md` orders skills before personality/memory. **`16-agent-identity.md` + `03-session-lifecycle.md`** order personality → memory → skills. **Prefer 16 + build-guide for 15 implementation.**
3. **Mira inline identity vs BrioelaIdentity:** `03-gemini-session.md` cooking companion stub conflicts with single canonical constant. **Prefer import `BrioelaIdentity` + scene suffix.**
4. **Brioela vs Mira naming:** Identity document names agent Brioela; Mira is live presence name. **10 owns Brioela text; product voice naming is cross-feature.**
5. **Build-guide pseudocode drift:** `03-session-lifecycle.md` uses `userPersonality.status` — shipped schema uses `isActive` boolean (`user.personality.schema.ts`). **15 gap, not 10.**

# Sources

- `implementable-specs/16-agent-identity.md`
- `implementable-specs/13-gaps-and-missing-specs.md`
- `implementable-specs/00-overview.md`
- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/cooking-session/03-gemini-session.md`
- `build-guide/05-brain/06-agent-identity.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/30-mira/00-overview.md`
- `_records/implementation-ledger/brain/04-agent-identity/0001.identity-prompt.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0002.system-prompt-builder.md`
- `_records/implementation-ledger/0000-ledger-index.md`

# Draft count

**1** file in `draft/` — `identity-prompt.gap.md` (target file does not exist; full intended snapshot).
