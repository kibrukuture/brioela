# Tooling Reading Gate — Build

Feature **05**. All production code in `tools/brioela-reading-gate/`.

---

## Package layout

```text
tools/brioela-reading-gate/
  package.json
  tsconfig.json
  index.ts
  run.gate.daemon.handler.ts       ← root daemon process
  up.gate.handler.ts               ← sudo gate:up
  down.gate.handler.ts
  read.gate.handler.ts
  status.gate.handler.ts
  verdict.gate.handler.ts
  watch.gate.handler.ts
  smoke.gate.handler.ts
  delete.gate.tamper.handler.ts
  mount.gate.hooks.handler.ts
  gate.state.store.ts              ← in-memory board + watch subscribers
  githooks/pre-commit              ← STUB (G2)
  _helpers/                        ← 37 helper files + 8 tests
  _types/                          ← 4 type files
  (no _policies/ yet — G5)
  (no _watch/ folder — watch lives in _helpers)
```

**Production file count:** 58 (57 TS/JSON + `githooks/pre-commit`).

---

## Entry handlers

| File | CLI |
|---|---|
| `up.gate.handler.ts` | `gate:up` |
| `down.gate.handler.ts` | `gate:down` |
| `run.gate.daemon.handler.ts` | spawned by up (not direct CLI) |
| `read.gate.handler.ts` | `gate:read` |
| `status.gate.handler.ts` | `gate:status` |
| `verdict.gate.handler.ts` | `gate:verdict` |
| `watch.gate.handler.ts` | `gate:watch` |
| `smoke.gate.handler.ts` | `gate:smoke` |
| `delete.gate.tamper.handler.ts` | `gate:tamper:clear` |
| `mount.gate.hooks.handler.ts` | `gate:hooks:install` |

**Not built (doc 14):** `attest.gate.handler.ts`, `check.gate.handler.ts`, `rotate.key.gate.handler.ts`

---

## Core helpers (by concern)

### Config + workspace

- `gate.config.helper.ts` — paths, TTLs, watch list
- `workspace.root.helper.ts` — `BRIOELA_WORKSPACE_ROOT`

### Manifest + read proof

- `append.read.entry.helper.ts` — sole manifest writer
- `read.manifest.entries.helper.ts`
- `parse.manifest.entry.helper.ts`
- `format.manifest.entry.helper.ts`
- `is.fresh.entry.helper.ts`
- `create.content.hash.helper.ts`
- `read.current.epoch.ms.helper.ts` — dayjs clock

### Socket routes

- `serve.gate.socket.helper.ts` — Bun.serve unix router
- `serve.read.route.helper.ts`
- `serve.status.route.helper.ts`
- `serve.verdict.route.helper.ts`
- `serve.watch.route.helper.ts`

### Verdict board

- `run.guard.board.helper.ts` — name + type only (G1: add lexicon)
- `create.board.diff.helper.ts`
- `format.board.verdict.helper.ts`
- `create.word.suggestions.helper.ts`
- `write.red.flag.helper.ts` — GUARD-RED.md

### Signing + heartbeat

- `create.gate.key.helper.ts`
- `sign.gate.text.helper.ts`
- `check.gate.signature.helper.ts`
- `check.gate.heartbeat.helper.ts`
- `write.gate.heartbeat.helper.ts`
- `create.diff.hash.helper.ts`

### Watchers

- `watch.workspace.events.helper.ts` — @parcel/watcher on 8 roots
- `watch.tamper.events.helper.ts`
- `watch.gate.stream.helper.ts`
- `append.gate.event.helper.ts`

---

## Types

- `read.manifest.entry.type.ts`
- `gate.board.type.ts`
- `board.violation.type.ts`
- `board.diff.type.ts`

---

## External dependencies

- `dayjs` — time (native Date banned in this tool)
- `@parcel/watcher` — filesystem events
- `../../brioela-name-guard/_helpers/run.name.guard.helper`
- `../../brioela-type-guard/_helpers/run.type.guard.helper`
- `../../brioela-lexicon-guard/_helpers/load.lexicon.helper` (suggestions only)

---

## Root package.json wiring

```json
"gate:up", "gate:down", "gate:read", "gate:status", "gate:verdict",
"gate:watch", "gate:tamper:clear", "gate:hooks:install", "gate:smoke"
```

**Unwired:**

```json
"verify": "echo 'verify: guards unwired (no gate daemon required)'"
```

Target when G3 closed: `verify` runs `gate:verdict --receipt` + guard checks.

---

## Verification

```bash
cd tools/brioela-reading-gate && bun test          # 14 tests (unit)
cd tools/brioela-reading-gate && bun run typecheck
sudo bun run gate:up                               # human — root daemon
bun run gate:hooks:install
bun run gate:smoke                                 # requires running daemon
bun run gate:read implementable-specs/00-overview.md
bun run gate:status
bun run gate:verdict
bun run gate:watch
sudo bun run gate:down
```

---

## Draft folder

`draft/` — one `.md` per production file (58 files), fenced snapshot of current contents.

---

## Remaining build work (keeps feature `open`)

1. **G1** — Add `runLexiconGuard` to `runGuardBoard`.
2. **G2** — Replace `githooks/pre-commit` stub with `gate:verdict --receipt`.
3. **G3** — Wire root `verify` to real guard + verdict pipeline.
4. **G5–G6** — `_policies/` + attest/check/rotate handlers.
5. **G4** — launchd plist + KeepAlive in `gate:up`.
6. **G8–G10** — Required Reading + Touched Files enforcement.
7. **G15–G20** — Orchestrator services (doc 15) — may become separate numbered feature later; tracked here until split.

Do not mark `shipped` until at minimum G1–G3 + G5 Layer A + working pre-commit wall.
