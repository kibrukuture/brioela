# Status

partial

Cross-cutting patterns are **documented, partially enforced, and actively evolving**. Guards (name, type, lexicon) run today; reading gate is slice-1 only; `bun run verify` is a stub; production still carries Schnl-era drift documented in **01**. This feature is never `shipped` — it tracks living conventions.

# Shipped in repo (enforced today)

## Mechanical guards
- [x] Name guard — `tools/brioela-name-guard` + `check:names` / `watch:names` / launchd daemons
- [x] Type guard — 27 policies, `check:types` / `watch:types`, baseline workflow
- [x] Lexicon guard — product/backend vocabulary, `check:lexicon` / `watch:lexicon`
- [x] Combined orchestrator — `tools/brioela-guard` `guard:check` / `guard:watch`
- [x] React effect policy — `useIsomorphicLayoutEffect` only in hook files (`enforce.react.effect.policy.ts`); `rg useEffect mobile/` → zero matches
- [x] `any` ban policy — active (`ban.any.policy.ts`)
- [x] JSON parse cast ban — active; brain executables fixed per complaint 010
- [x] Drizzle surface policies — `enforce.database.drizzle.surface`, `ban.raw.database.access`

## Reading gate (slice 1)
- [x] `gate:up` / `gate:down` / `gate:read` / `gate:status` / `gate:watch` / `gate:smoke`
- [x] Root daemon + manifest append helpers (`tools/brioela-reading-gate/_helpers/`)
- [x] Sovereign lock scripts — `tools/scripts/lock.sh`, `unlock.sh`

## Documented + followed in new brain code
- [x] Split brain tool layout — `_tools/`, `_schemas/`, `_prompts/`, `_executables/` (exemplar: `write.user.memory.*`)
- [x] Repository-only Drizzle in brain executables
- [x] Centralized `createId()` — `shared/_ids/create.id.helper.ts`
- [x] Agent rules — `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`

## Feature doc standard
- [x] `_features/README.md` defines spec/build/status/draft shape
- [x] **01**, **02**, **03**, **04–54** migrated to `_features/` (this migration completes **00**)

# Open gaps (numbered)

## Documented but not fully enforced

| ID | Gap | Evidence |
|---|---|---|
| G-enf-1 | `exactOptionalPropertyTypes` required in guide root tsconfig but disabled in shipped root | `tsconfig.json` vs `02-typescript-strictness.md` lines 28–29 |
| G-enf-2 | Reading gate slices 2–4 not built — no `attest.gate.handler.ts`, no `check.gate.handler.ts`, no ed25519 pass records, no merge fortress | `glob tools/brioela-reading-gate/*attest*` → zero; `14-reading-gate.md` slice plan |
| G-enf-3 | `bun run verify` is stub — does not run guards or tests | `package.json` line 84: `echo 'verify: guards unwired...'` |
| G-enf-4 | Name guard scope omits `_features/` folder | `13-file-name-enforcement.md` scope list — no `_features/` |
| G-enf-5 | Branded `UserId` on Hono context — documented, not in platform shell | `01-platform-foundation` G4; `app/context.type.ts` |
| G-enf-6 | Shared root barrel `@brioela/shared` — documented, missing | `01-platform-foundation` G8; no `shared/index.ts` |
| G-enf-7 | Route prefix `/api/*` and product routers — documented, Schnl `/v1/*` mounted | `01-platform-foundation` G17, G19 |
| G-enf-8 | Package bans (`pg`, `ioredis`, `axios`, `dotenv`) — documented, present in tree | `01-platform-foundation` G12; root `dotenv` dep |
| G-enf-9 | `@hono/zod-validator` listed in guide — not in backend deps | `01-platform-foundation` G24 |
| G-enf-10 | Agent loop orchestrator — documented in `15-agent-loop-orchestration.md`, not implemented | No orchestrator services in repo |
| G-enf-11 | Ledger entries lack machine-readable `Required Reading` frontmatter | `implementation-ledger/tooling/02-reading-gate/0001` Not Implemented |
| G-enf-12 | CI wiring for `guard:check` on every PR — not verified in this audit | No `.github/workflows` reference found in pattern sweep |

## Enforced but under-documented in _features until this migration

| ID | Gap | Evidence |
|---|---|---|
| G-doc-1 | Type guard baseline suppresses known violations — process not in coding standards overview | `type:guard:baseline:update` workflow |
| G-doc-2 | Brain tests use `vitest` + CF pool, not `bun test` | `backend/package.json` `brain:test` script |
| G-doc-3 | `_executables/` plural folder vs guide `_executable/` singular | `brain-tool-protocol.md` vs production tree |

## Documented vs production conflicts (pattern-level)

| ID | Conflict | Resolution owner |
|---|---|---|
| G-conf-1 | `build-guide/00-rules.md` Rule 2: tools under `tools/{feature}/` | Superseded for Brain by `backend/src/agents/brain/_tools/` — update 00-rules or mark legacy |
| G-conf-2 | CLAUDE.md bans `pg`; backend uses `pg` Pool | **01** runtime target decision |
| G-conf-3 | Guide brain tool sample uses `(tool as any)` | Production uses typed `tool({ inputSchema })` — update guide sample |
| G-conf-4 | `brioela-reading-gate` not in root `workspaces` array | Works via `--cwd`; inconsistent with other tools |

# Process lessons (from _records — fixed vs open)

| Complaint | Status | Pattern |
|---|---|---|
| `003-scheduled-alarms-scheduled-for-mismatch` | FIXED | Read Drizzle schema before spec-driven column names |
| `001-nanoid-centralize` | FIXED | `createId()` single source |
| `010-json-parse-cast-guard` | FIXED | Zod parse not cast; check baselines |
| `002-brain-filenames-audit` | FIXED | No redundant `brain.` in filenames |
| Agent invented schema columns (gate origin) | OPEN prevention | G-enf-2 attest layer |
| Multiple schema/tool mismatches in `02-user-complaints/` | Mixed | Required Reading + fresh reads |

Draft snapshots: `draft/process-lesson.*.md`.

# Blocked by

None. Pattern work is independent of product feature shipping order.

# Blocks

Patterns do not block feature folders directly, but these gaps raise risk for all features:

- **G-enf-2** — agents can still implement from memory without attest until gate complete
- **G-enf-3** — no single verify command for CI/local
- **G-enf-5–G-enf-7** — **01** platform alignment gaps affect every HTTP feature
- **G-enf-8** — banned packages in legacy paths block clean `11-packages.md` compliance

Feature-level `blocked-by` references (typical):

- **01-platform-foundation** — shell drift
- **04-brain-foundation** — DO HTTP wiring, readiness gaps
- **19-brain-tool-registry** — partial tool matrix

# Sources

## Coding standards (primary)
- `build-guide/02-coding-standards/00-overview.md`
- `build-guide/02-coding-standards/01-monorepo-and-folder-structure.md`
- `build-guide/02-coding-standards/02-typescript-strictness.md`
- `build-guide/02-coding-standards/03-naming-conventions.md`
- `build-guide/02-coding-standards/04-imports-and-barrel-exports.md`
- `build-guide/02-coding-standards/05-backend-hono-patterns.md`
- `build-guide/02-coding-standards/06-backend-do-agent-patterns.md`
- `build-guide/02-coding-standards/07-data-layer-drizzle.md`
- `build-guide/02-coding-standards/08-shared-package-zod.md`
- `build-guide/02-coding-standards/09-mobile-patterns.md`
- `build-guide/02-coding-standards/10-error-handling.md`
- `build-guide/02-coding-standards/11-packages.md`
- `build-guide/02-coding-standards/12-testing-standards.md`
- `build-guide/02-coding-standards/13-file-name-enforcement.md`
- `build-guide/02-coding-standards/14-reading-gate.md`
- `build-guide/02-coding-standards/15-agent-loop-orchestration.md`

## Build guide + specs
- `build-guide/00-rules.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `brioela-specs/24-technical-architecture-backbone.md`

## Agent rules
- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc`
- `.cursor/rules/web-search-preapproved.mdc`

## Tooling
- `package.json` (root scripts + verify stub)
- `tsconfig.json`
- `tools/brioela-name-guard/`
- `tools/brioela-type-guard/_policies/`
- `tools/brioela-lexicon-guard/`
- `tools/brioela-guard/`
- `tools/brioela-reading-gate/`
- `tools/scripts/lock.sh`

## Records + complaints
- `_records/while-implementation-user-complaints/01-user-complaints/`
- `_records/while-implementation-user-complaints/02-user-complaints/`
- `_records/implementation-ledger/tooling/01-lexicon-guard/0001.granular-vocabulary.md`
- `_records/implementation-ledger/tooling/02-reading-gate/0001.design.docs.md`
- `_records/implementation-ledger/tooling/02-reading-gate/0002.unforgeable-design.md`
- `_records/implementation-ledger/tooling/02-reading-gate/0003.daemon-manifest-read.md`
- `_records/implementation-ledger/tooling/02-reading-gate/0004.hardened-verdict-loop.md`

## Production exemplars
- `backend/src/agents/brain/_tools/write.user.memory.tool.ts`
- `backend/src/agents/brain/_tools/_executables/write.user.memory.executable.ts`
- `backend/src/agents/brain/_tools/_schemas/write.user.memory.schema.ts`
- `backend/src/agents/brain/_repositories/`
- `shared/_ids/create.id.helper.ts`

## Related features
- `_features/README.md`
- `_features/01-platform-foundation/status.md`
- `_features/04-brain-foundation/status.md`
- `_features/05-brain-memory-tools/spec.md`
- `_features/19-brain-tool-registry/spec.md`

# Draft count

**34** files in `draft/` — agent rules, cursor rules, coding standards snapshots, brain tool exemplar, type/name guard policies, root tsconfig, package.json guard scripts, gap targets, process lessons.
