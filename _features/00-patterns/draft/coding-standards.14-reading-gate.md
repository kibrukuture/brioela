# Draft: build-guide/02-coding-standards/14-reading-gate.md

Target: `build-guide/02-coding-standards/14-reading-gate.md`

```
# 14 — Reading Gate

## Doctrine

No change lands in this repository unless the agent that produced it has mechanically proven that it read, fresh and in full, every source document the change depends on. Not promised. Not remembered. **Proven — by OS privilege and cryptography, never by the agent's own word.**

Every record the gate relies on is produced and stored by a process the agent's user account cannot write to, cannot impersonate, and cannot forge. The agent's honesty is never an input to the system.

## Why this exists

Agents write code and ledger entries from training-data guesses instead of reading the actual schemas and specs. This produced six implementation ledger entries with invented table columns, invented APIs, and invented providers. Instruction files ("always read first") do not prevent this: instructions decay out of context, and every agent eventually compacts and forgets them. The only things an agent can never ignore, fake, or forget are a failed command in its own tool output, an `EACCES` from the operating system, and a signature it cannot mint.

## The two territories

The repository is divided into exactly two zones with opposite rules:

### Sovereign territory — locked, agent-forbidden

The machinery of enforcement itself. Agents have **zero** write access here, ever, enforced by the OS (`chflags` immutability + root ownership), not by convention:

- `tools/` — all guard code, gate code, daemon code, orchestrator code
- `scripts/` — any repo automation invoked by the daemon or CI
- the git hooks path used by the repository
- the daemon's key material and state: root-owned, mode 700, **outside the repo** (`/var/brioela-gate/`)
- `package.json` script entries that wire the guards (the file hosts them; changes to it pass through the human ritual below)

Rationale: an agent that can edit the gate can disarm the gate. Yesterday's lesson — an agent rewrote a "protective" script minutes after agreeing not to — is generalized into law: **agents have no job in the script/CLI/guard area. None.** This is legitimate under the lock doctrine because sovereign territory is exactly the rarely-touched, permanent zone that locks were always reserved for.

Changes to sovereign territory follow the human ritual (the 0.1%): agent proposes a change as a plain-text diff in free territory → human reads it → human unlocks with sudo + password, applies, relocks. The agent never holds the key for any duration.

### Free territory — full agent power, zero locks

Everything else: all application code, specs, build guides, ledger entries, tests. Agents read and write at will, no locks, no friction, full speed. Power is unrestricted here because nothing here is trusted — nothing lands without passing the wall below.

## The trust chain

Every link is OS privilege or cryptography. No link is "the agent says so."

```text
human runs ONE command with sudo password
        │
        ▼
root daemon (brioela-gate) — the only process holding the signing key
        │
        ├── serves all reads (reader-of-record) ──▶ manifest in root-owned storage (agent gets EACCES)
        ├── issues randomized challenges, validates attestations
        ├── signs pass records (ed25519, private key root-only 0600)
        ├── clean-room verifier: re-runs guards + tests itself, in its own checkout
        └── merge executor: merges ONLY signature-valid, clean-room-green, human-approved branches
```

An agent cannot write the manifest (OS denies it). Cannot sign a pass (no key). Cannot fake green tests (the daemon re-runs them in territory the agent can't touch). Cannot merge (only the daemon merges). The agent can lie all day inside its worktree; lies produce no signature, and unsigned work never lands.

## One command, then hands off

```bash
sudo bun gate:up
```

This is the only command the human runs to operate the system. It:

1. starts the root daemon (generating the ed25519 keypair on first run — public key committed to the repo so anything can verify; private key never leaves root-owned storage),
2. starts the orchestrator services (`15-agent-loop-orchestration.md`): merge-watcher, assignment board, feedback router, stall detector,
3. verifies sovereign-territory locks are intact (any tampering since last session is reported loudly before anything else runs),
4. opens the live dashboard stream.

From that point everything is event-driven and automated. The human's remaining touchpoints are exactly two, both inside the dashboard: **approve a verified branch** (one keystroke — the daemon then merges and the loop continues) and the rare sovereign-territory ritual. Nothing else requires a human hand.

```bash
bun gate:watch     # attach the live dashboard from any terminal
bun gate:status    # one-shot: current checklist, board state, lock integrity
sudo bun gate:down # stop everything (sudo required — agents cannot kill the daemon)
```

## The four mechanical objects

### 1. Required Reading declaration

Every implementation ledger entry carries machine-readable frontmatter:

```yaml
Required Reading:
  - implementable-specs/06-constraints.md
  - backend/src/agents/brain/_schemas/constraint.schema.ts
  - backend/src/agents/brain/_repositories/write.user.memory.repository.ts
Touched Files:
  - backend/src/agents/brain/_tools/propose.user.constraint.tool.ts
```

`Required Reading` is the passage list. `Touched Files` is the only territory the diff may occupy. A ledger entry without both lists cannot be activated.

The daemon derives mandatory additions automatically: a diff that touches a Drizzle table requires that table's schema file and spec; a diff that imports a module requires that module's public surface. Declared lists can only add to the derived floor, never shrink it.

### 2. Reading manifest — written only by root

```bash
bun gate:read <file>
```

This sends a request over the daemon's unix socket. **The daemon** — not the agent — opens the file (so the operating system's read genuinely occurs, performed by root, with the syscall optionally audited via `fs_usage`), computes the hash, appends `{ file, sha256, bytes, readAt, worktree }` to the manifest in root-owned storage, and streams the content back through the agent's terminal so the bytes flow into its context. The agent cannot append, edit, or delete manifest entries: the OS returns `EACCES`. There is no self-reported reading anywhere in the system.

**Freshness**: a manifest entry expires after the freshness window (default 240 minutes) or the moment the file's hash changes on disk — whichever comes first. Stale reads count as unread.

### 3. Attestation — proof the content is in context (MANDATORY)

`gate:attest` runs two layers of deterministic challenge, both mandatory, both issued and judged by the daemon:

**Layer A — semantic attestation (parseable ground truth).** The daemon parses the real source and diffs the agent's answers byte-for-byte:

- **Drizzle schemas**: exact column list of every table the diff touches. One invented column, one missing column → fail, exact diff streamed back.
- **Module surfaces**: the export names the diff consumes, diffed against real exports. Kills invented import paths.
- **Enums and unions**: allowed values of every enum/union the diff consumes.
- **Tool registries, route tables, script names**: anywhere a canonical list exists in parseable form.

Layer A grows policy-by-policy, the same way the type guard grows.

**Layer B — random excerpt challenge (all text, including prose specs).** The daemon selects random line ranges from each Required Reading file at attest time and demands the exact text back, byte-diffed. Random per attempt — it cannot be pre-scripted or cached. Re-running `gate:read` to answer is allowed and is precisely the desired behavior.

A failed attestation streams the exact mismatch (expected vs. given) back to the agent, so its next action is corrected by evidence.

### 4. Pass record — cryptographically signed

When every Required Reading file has a fresh root-recorded read, both attestation layers pass, and the diff stays inside Touched Files, the daemon signs `{ ledgerEntry, diffHash, worktree, passedAt }` with its ed25519 private key. Anyone can verify with the committed public key; **nobody without the root-held private key can mint one**. Forging a pass means breaking ed25519 — the same mathematics that secures TLS. This is the mathematical proof: the signature exists if and only if the daemon witnessed the reading.

## Enforcement points

1. **Pre-commit hook** (early wall, instant feedback): runs `gate:check` against the staged diff. This hook lives on the sovereign hooks path, so agents cannot edit it — but `git commit --no-verify` still exists, so this layer is feedback, not the fortress.
2. **The daemon's merge executor** (the fortress): the ONLY path to `main`. It merges a branch only when (a) a valid signed pass record matches the branch's diff hash, (b) its own **clean-room verification** passed — the daemon checks the branch out into root-owned scratch space and re-runs the full guard suite and tests itself, trusting no output produced in the worktree — and (c) the human pressed approve. `--no-verify` buys an agent a commit that dies at the daemon. Direct pushes to `main` are rejected by the daemon's branch protection check on the same criteria.

The failure message at every point is a precise instruction (what is unread, what attestation failed, the exact command to recover) — it lands in the agent's tool output, so even an agent that forgot everything is re-taught at the moment of violation, in any harness, from any vendor.

## Fraud countermeasures

The one thing no system can prove is that bytes entered the model's *mind* — a determined agent could script auto-answers without the content reaching its context. Three countermeasures make that path irrational:

- **Behavioral flags**: the daemon sees timing. An attestation answered milliseconds after a read, or reads with no surrounding work, are flagged `⚠ scripted-pattern` on the live dashboard. Scripts have inhuman timing.
- **Randomized challenges**: honest answering is always cheaper than building and maintaining an auto-answer rig against a moving target.
- **Game theory**: lazy agents take the cheapest path. The design makes honest reading the cheapest path and every fraud strictly more expensive — and visible. Fraud is not impossible-in-principle; it is unprofitable-in-practice and lit up on the dashboard when attempted.

And the decisive structural fact: even a perfectly executed reading fraud still cannot mint a signature, still faces clean-room re-verification, and still needs the human's approve keystroke. Fraud can waste the agent's own time; it cannot land code.

## Live observability — the dashboard

```bash
bun gate:watch
```

One formatted live stream, in the visual style of the existing guard watchers, covering every worktree:

```text
[14:02:11] antigravity-alarms  ✓ read    constraint.schema.ts            sha a3f2  2.1 KB   (root-recorded)
[14:02:38] antigravity-alarms  ✓ read    06-constraints.md               sha 9c01  11.4 KB  (root-recorded)
[14:03:02] antigravity-alarms  ✗ attest  scheduled_alarms columns        MISMATCH: gave "fireAt", actual "scheduledAt"
[14:05:19] antigravity-alarms  ✓ attest  scheduled_alarms columns
[14:05:20] antigravity-alarms  ✓ attest  excerpt 10-scheduled-alarms.md L41–44
[14:05:21] antigravity-alarms  ⛔ check   diff touches read.session.repository.ts — OUTSIDE Touched Files
[14:09:47] antigravity-alarms  🟢 PASS    ledger brain/03-tool-protocol/0004   ed25519-signed
[14:11:02] daemon              🔬 clean-room verify antigravity-alarms: guards ✓ tests ✓
[14:11:03] daemon              ⏳ AWAITING APPROVAL  antigravity-alarms  [press a to approve · d to view diff]
[14:13:40] human               ✅ approved — merged to main · ledger 0004 marked done · next entry assigned
[14:13:41] daemon              🔒 lock integrity: sovereign territory intact (last check 14:13)
```

The human watches everything, intervenes for one keystroke, and the loop continues. The same events the human sees are the same exit-code messages agents receive — one stream, two readers.

## The 0.1% — everything the human still does

1. `sudo bun gate:up` once per work session (and `gate:down` to stop).
2. Press approve on a verified branch after reviewing its diff and `REVIEW.md`.
3. The sovereign ritual, rarely: review an agent-proposed tooling diff, sudo-unlock, apply, relock.
4. Key rotation if ever suspected compromised (`sudo bun gate:rotate-key`).

Everything else — reads, attestations, signing, clean-room verification, merge execution, ledger bookkeeping, next-assignment dispatch, feedback routing — is automated and streamed.

## Required software

Nothing exotic. Everything ships with macOS and Bun:

- `chflags` (macOS built-in) — sovereign territory locks
- root ownership + file modes (OS built-in) — manifest and key protection
- ed25519 via `node:crypto` `sign`/`verify` (built into Bun) — pass record signatures
- unix domain sockets via `Bun.serve` — daemon transport
- `fs_usage` (macOS built-in, root) — optional syscall-level read audit trail

No new binaries or npm packages are required. If a future slice wants kernel-level file-access events, macOS EndpointSecurity is the upgrade path (requires an entitled binary — a human-installed component, which fits sovereign territory by definition).

## Guard structure — one file, one responsibility

A fourth guard: `tools/brioela-reading-gate/`, following the established guard shape (`brioela-type-guard` is the precedent: entry handlers at the package root, sanctioned underscore folders, dot-named role-suffixed files). The law inside this guard: **one file carries exactly one responsibility.** Handlers parse the command and delegate; helpers do one job; policies hold one attestation rule; types hold one shape. Assembly happens in `index.ts` barrels, never by swelling a file.

The folder set obeys the name guard's locked `allowedUnderscoreFolders` law — no invented folders. Everything lives in `_helpers`, `_policies`, `_types`, `_watch`, with all entry handlers (including the daemon process script) at the package root, exactly like the other three guards.

```text
tools/brioela-reading-gate/
├── package.json
├── tsconfig.json
├── index.ts                              # public surface assembly only
│
│   # entry handlers — one CLI command = one handler (slice 1 built: up/down/read/status/run)
├── up.gate.handler.ts                    # sudo entry: folders → spawn daemon → health poll
├── down.gate.handler.ts                  # sudo stop via pid file
├── run.gate.daemon.handler.ts            # the root daemon process (spawned by gate:up)
├── read.gate.handler.ts                  # client side of gate:read (socket call, stream content)
├── status.gate.handler.ts                # checklist of recorded reads, fresh/stale verdicts
├── attest.gate.handler.ts                # (slice 2) challenge round-trip
├── check.gate.handler.ts                 # (slice 3) pass record vs staged diff
├── rotate.key.gate.handler.ts            # (slice 3) sudo key rotation
├── watch.gate.handler.ts                 # (slice 4) attach the live dashboard
│
├── _helpers/                             # one job per file, slice 1 built:
│   ├── index.ts
│   ├── gate.config.helper.ts             # all gate paths + ttl, single source
│   ├── workspace.root.helper.ts          # BRIOELA_WORKSPACE_ROOT resolution
│   ├── read.current.epoch.ms.helper.ts   # dayjs clock (native Date is banned)
│   ├── create.content.hash.helper.ts     # sha256 of served bytes
│   ├── format.manifest.entry.helper.ts   # entry → manifest line
│   ├── parse.manifest.entry.helper.ts    # manifest line → entry | null
│   ├── append.read.entry.helper.ts       # the ONLY writer of manifest lines
│   ├── read.manifest.entries.helper.ts   # load + parse the manifest
│   ├── is.fresh.entry.helper.ts          # ttl freshness verdict
│   ├── serve.gate.socket.helper.ts       # Bun.serve on the unix socket + routing
│   ├── serve.read.route.helper.ts        # /read — daemon performs the OS read, records, streams back
│   ├── serve.status.route.helper.ts      # /status — fresh/stale checklist text
│   └── append.gate.event.helper.ts       # event log line for the future dashboard
│       # later slices add here: signing, scope, cleanroom, merge, orchestrator helpers
│
├── _policies/                            # (slice 2+) one attestation rule per file
│   ├── attest.drizzle.columns.policy.ts  # parse schema TS → exact column list
│   ├── attest.module.exports.policy.ts   # parse real exports of imported modules
│   ├── attest.enum.values.policy.ts      # allowed values of consumed enums/unions
│   └── attest.excerpt.lines.policy.ts    # random line-range exact-text challenge
│
├── _watch/                               # (slice 4) dashboard rendering
│
└── _types/                               # one shape per file
    ├── index.ts
    ├── read.manifest.entry.type.ts       # slice 1 built
    └── pass.record / challenge / verdict / assignment / event types (later slices)
```

Wiring: root `package.json` scripts `gate:up`, `gate:down`, `gate:read`, `gate:status` (slice 1, wired), later `gate:attest`, `gate:check`, `gate:watch`, `gate:rotate-key`, all following the existing `BRIOELA_WORKSPACE_ROOT=$PWD bun --cwd tools/brioela-reading-gate ...` pattern. `gate:check` joins `bun run verify` and the sovereign hooks path.

Growth rule: a new attestable domain = one new file in `_policies/`, nothing else changes. A new dashboard event = one new case in the watch formatter. No file ever absorbs a second responsibility; assembly lives in the barrels. The entire folder is sovereign territory once the gate code stabilizes.

## Properties this design guarantees

- **Agent-agnostic**: the walls are the OS, git, a CLI, and exit codes. Nothing depends on which AI, IDE, or harness is driving.
- **Unforgeable records**: manifest entries are root-written (EACCES otherwise); passes are ed25519-signed; tests are clean-room re-run. No self-reported anything.
- **Ungovernable machinery is untouchable**: agents cannot edit the gate, the guards, the hooks, the scripts, or the daemon — sovereign territory is OS-locked.
- **Forgetting is harmless**: every failure message contains the exact recovery commands. The rule re-teaches itself at the moment of violation.
- **No cached knowledge can pass**: freshness windows, hash binding, randomized excerpt challenges.
- **Scope creep is impossible**: diff ⊆ Touched Files, checked by the daemon.
- **The human is two keystrokes**: `sudo bun gate:up`, then approve. Everything else runs itself and streams itself.
```
