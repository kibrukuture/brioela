# Tooling Lexicon Guard — Build

Feature **04**. All production code lives in `tools/brioela-lexicon-guard/`.

---

## Package layout

```text
tools/brioela-lexicon-guard/
  run.brioela.lexicon.guard.handler.ts    ← CLI entry (check | watch | baseline)
  start|stop|restart|status|print|tail.*.handler.ts  ← launchd daemon
  package.json
  tsconfig.json
  lexicon.guard.baseline.json
  _helpers/          ← walk, baseline, scope, split, report, launchd
  _policies/         ← enforce.identifier.lexicon.policy.ts
  _types/            ← LexiconWord, LexiconViolation, errors
  _watch/            ← filesystem watch wrapper
  _lexicon/          ← vocabulary slices + aggregates
    global/          ← 13 slice files + index
    backend/         ← 3 slices + index
    product/         ← 9 slices + index
    tools/           ← 2 slices + index
    *.lexicon.constant.ts  ← stable aggregates
```

**Total production files:** 74 (see `draft/` mirror — one `.md` per file).

---

## Core runtime files

| File | Role |
|---|---|
| `run.brioela.lexicon.guard.handler.ts` | Parse argv; check / watch / update-baseline |
| `_helpers/run.lexicon.guard.helper.ts` | Walk files → parse TS → run policies → baseline filter |
| `_helpers/walk.typescript.files.helper.ts` | Recursive file discovery |
| `_helpers/load.lexicon.helper.ts` | Merge scoped vocabulary |
| `_helpers/resolve.lexicon.scope.helper.ts` | Path → scope tags |
| `_helpers/collect.identifier.declarations.helper.ts` | AST identifier harvest |
| `_helpers/split.identifier.words.helper.ts` | camelCase → words |
| `_helpers/create.violation.helper.ts` | Build violation + source location |
| `_helpers/report.lexicon.violation.helper.ts` | CLI formatting |
| `_helpers/baseline.helper.ts` | Load / write / filter baseline v2 |
| `_helpers/lexicon.guard.config.helper.ts` | Roots, ignores, extensions |
| `_policies/enforce.identifier.lexicon.policy.ts` | Main policy |
| `_watch/watch.workspace.lexicon.handler.ts` | Debounced watch loop |

---

## Daemon files

| File | Role |
|---|---|
| `_helpers/build.launchd.plist.helper.ts` | Generate plist XML |
| `_helpers/repair.launchd.plist.helper.ts` | xattr + plutil lint |
| `_helpers/launchd.config.helper.ts` | Paths, label, log dirs |
| `_helpers/run.launchctl.helper.ts` | launchctl wrappers |
| `start.lexicon.guard.daemon.handler.ts` | Bootstrap / kickstart |
| `stop.lexicon.guard.daemon.handler.ts` | Hard stop |
| `restart.lexicon.guard.daemon.handler.ts` | Stop + start |
| `status.lexicon.guard.daemon.handler.ts` | Health |
| `print.lexicon.guard.daemon.handler.ts` | Debug dump |
| `tail.lexicon.guard.logs.handler.ts` | Log tail |

---

## Vocabulary slices (ownership folders)

### `global/` (13 files)

`actions`, `core`, `filesystem`, `grammar`, `guard`, `origin`, `platform`, `predicate`, `role`, `runtime`, `status`, `storage`, `time`

### `backend/` (3 files)

`cloudflare`, `database`, `executable`

### `product/` (9 files)

`brain`, `constraints`, `food`, `json`, `memory`, `migration`, `sessions`, `skills`

### `tools/` (2 files)

`daemon`, `reading.gate`

Each slice exports `*Lexicon: LexiconWord[]`. Folder `index.ts` re-exports slices. Aggregate `global.lexicon.constant.ts` (etc.) spreads slices into stable arrays consumed by `loadLexicon`.

---

## Wiring new vocabulary (human ritual)

When adding a word for a new domain:

1. Add word to the correct **slice** under `_lexicon/{scope}/`.
2. Export slice from that folder's `index.ts` if new file.
3. Ensure aggregate `*.lexicon.constant.ts` spreads the slice (may require human unlock if aggregates are locked).
4. Run `bun run check:lexicon`.
5. Never add words inline in aggregate files once G1 ships.

---

## Verification

```bash
bun run check:lexicon
bun run check:types    # includes tools/brioela-lexicon-guard typecheck via workspace
bun run guard:check    # name + type + lexicon combined
cd tools/brioela-lexicon-guard && bun run typecheck
```

---

## Draft folder

`draft/` contains one markdown file per production file under `tools/brioela-lexicon-guard/`, with a fenced TypeScript/JSON snapshot of current contents. Path mirror:

```text
draft/run.brioela.lexicon.guard.handler.md
draft/_helpers/baseline.helper.md
draft/_lexicon/global/actions.lexicon.constant.md
...
```

---

## Remaining build work (keeps feature `open`)

1. **G1** — Policy: fail if new `LexiconWord` literals appear in aggregate constant files.
2. **G2** — Policy: fail if new lexicon `.constant.ts` files exist outside `_lexicon/{global,backend,product,tools}/`.
3. **G5** — Add `enforce.identifier.lexicon.policy.test.ts` with fixture files.
4. **G3/G4** — Index generator and owner metadata (optional; close explicitly if deferred).

Do not mark `shipped` until G1, G2, G5 are done and baseline shrink plan is documented.
