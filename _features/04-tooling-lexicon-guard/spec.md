# Tooling Lexicon Guard — Spec

Feature **04**. Mechanical enforcement that every identifier in Brioela TypeScript code uses approved vocabulary — split by ownership scope (`global`, `backend`, `product`, `tools`) — with grammar rules for functions, types, and banned padding words.

This is **not** the file-name guard (`tools/brioela-name-guard/` — feature TBD separately). Lexicon guard validates **identifier words inside files** (function names, types, variables). Name guard validates **file and folder names**.

---

## Purpose

Naming conventions in `build-guide/02-coding-standards/03-naming-conventions.md` ban vague words (`data`, `result`, `payload`, etc.) and require verb-first functions and domain-noun types. The lexicon guard turns those rules into a **TypeScript AST walk** that fails CI and local `verify` when code invents unknown vocabulary.

The guard also powers **nearest-word suggestions** in the reading gate (feature 05) via `loadLexicon()`.

---

## Commands (root `package.json`)

| Command | Behavior |
|---|---|
| `bun run check:lexicon` | One-shot scan; exit 1 on violations outside baseline |
| `bun run watch:lexicon` | Watch `backend/`, `shared/`, `mobile/`, `tools/` |
| `bun run lexicon:guard:baseline:update` | Rewrite baseline from current violations |
| `bun run lexicon:daemon:start` | macOS launchd daemon running watch mode |
| `bun run lexicon:daemon:stop` | Stop daemon |
| `bun run lexicon:daemon:status` | Health + PID |
| `bun run lexicon:logs` | Tail daemon logs |
| `bun run guard:start` | Starts name + type + lexicon daemons together |

---

## Scan scope

**Checked roots:** `backend/`, `shared/`, `mobile/`, `tools/`

**Extensions:** `.ts`, `.tsx`

**Ignored path parts:** `node_modules`, `dist`, `build`, `.wrangler`, `.expo`, `.turbo`, `coverage`, `Pods`, etc.

**Explicit ignored files:**

- `tools/brioela-lexicon-guard/lexicon.guard.baseline.json`
- `backend/worker-configuration.d.ts`
- `backend/src/agents/brain/_migrations/brain.migration.ts`

**Not scanned (gap vs name guard):** `build-guide/`, `implementable-specs/`, `brioela-specs/`, `_records/` — name guard covers docs; lexicon guard does not today.

---

## Lexicon vocabulary model

Each word is a `LexiconWord`:

```typescript
{
  word: string           // lowercase token after camelCase split
  kind: LexiconWordKind  // action | domain | grammar | platform | predicate | role
  scopes: string[]       // which code paths may use this word
  meaning: string        // human-readable definition
}
```

**Aggregate exports (stable public API for loader):**

- `globalLexicon` — assembled from `_lexicon/global/*.constant.ts` slices
- `backendLexicon` — `_lexicon/backend/*`
- `productLexicon` — `_lexicon/product/*`
- `toolsLexicon` — `_lexicon/tools/*`

**Growth rule (ledger):** Add focused owned slice files under `_lexicon/{global,backend,product,tools}/`. Do not swell aggregate files with new words directly.

---

## Scope resolution (`resolveLexiconScopes`)

Path-based scope tags determine which vocabulary applies:

| Path signal | Scopes added |
|---|---|
| always | `global` |
| `backend/` | `backend`, `product` |
| `shared/` | `shared`, `product` |
| `mobile/` | `mobile`, `product` |
| `tools/` | `tools` |
| `/agents/brain/` | `brain` |
| `/database/` | `database` |
| `brioela-brain-*` | `brain`, `product` |
| `brioela-lexicon-guard` | `lexicon` |
| `/_lexicon/backend/` | `backend` |
| `/_lexicon/product/` | `product` |
| `/_lexicon/tools/` | `tools` |

`loadLexicon(scopes)` unions all words whose `entry.scopes` intersects the resolved scope set.

---

## Policies

### `enforceIdentifierLexiconPolicy` (only policy today)

For each non-import identifier declaration in a source file:

1. **Split** camelCase / snake / kebab into lowercase words (`splitIdentifierWords`).
2. **Ban padding words:** `data`, `info`, `input`, `object`, `output`, `payload`, `request`, `response`, `result` → rule `ban-padding-word`.
3. **Unknown word:** word not in scoped lexicon → rule `enforce-identifier-lexicon`.
4. **Grammar:**
   - `function` / `method`: first word must be `action` or `predicate` kind.
   - `class` / `interface` / `type` / `enum`: must contain a `domain`, `role`, or `platform` word.
   - `variable` / `property` / `parameter`: cannot be only grammar words (`from`, `to`).

Violations include file path, line, column, message, and fix suggestion.

---

## Baseline

File: `tools/brioela-lexicon-guard/lexicon.guard.baseline.json`

Format: `{ version: 2, keys: string[] }` where each key is `rule::path::line::column::message`.

**Rule:** Existing baseline violations may remain until migrated. **New** violations fail immediately. Baseline should only shrink over time. Do not run `baseline:update` casually.

---

## Daemon (macOS launchd)

Optional dev daemon runs watch mode persistently:

- Plist under user LaunchAgents
- Uses `buildLaunchdPlist`, `repairLaunchdPlist`, `launchctl bootstrap/kickstart`
- Handlers: `start`, `stop`, `restart`, `status`, `print`, `tail` logs

Linux/CI uses one-shot `check:lexicon` only.

---

## Identifier collection

`collectIdentifierDeclarations` walks TS AST for: class, function, interface, type alias, enum, variable, parameter, property, method, binding elements. Skips import specifier identifiers.

---

## Integration with verify pipeline

`bun run verify` includes lexicon check alongside name and type guards (see root `package.json` and ledger entries).

Reading gate hardened loop uses lexicon vocabulary for edit-distance "did you mean" hints (feature 05 dependency on this loader).

---

## Gaps (feature NOT fully done — status stays `open`)

| ID | Gap | Source |
|---|---|---|
| G1 | No guard rule rejecting new words added directly in aggregate `*.lexicon.constant.ts` files | ledger Next #1 |
| G2 | No guard rule requiring new lexicon files live under ownership subfolders | ledger Next #2 |
| G3 | No automatic lexicon slice index generator | ledger Not Implemented |
| G4 | No `owner` metadata field on `LexiconWord` | ledger Not Implemented |
| G5 | No dedicated test suite for lexicon guard policies | — |
| G6 | Docs folders not in scan scope (unlike name guard) | compare `13-file-name-enforcement.md` |
| G7 | Product naming lexicon spec `brioela-specs/00b-naming-lexicon.md` referenced in README but file missing | `brioela-specs/README.md` |
| G8 | Artifact export-name ↔ file-stem enforcement lives partially in name guard + ledger 0008; not fully duplicated here | cross-tool |
| G9 | Baseline may still contain legacy violations; shrinking baseline is ongoing migration work | baseline policy |

---

## Acceptance (feature fully done when)

- [ ] All policies in spec implemented and covered by tests.
- [ ] G1–G2 enforcement rules shipped.
- [ ] G3–G4 either implemented or explicitly closed with reason in spec.
- [ ] `bun run check:lexicon` clean for all new code (baseline only grandfathered legacy).
- [ ] Vocabulary growth documented: slice → aggregate → scope wiring ritual documented in build.md.
- [ ] Daemon start/stop/status verified on macOS dev machines.

---

## Source documents

- `build-guide/02-coding-standards/03-naming-conventions.md` — vocabulary + grammar intent
- `build-guide/02-coding-standards/13-file-name-enforcement.md` — related name guard (separate tool)
- `_records/implementation-ledger/tooling/01-lexicon-guard/0001.granular-vocabulary.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0008.executable-artifact-naming.md` — `executable` word, `run` reserved
- `_records/implementation-ledger/tooling/02-reading-gate/0003.daemon-manifest-read.md` — reading gate lexicon slice
- `tools/brioela-lexicon-guard/` — all production code
