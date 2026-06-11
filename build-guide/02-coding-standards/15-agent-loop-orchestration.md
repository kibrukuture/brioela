# 15 — Agent Loop Orchestration

## Doctrine

The human writes no ledger entries, writes no prompts, and assigns no tasks. The human does exactly two things: **review** and **approve**. Everything else — studying the documents, drafting the next ledger entry, implementing it, verifying it, reviewing it, merging it, and dispatching the next assignment after a merge — is done by agents and the root daemon inside loops, and every agent step is forced through the Reading Gate (`14-reading-gate.md`).

This is loop engineering applied to this repository: the system prompts the agents; the daemon executes the mechanics; the human governs with single keystrokes.

## Bootstrap — one command

```bash
sudo bun gate:up
```

The same command that starts the Reading Gate daemon (`14-reading-gate.md`) also starts every orchestration service below. There is no second setup step, no per-agent configuration, no manual assignment. The human runs one command, attaches `bun gate:watch` in a second terminal, and from then on touches the system only to approve.

## The work unit

One implementation ledger entry = one unit of work = one agent assignment. Never smaller, never larger. The ledger index is the work queue: `open` rows are available work, `done` rows are memory. No two active assignments may overlap in `Touched Files` — the orchestrator refuses to activate a ledger entry whose scope intersects another active one. Parallel agents are physically unable to collide.

## The roles

All roles are agent-agnostic — any AI in any harness can hold any role, because every role interacts with the system only through the CLI and git. No role can touch sovereign territory (`14-reading-gate.md`): the guards, the daemon, the scripts, and the hooks are OS-locked against every agent at all times.

### 1. Ledger author

Studies the specs and build guides, then drafts the **next** ledger entry — Required Reading list, Touched Files scope, purpose, verification plan.

The critical rule: **writing a ledger entry is itself gated work.** The author's diff touches `_records/implementation-ledger/**`, and the gate derives its Required Reading from every spec, schema, and build-guide file the entry cites — the author cannot cite a document it has not freshly read through the daemon, and cannot reference a table whose columns it cannot attest. A ledger entry can no longer be written from memory, because it cannot be signed from memory.

### 2. Implementer (one per worktree)

Each implementer lives in its own git worktree on its own branch — one worktree per agent, one ledger entry per worktree at a time. The implementer's loop:

1. Read `INBOX.md` (human/reviewer feedback first — always first).
2. Activate the assigned open ledger entry.
3. Pass the Reading Gate: `gate:read` everything required, `gate:attest`, stay inside Touched Files.
4. Implement. Run guards and tests until green (`bun run verify`).
5. Commit (the signed pass record is bound to the diff hash), mark the ledger entry's stop state, signal ready.

The worktree gives the human perfect isolation: `git diff main...<branch>` shows exactly one agent's work and nothing else. No mixed authorship, no archaeology.

### 3. Reviewer agent

When an implementer signals ready, the orchestrator automatically dispatches a fresh-context reviewer agent — one that did NOT write the code — against the worktree. It must pass the same Reading Gate on the same Required Reading list, then diff the work against spec and write `REVIEW.md` into the worktree: findings, spec mismatches, guard observations, with file paths and line numbers. The human reads `REVIEW.md` first, then the diff. AI judgment is used where it helps (semantic review); rule enforcement stays with the deterministic guards and the daemon, which do not hallucinate.

### 4. The orchestrator (services of the root daemon)

Not a separate process the agents could tamper with — these are services inside the root daemon started by `gate:up`, with state in root-owned storage:

- **Assignment dispatcher**: keeps every registered worktree loaded with exactly one open, non-overlapping ledger entry. When a worktree goes idle (merged or newly registered), the dispatcher assigns the next open entry automatically and writes the activation into the worktree's `INBOX.md`. No human assignment, ever.
- **Verification pipeline** (fully automated, zero human steps): when a branch signals ready and `REVIEW.md` exists, the daemon (a) verifies the ed25519 pass signature against the branch's diff hash, (b) runs **clean-room verification** — checks the branch out into root-owned scratch space and re-runs the entire guard suite and tests itself, trusting nothing produced in the worktree — and (c) moves the branch to `AWAITING APPROVAL` on the dashboard. Any failure routes the full error output into the worktree's `INBOX.md` automatically and returns the assignment to `implementing` — the agent gets its feedback without the human carrying messages.
- **Merge executor**: on the human's approve keystroke, the daemon performs the merge to `main`, marks the ledger entry `done` in the index, archives the signed pass record, and the dispatcher immediately assigns that worktree its next entry. The loop continues with zero prompting.
- **Feedback router**: when the human rejects instead of approving, the human types one note in the dashboard; the daemon routes it into that worktree's `INBOX.md` and returns the assignment to `implementing`. The implementer's loop reads `INBOX.md` before anything else, so human feedback is structurally impossible to skip. The human never chases an agent.
- **Stall detector**: an assignment with no gate events and no commits for the stall window is flagged on the dashboard — a silent, stuck, or wandering agent becomes visible in minutes, not days.

## The full loop, end to end

```text
ledger author studies docs (gated) ──▶ drafts next ledger entry (signed pass)
        ▲                                          │
        │                                          ▼
  merge executor                     dispatcher assigns entry → idle worktree
  marks done,                                      │
  dispatcher assigns next                          ▼
        ▲                            implementer: INBOX → gate pass → code →
        │                                guards green → signed commit → ready
        │                                          │
        │                                          ▼
        │                            reviewer agent (gated) writes REVIEW.md
        │                                          │
        │                                          ▼
        │                            daemon: signature ✓ → clean-room verify ✓
        │                                          │
        │                                          ▼
        └────────────── HUMAN: reads REVIEW.md + diff, presses approve
                          (or types one rejection note — auto-routed back)
```

The human appears exactly once per cycle, at the single point that requires judgment and authority — and even there, the mechanics (verifying, merging, bookkeeping, re-dispatching, feedback delivery) are all performed by the daemon. What reaches the human was provably built on real, fresh, root-witnessed reading, re-verified in a clean room, pre-reviewed by a fresh-context agent, in an isolated single-author diff.

## What the human watches and does

- `bun gate:watch` — the live dashboard: every read, attestation, violation, signed pass, clean-room result, and board change, across all worktrees; approval prompts appear inline (`press a to approve · d to view diff`).
- `bun loop:status` — one-shot board: who holds what, in which state (`reading | implementing | verifying | awaiting-review | awaiting-approval | merged`), since when, stalls flagged.
- **Approve or reject.** That is the job. Everything else is the system's job.

## Scaling rule

Adding throughput = adding worktrees, not adding process. Each new agent gets a worktree, registers with the dispatcher, joins the same queue, obeys the same gate, and appears on the same board. Ten agents in parallel produce ten isolated, signed, clean-room-verified, pre-reviewed diffs — the human's review cost grows linearly with merged work, never with agent count or coordination overhead.
