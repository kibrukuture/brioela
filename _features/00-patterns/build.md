# Cross-Cutting Patterns — Build

Feature **00**. How patterns are **enforced and adopted** — tooling locations, commands, guard policies, adoption checklist, and pointers to coding standards. Not implementation code.

---

## Enforcement stack (overview)

```text
Human / CI
    │
    ├── bun run check:names      → tools/brioela-name-guard
    ├── bun run type:guard       → tools/brioela-type-guard (27 policies)
    ├── bun run lexicon:guard    → tools/brioela-lexicon-guard
    ├── bun run guard:check      → tools/brioela-guard (orchestrator)
    │
    ├── bun run gate:read/status → tools/brioela-reading-gate (slice 1)
    ├── bun run verify           → STUB today (G-enf-3)
    │
    └── Editor / agent rules     → AGENTS.md, CLAUDE.md, .cursor/rules/
```

**Daemon mode** (local dev): `bun run guard:start` launches name + type + lexicon launchd daemons; `bun run guard:watch` aggregates live output.

**Sovereign territory** (`14-reading-gate.md`): `tools/`, gate state under `/var/brioela-gate/`, git hooks path — OS-locked via `tools/scripts/lock.sh`. Agents propose diffs; humans apply via unlock ritual.

---

## Root workspace scripts (`package.json`)

| Script cluster | Package | Role |
|---|---|---|
| `name:*`, `check:names`, `watch:names` | `tools/brioela-name-guard` | File/folder suffix + underscore-folder law |
| `type:*`, `check:types`, `watch:types` | `tools/brioela-type-guard` | TypeScript policy enforcement |
| `lexicon:*`, `check:lexicon`, `watch:lexicon` | `tools/brioela-lexicon-guard` | Product vocabulary + banned identifiers |
| `guard:*` | `tools/brioela-guard` | Combined check/watch/migrate baselines |
| `gate:*` | `tools/brioela-reading-gate` | Reading manifest daemon (partial) |
| `lock`, `unlock`, `lock:setup` | `tools/scripts/` | Sovereign territory immutability |
| `verify` | — | **Stub** — must wire guards (G-enf-3) |
| `migrate:baselines` | `tools/brioela-guard` | Baseline migration helper |

Workspaces array: `backend`, `shared`, `mobile`, three guard packages + `brioela-guard`. **`brioela-reading-gate` is not a workspace member** but is invoked via `--cwd`.

Draft snapshot: `draft/package.json.guard-scripts.md` (to be added).

---

## Name guard (`tools/brioela-name-guard/`)

| Entry | Role |
|---|---|
| `run.name.guard.helper.ts` | Walk workspace, apply policies |
| `watch.workspace.handler.ts` | Filesystem watch fail-fast |
| `name.guard.baseline.json` | Known legacy violations |

**Policies** (representative):

| Policy file | Enforces |
|---|---|
| `validate.underscore.folder.policy.ts` | Allowed `_handlers`, `_schemas`, … + `index.ts` |
| `validate.index.barrel.policy.ts` | Barrel export shape |
| `validate.test.pairing.policy.ts` | `{name}.test.ts` pairing |

**Commands**: `bun run check:names` (CI), `bun run watch:names` (dev).

**Scope**: per `13-file-name-enforcement.md` — includes `_features/` indirectly via `build-guide/` and `_records/` only; **`_features/` itself is not in name-guard scope today** (G-enf-4).

---

## Type guard (`tools/brioela-type-guard/`)

27 policies under `_policies/`. Key mappings to coding standards:

| Policy | Pattern |
|---|---|
| `ban.any.policy.ts` | No `any` (`02-typescript-strictness.md`) |
| `ban.type.assertion.policy.ts` | No `as T` assertions |
| `ban.json.parse.cast.policy.ts` | No `JSON.parse(x) as T` |
| `ban.non.null.assertion.policy.ts` | No `!` except DOM exceptions |
| `ban.native.date.policy.ts` | Use `dayjs` / `readCurrentEpochMs` helpers |
| `ban.drizzle.select.get.policy.ts` | No `.get()` on Drizzle selects |
| `ban.raw.database.access.policy.ts` | No raw DB access |
| `enforce.database.drizzle.surface.policy.ts` | Drizzle-only DB surface |
| `enforce.react.effect.policy.ts` | `useIsomorphicLayoutEffect` in hooks only |
| `enforce.import.direction.policy.ts` | Layer import direction |
| `enforce.mobile.network.boundary.policy.ts` | Fetch only in `mobile/network/` |
| `enforce.schema.pairing.policy.ts` | Schema file pairing |
| `ban.padded.identifier.policy.ts` | No `result`, `payload`, … identifiers |
| `enforce.contract.spine.policy.ts` | Shared contract import spine |

**Workflow**: violations fail `type:guard`; legacy suppressed in baseline until fixed — `bun run update:type-baseline` records intentional debt (use sparingly).

**Draft snapshots**: `draft/type-guard.*.policy.md`.

---

## Lexicon guard (`tools/brioela-lexicon-guard/`)

| Area | Path |
|---|---|
| Global vocabulary | `_lexicon/global/*.lexicon.constant.ts` |
| Backend vocabulary | `_lexicon/backend/*.lexicon.constant.ts` |
| Product/brain terms | `_lexicon/product/*.lexicon.constant.ts` |
| Identifier policy | `_policies/enforce.identifier.lexicon.policy.ts` |

Enforces consistent domain words (memory, sessions, skills, executable artifact naming) and bans ambiguous identifiers in new code.

**Commands**: `bun run check:lexicon`, `bun run watch:lexicon`.

---

## Reading gate (`tools/brioela-reading-gate/`)

**Built (slice 1)**:

| Handler | Role |
|---|---|
| `up.gate.handler.ts` | Root daemon bootstrap (`sudo bun gate:up`) |
| `down.gate.handler.ts` | Stop daemon |
| `run.gate.daemon.handler.ts` | Unix socket server |
| `read.gate.handler.ts` | Client: daemon reads file, hashes, appends manifest |
| `status.gate.handler.ts` | Fresh/stale checklist |
| `watch.gate.handler.ts` | Live event stream |
| `verdict.gate.handler.ts` | Verdict output |
| `smoke.gate.handler.ts` | Smoke tests |
| `mount.gate.hooks.handler.ts` | Hook installation helper |

**Not built** (per `14-reading-gate.md` + ledger `0001`):

- `attest.gate.handler.ts` + `_policies/attest.*`
- `check.gate.handler.ts` (pass record vs diff)
- ed25519 signing, clean-room merge executor, orchestrator services

**Draft**: `draft/coding-standards.14-reading-gate.md`, `draft/gap.reading-gate-attest.md`.

---

## Combined guard orchestrator (`tools/brioela-guard/`)

| File | Role |
|---|---|
| `watch.handler.ts` | Multiplexed guard dashboard |
| `check` entry | Run name + type + lexicon sequentially |

---

## Agent / editor rules (soft enforcement)

| File | Applies |
|---|---|
| `AGENTS.md` | All agents — concision, evidence, Bun, no subagents |
| `CLAUDE.md` | Claude/Cursor — Bun APIs, effect hooks, wild-dog bans, talk-before-code |
| `.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc` | TS/TSX/package.json globs |
| `.cursor/rules/web-search-preapproved.mdc` | alwaysApply — research pre-approved |

These are **not mechanically verified** except where duplicated in type guard (effects) or human review.

**Draft snapshots**: `draft/agents.md`, `draft/claude.md`, `draft/cursor.rule.*.md`.

---

## Coding standards reference map

| Standard file | Enforcement |
|---|---|
| `01-monorepo-and-folder-structure.md` | Name guard (partial scope) |
| `02-typescript-strictness.md` | Type guard + `tsc` |
| `03-naming-conventions.md` | Name + lexicon guards |
| `04-imports-and-barrel-exports.md` | Type guard import policies |
| `05-backend-hono-patterns.md` | Documented; limited mechanical enforcement |
| `06-backend-do-agent-patterns.md` | Lexicon + type guard DB policies |
| `07-data-layer-drizzle.md` | `enforce.database.drizzle.surface`, `ban.raw.database.access` |
| `08-shared-package-zod.md` | `enforce.contract.spine` |
| `09-mobile-patterns.md` | `enforce.react.effect`, network boundary |
| `10-error-handling.md` | Documented |
| `11-packages.md` | Manual review + dependency audit |
| `12-testing-standards.md` | CI should run `bun test` / `brain:test` |
| `13-file-name-enforcement.md` | Name guard |
| `14-reading-gate.md` | Reading gate (partial) |
| `15-agent-loop-orchestration.md` | Not implemented |

**Draft snapshots**: `draft/coding-standards.*.md`.

---

## Brain tool adoption checklist

When adding or changing a Brain tool (**05–18**, registered in **19**):

1. Read `build-guide/05-brain/02-tool-protocol.md` + table schema in `_schemas/`.
2. Create four files: `.tool.ts`, `_schemas/`, `_prompts/`, `_executables/`.
3. Add barrel exports to each `_schemas`, `_prompts`, `_executables` `index.ts`.
4. Implement Drizzle access only in `_repositories/` — call from executable.
5. Use `createId()` from `@brioela/shared/_ids` for new IDs.
6. Parse JSON with `jsonValueSchema` / Zod — never `as` cast.
7. Add collocated `.test.ts` (schema + executable behavior).
8. Register in `get.brain.tools.ts` + `TOOL_PERMISSIONS` (**19**).
9. Run `bun run check:names`, `type:guard`, `lexicon:guard`.
10. Pass reading gate when attest ships (future).

**Production exemplar drafts**: `draft/write.user.memory.*.production.md`.

---

## New feature / new file adoption checklist (general)

1. Confirm feature number and read `_features/{NN}/spec.md` + `status.md`.
2. Read applicable `build-guide/02-coding-standards/*.md` sections.
3. Place file in correct folder with correct **suffix** and **dot** naming.
4. Add `index.ts` barrel if inside underscore folder.
5. Import routes from `@brioela/shared` — no raw URLs.
6. Zod-validate at HTTP/tool boundary; branded IDs at trust boundary.
7. Run `bun run guard:check` before commit.
8. Add `draft/` snapshot when migrating a feature to `_features/` standard.

---

## Feature doc migration checklist (`_features/`)

Per `_features/README.md`:

1. Create `{NN}-{name}/` with `spec.md`, `build.md`, `status.md`, `draft/`.
2. `spec.md` — contract, intended vs shipped, gap table, relationships to other features.
3. `build.md` — file paths and scripts only.
4. `status.md` — honest `open`/`partial`/`shipped`, numbered gaps with evidence, sources list.
5. `draft/` — real production snapshots as `.md` wrappers.
6. Update `_features/README.md` migration status line.
7. **Do not delete** `build-guide/` or `implementable-specs/` source until approved.

---

## CI / verify target state

**Intended** (`13-file-name-enforcement.md`, `14-reading-gate.md`):

```bash
bun run verify
# should run: name:check + type:guard + lexicon:guard + bun test (+ gate:check when built)
```

**Shipped** (`package.json` line 84):

```bash
verify: echo 'verify: guards unwired (no gate daemon required)'
```

Gap target: `draft/gap.verify-script-stub.md`.

---

## File locations quick reference

| Pattern artifact | Location |
|---|---|
| Coding standards | `build-guide/02-coding-standards/` |
| Brain tool protocol | `build-guide/05-brain/02-tool-protocol.md` |
| Agent instructions | `AGENTS.md`, `CLAUDE.md` |
| Cursor rules | `.cursor/rules/` |
| Name guard | `tools/brioela-name-guard/` |
| Type guard | `tools/brioela-type-guard/_policies/` |
| Lexicon guard | `tools/brioela-lexicon-guard/` |
| Reading gate | `tools/brioela-reading-gate/` |
| Guard orchestrator | `tools/brioela-guard/` |
| Lock scripts | `tools/scripts/lock.sh`, `unlock.sh` |
| Process complaints | `_records/while-implementation-user-complaints/` |
| Implementation ledger | `_records/implementation-ledger/` |
| Feature migrations | `_features/{00–54}/` |
| Brain tool exemplar | `backend/src/agents/brain/_tools/write.user.memory.tool.ts` |
| ID helper | `shared/_ids/create.id.helper.ts` |
| Root TS config | `tsconfig.json` |

---

## Acceptance (enforcement build done when)

- [x] Name, type, lexicon guards runnable from root scripts.
- [x] Type guard covers core TS, React effect, Drizzle, JSON cast policies.
- [x] Reading gate slice 1 (read manifest daemon) exists.
- [ ] `verify` runs all guards — G-enf-3.
- [ ] Reading gate attest + check + signed passes — G-enf-2.
- [ ] Name guard includes `_features/` if feature docs must follow suffix law — G-enf-4.
- [ ] CI runs `guard:check` on every PR — not verified in this audit.

---

## Sources

- `package.json` (root scripts)
- `build-guide/02-coding-standards/13-file-name-enforcement.md`
- `build-guide/02-coding-standards/14-reading-gate.md`
- `build-guide/02-coding-standards/15-agent-loop-orchestration.md`
- `tools/brioela-name-guard/`, `tools/brioela-type-guard/`, `tools/brioela-lexicon-guard/`, `tools/brioela-guard/`, `tools/brioela-reading-gate/`
- `_records/implementation-ledger/tooling/02-reading-gate/0001.design.docs.md`
- `_features/00-patterns/spec.md`
