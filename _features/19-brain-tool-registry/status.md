# Status

open

Registry shell shipped (`getBrainTools`, `sessionKindSchema`, partial `TOOL_PERMISSIONS`, 8-tool `all` map). **Not fully done** — permission matrix drifts from build-guide + tool specs; 10 of 18 public tools missing from registry; maintenance kinds wrong; alarm/web gates have no live caller (**20**).

# Shipped in backend (partial)

- [x] `get.brain.tools.ts` — enum, matrix, filter, 8 tools
- [x] Memory trio registered (**05**)
- [x] Recipe trio registered (**08**) — permissions wrong
- [x] Alarm duo registered (**09**) — wake-gated
- [x] `_tools/index.ts` — partial barrel (memory + recipe + registry)
- [x] Split-layout convention + ledger **0008** naming law
- [ ] Full 18-tool `all` map
- [ ] Canonical `TOOL_PERMISSIONS` (zero drift)
- [ ] `search_web` env/counter signature extension
- [ ] `product_scan` SessionKind (**24**)
- [ ] Registry matrix test
- [ ] Alarm tools in barrel export

# Open gaps (hunt list)

| ID | Gap | Evidence / owner |
|---|---|---|
| G1 | Recipe permission drift — `chat` view-only; `brain_maintenance` has update+archive | **08** G1; `get.brain.tools.ts:37-44`, `:39-44`; `recipe.tool.test.ts:125` |
| G2 | Skill tools (5) not in map or matrix | **06** G7; no `*skill*.tool.ts` |
| G3 | Constraint tools (2) not in map or matrix | **07** G4; no `*constraint*.tool.ts` |
| G4 | Session tools (2) not in map or matrix | **16** G5; `load_session_context` / `search_session_history` missing |
| G5 | `search_web` not in map or matrix | **18** G4; zero `search.web*` files |
| G6 | `brain_maintenance` public row grants `write_user_memory` + recipe writes — violates spec **15** | `get.brain.tools.ts:39-44`; **12** G2/G3 |
| G7 | `behavior_pattern_detection` public row is stub — sub-agents should use RPC | **12** draft; spec **15** |
| G8 | Alarm tools omitted at runtime — no caller passes `wake` | **09** G2, **14** G3; only tests pass `wake` |
| G9 | `load_session_context` on `alarm` not in production matrix | **16** G20 — canonical adds alarm |
| G10 | `_tools/index.ts` missing alarm tool exports | `index.ts` lines 1-7 |
| G11 | `write_user_memory` on `alarm` — build-guide omits, production includes | `02-tool-protocol.md:110` vs production `:35-38` |
| G12 | No dedicated registry matrix test | Only partial coverage in `recipe.tool.test.ts`, `alarm.tool.test.ts` |
| G13 | `product_scan` SessionKind deferred | Spec **18** permission reserved; enum lacks kind (**24**) |
| G14 | `compressor` SessionKind not in enum | **12** G14, **17** docs |
| G15 | DB `session_type` ↔ `SessionKind` mapper missing | **11** G14 — not registry code but blocks **20** |
| G16 | `getBrainTools` signature missing `env` + `sessionWebSearchCounter` | **18** draft; needed before web ship |
| G17 | Ledger **0005** body wrong maintenance recipe grant | Obsolete — do not implement from ledger |
| G18 | Ledgers **0006**, **0007** wrong kinds/providers | Obsolete — prefer specs **16**/**17**/**18** |

# Blocked by

- **05**–**09**, **16**, **18** — tool implementations must exist before registry entries
- **12** — clarifies maintenance RPC vs public registry (parallel, not blocking enum)
- **14** — `AlarmWakeCallbacks` on Brain DO for wake gate to matter

# Blocks

- **20-brain-chat-runtime** — needs complete matrix + injection args
- **06**, **07**, **16**, **18** — each needs registry row on ship
- **24-scanner** — `product_scan` enum extension

# Cross-feature conflicts (registry view)

| Conflict | Features | Resolution for **19** |
|---|---|---|
| Recipe chat vs maintenance | **08**, **15** | Chat gets update+archive; maintenance none |
| Maintenance `getBrainTools` vs RPC | **12**, **15** | Public maintenance kinds empty; RPC owns writes |
| Session load on alarm | **16**, build-guide | Add load to alarm; no search |
| Web provider + kinds | **18**, ledger **0007** | Tavily+Exa; chat+cooking (+ product_scan later) |
| Confirm constraint cooking | **07** | Chat only for confirm; cooking propose only |
| FTS table for tool 17 | **16**, build-guide | `sessions_fts` per spec **17** |

# Obsolete ledgers

| Ledger | Why obsolete |
|---|---|
| `0005.recipe-tools.md` (body) | Wrong `brain_maintenance` recipe permissions |
| `0006.session-tools.md` | `general` kind, wrong FTS target, wrong cooking/maintenance matrix |
| `0007.web-tool.md` | Brave-only, `general` kind, denies cooking |

Still useful: **0001** (memory registry origin), **0008** (executable naming).

# Sources

- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/07-agent-framework-hardening.md`
- `implementable-specs/brioela-tools/00-index.md` + `01`–`18`
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `implementable-specs/00-overview.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0001`–`0008`
- `_features/05`–`18` `status.md` + permission gap drafts
- `backend/src/agents/brain/_tools/get.brain.tools.ts`
- `backend/src/agents/brain/_tools/index.ts`

# Draft count

**5** files in `draft/` — production snapshots + intended full registry + master permissions gap + per-domain gap index.
