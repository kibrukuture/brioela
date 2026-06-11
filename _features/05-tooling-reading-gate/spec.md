# Tooling Reading Gate — Spec

Feature **05**. Root-owned proof-of-reading infrastructure plus a guard verdict loop that fails closed when the daemon is absent, tampered, or red.

**Related doctrine (not separate feature folder):** `build-guide/02-coding-standards/15-agent-loop-orchestration.md` describes orchestrator services (assignment dispatcher, merge executor, clean-room verifier, `loop:status`). That loop is **not implemented** — gaps tracked here as G15–G20 until a future feature or slice ships it.

---

## Purpose

Agents wrote ledger entries and code from training-data guesses instead of reading actual specs. Instructions decay; exit codes and OS privilege do not.

The reading gate provides:

1. **Root-recorded reads** — `gate:read` via unix socket; daemon performs OS read, appends TSV manifest, streams bytes back.
2. **Freshness** — 240-minute TTL + hash binding; stale reads do not count.
3. **Guard verdict board** — daemon runs name + type guards (partial — see G1), formats dynamic verdict, signs green receipts when clean + staged diff hash provided.
4. **Fail closed** — no daemon → BLOCKED; tamper file → HTTP 423 freeze.
5. **Live watch stream** — `gate:watch` replays daemon events.
6. **Self-defense** — tamper watch on `tools/brioela-*`, `GUARD-RED.md` at workspace root while red.

**Not yet the full v2 design:** Layer A/B attestation, Required Reading enforcement per ledger entry, clean-room merge fortress, orchestrator automation.

---

## Two territories (design law — partially enforced)

### Sovereign territory (agents forbidden)

`tools/`, `scripts/`, git hooks path, `/var/brioela-gate/` key/state. Changes require human sudo ritual.

**Gap G14:** OS locks on sovereign folders not fully applied per ledger 0002.

### Free territory

Application code, specs, ledgers — agents write freely; landing on `main` was designed to require daemon merge (not built — G18).

---

## Trust chain (what exists vs planned)

```text
sudo bun gate:up (human)
        │
        ▼
root daemon (run.gate.daemon.handler.ts)
        │
        ├── /read     → manifest.tsv (root-owned 700)
        ├── /status   → fresh/stale checklist
        ├── /verdict  → guard board + optional ed25519 receipt
        ├── /watch    → SSE-style stream to clients
        └── /check    → health ping

PLANNED (not built):
        ├── /attest   → Layer A + B challenges
        ├── gate:check → Required Reading + Touched Files vs diff
        ├── clean-room re-verify
        └── merge executor → main
```

---

## Root state paths (`/var/brioela-gate/`)

| Path | Mode | Role |
|---|---|---|
| `gate.sock` | 666 | Unix socket (any user may call; daemon is root) |
| `gate.pid` | — | Detached daemon PID |
| `manifest/manifest.tsv` | 700 dir | TSV read log — daemon-only writer |
| `keys/gate.key` | 600 | ed25519 private key |
| `gate.pub` | 644 | Public key (outside 700 keys dir — user-verifiable) |
| `heartbeat.txt` | — | Signed heartbeat, 30s TTL |
| `tamper.txt` | — | Tamper freeze until `gate:tamper:clear` |
| `logs/gate.*.log` | — | Events, receipts, stdout/stderr |

**Manifest TSV columns:** `readAtMs`, `hash`, `bytes`, `workspaceRoot`, `file` (tab-separated, no JSON.parse in tool).

**Freshness:** `readTtlMs = 240 * 60 * 1000`; entry stale if TTL expired OR file hash changed OR file missing.

---

## Socket routes

| Route | Method | Behavior |
|---|---|---|
| `/read?file=` | GET | Realpath workspace check; append manifest; return body + `x-gate-hash`, `x-gate-bytes`, `x-gate-file` |
| `/status` | GET | Per-file latest read: `fresh` or `stale` |
| `/verdict?hash=` | GET | Run guard board; if clean + hash → sign receipt; headers `x-gate-clean`, `x-gate-receipt`, `x-gate-signature` |
| `/watch` | GET | Subscribe to daemon watch stream |
| `/check` | GET | `ok` health |

---

## CLI commands (root `package.json`)

| Command | Handler | Requires root |
|---|---|---|
| `gate:up` | `up.gate.handler.ts` | yes |
| `gate:down` | `down.gate.handler.ts` | yes |
| `gate:read <file>` | `read.gate.handler.ts` | no (daemon must run) |
| `gate:status` | `status.gate.handler.ts` | no |
| `gate:verdict` | `verdict.gate.handler.ts` | no |
| `gate:verdict --receipt` | verifies signature + diff hash binding | no |
| `gate:verdict --hook` | exit 2 on block (harness hooks) | no |
| `gate:watch` | `watch.gate.handler.ts` | no |
| `gate:tamper:clear` | `delete.gate.tamper.handler.ts` | yes |
| `gate:hooks:install` | `mount.gate.hooks.handler.ts` | no |
| `gate:smoke` | `smoke.gate.handler.ts` | no (daemon must run) |

---

## Guard verdict board (Phase A — partial)

`runGuardBoard()` currently runs:

- `brioela-name-guard` check
- `brioela-type-guard` check

**Does NOT run** `brioela-lexicon-guard` (G1) despite ledger 0004 claiming "all three guards".

On workspace file change (8 roots via `@parcel/watcher`, 250ms debounce, missing-root retry 30s), daemon re-runs verdict sweep.

`formatBoardVerdict` includes delta attribution (+new, -fixed), trend line, nearest-word suggestions via `loadLexicon()` from feature 04.

While red: writes `GUARD-RED.md` at workspace root; deleted when green.

---

## Cryptography

- ed25519 keypair via `createGateKey()` on daemon start
- `signGateText` / `checkGateSignature` for receipts and heartbeat
- Green receipt format: `receipt {diffHash} {timestamp}` + signature header
- `createDiffHash` hashes staged git diff for `--receipt` binding

---

## Pre-commit wall (designed — currently unwired)

`githooks/pre-commit` should run `gate:verdict --receipt`. **Current file is a stub** that always `exit 0` (G2).

`gate:hooks:install` sets `core.hooksPath` to `tools/brioela-reading-gate/githooks` but the hook does not enforce.

Root `verify` script is stubbed: `echo 'verify: guards unwired...'` (G3).

---

## Attestation (design — not built)

Per `14-reading-gate.md`:

**Layer A:** Parse Drizzle columns, module exports, enum values — `_policies/attest.*.policy.ts` files.

**Layer B:** Random excerpt line challenges from Required Reading files.

**Handlers:** `attest.gate.handler.ts`, `check.gate.handler.ts` (reading-scope check), `rotate.key.gate.handler.ts` — **none exist**.

---

## Required Reading + ledger frontmatter (design — not built)

Ledger entries should carry:

```yaml
Required Reading:
  - path/to/spec.md
Touched Files:
  - path/to/file.ts
```

Daemon derives mandatory additions from diff shape. `gate:check` validates fresh reads + attestation + diff ⊆ Touched Files. **Not implemented** (G8–G10).

---

## Agent loop orchestration (design — not built)

Per `15-agent-loop-orchestration.md`:

- Assignment dispatcher, verification pipeline, merge executor, feedback router, stall detector
- `bun loop:status` board
- Human approve keystroke in dashboard

**None of this code exists** in `tools/brioela-reading-gate/` (G15–G20).

---

## Tamper defense

`watchTamperEvents` watches `guardWatchList` paths (`tools/brioela-*`, `tools/scripts`). Changes write `tamper.txt`; verdict returns 423 until human `sudo bun run gate:tamper:clear`.

---

## Daemon lifecycle

- `gate:up`: root check, mkdir state dirs, kill stale pid, detached `Bun.spawn` daemon, health poll `/check`
- Comments reference launchd; **no LaunchDaemon plist writer in current `up.gate.handler.ts`** (G4)
- Heartbeat every 5s; watch stream keepalive `\r`

---

## Tests

`bun test` in package — 8 test files, 14 tests per ledger 0004:

- signature round trip + forged rejection
- board diff attribution
- word distance / suggestions
- manifest parse round trip
- freshness
- heartbeat

**No integration test** for `/read` socket or full smoke (smoke is manual CLI against live daemon).

---

## Gaps (feature NOT fully done — status stays `open`)

| ID | Gap |
|---|---|
| G1 | `runGuardBoard` omits lexicon guard |
| G2 | `githooks/pre-commit` stub — always passes |
| G3 | Root `package.json` `verify` unwired |
| G4 | launchd KeepAlive plist not in `gate:up` (detached spawn only) |
| G5 | No `_policies/` attestation (Layer A/B) |
| G6 | No `gate:attest`, `gate:check` (reading), `gate:rotate-key` handlers |
| G7 | No Claude/Cursor PostToolUse hook wiring (ledger 0004 claimed; not in repo) |
| G8 | Required Reading frontmatter not enforced on ledger entries |
| G9 | No diff ⊆ Touched Files enforcement |
| G10 | No reading pass record bound to ledger entry (only generic diff hash receipt) |
| G11 | Sovereign territory OS locks not applied |
| G12 | Live human acceptance sequence (sudo gate:up → smoke) not verified in CI |
| G13 | `fs_usage` read audit trail optional — not implemented |
| G14 | Orchestrator doc 15 entirely unbuilt |
| G15 | Assignment dispatcher |
| G16 | Clean-room verifier |
| G17 | Merge executor |
| G18 | Feedback router + INBOX.md automation |
| G19 | Stall detector + `loop:status` |
| G20 | Human approve/reject dashboard keystrokes |

---

## Acceptance (feature fully done when)

- [ ] Slice 1 complete: read/manifest/freshness — **partial** (built, hooks unwired)
- [ ] Slice 2: Layer A attestation for Drizzle schemas
- [ ] Slice 3: ed25519 reading pass + `gate:check` + working pre-commit + `verify` wired
- [ ] Slice 4: Layer B excerpts + full dashboard per doc 14
- [ ] Slice 5: clean-room + merge executor + orchestrator (doc 15)
- [ ] G1–G3 closed minimum for "verdict loop trustworthy"
- [ ] `gate:smoke` ALL CLEAR on human-run daemon
- [ ] Tool-protocol ledger 0002–0007 rewritten through live gate (ledger Next)

---

## Source documents

- `build-guide/02-coding-standards/14-reading-gate.md`
- `build-guide/02-coding-standards/15-agent-loop-orchestration.md`
- `_records/implementation-ledger/tooling/02-reading-gate/0001.design.docs.md`
- `_records/implementation-ledger/tooling/02-reading-gate/0002.unforgeable-design.md`
- `_records/implementation-ledger/tooling/02-reading-gate/0003.daemon-manifest-read.md`
- `_records/implementation-ledger/tooling/02-reading-gate/0004.hardened-verdict-loop.md`
- `tools/brioela-reading-gate/`
- `tools/brioela-lexicon-guard/_helpers/load.lexicon.helper.ts` (verdict suggestions)
