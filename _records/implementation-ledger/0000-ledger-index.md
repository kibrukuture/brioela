# Implementation Ledger Index

## Purpose

This ledger records what has actually been implemented or materially changed in the repo. Build guides and specs describe what should exist; this ledger records what now exists, what remains unfinished, and what the next implementation slice should be.

## Rules

- Every real coding slice adds or updates one ledger entry.
- Entries are append-only unless correcting factual mistakes.
- Each entry links to the source guide/spec it satisfies.
- Each entry records verification commands.
- Deferred work must be explicit.

## Folder Shape

```text
_records/implementation-ledger/{domain}/{scope}/NNNN.short.name.md
```

Examples:

```text
_records/implementation-ledger/brain/02-sqlite-migration-runtime/0001.design.docs.md
_records/implementation-ledger/brain/02-sqlite-migration-runtime/0002.runtime.foundation.md
_records/implementation-ledger/brain/05-session-lifecycle/0001.session-open.md
```

## Entries

| Entry | Scope | Status | Summary |
|---|---|---|---|
| `brain/01-drizzle-spine/0001.initial-spine.md` | Brain / Drizzle spine | done | Added the first Brain Agent, Drizzle schema, repository boundary, migration bundle, smoke path, and Durable Object binding. |
| `brain/01-drizzle-spine/0002.memory-event-cursor.md` | Brain / Drizzle spine | done | Reworked Brain memory listing to keyset cursor pagination with a Drizzle-owned composite index migration. |
| `brain/02-sqlite-migration-runtime/0001.design.docs.md` | Brain / SQLite migration runtime | done | Added the production migration doctrine to build guides/specs. |
| `brain/02-sqlite-migration-runtime/0002.runtime-repositories.md` | Brain / SQLite migration runtime | done | Added repositories and startup lifecycle recording for migration runs, smoke results, readiness, and agent-state migration locks. |
| `brain/02-sqlite-migration-runtime/implementation/0001.schema-indexes-alignment.md` | Brain / SQLite migration runtime | done | Aligned Drizzle TS schemas (sessions, constraints, recipes) with spec indexes, generated standard SQLite migrations, and updated bundle. |
| `brain/02-sqlite-migration-runtime/implementation/0002.fts5-and-sync-triggers.md` | Brain / SQLite migration runtime | done | Created FTS5 virtual tables (unicode61 & trigram) and triggers for real-time synchronization on sessions and session_turns. |
| `brain/03-tool-protocol/implementation/0001.first-memory-tools.md` | Brain / Tool protocol | done | Implemented user memory write, read, and event log AI tools, repositories, and permission checks with green DO tests. |
| `brain/03-tool-protocol/implementation/0002.skill-tools.md` | Brain / Tool protocol | open | 5 skill tools (create, update, view, archive, delete) + skill_versions archive write on update/delete. |
| `brain/03-tool-protocol/implementation/0003.constraint-tools.md` | Brain / Tool protocol | open | 2 constraint tools (propose + confirm two-step) — pending → active → revoked lifecycle. |
| `brain/03-tool-protocol/implementation/0004.alarm-tools.md` | Brain / Tool protocol | open | 2 alarm tools (schedule, cancel) — user-facing alarm types only, DO alarm callbacks injected. |
| `brain/03-tool-protocol/implementation/0005.recipe-tools.md` | Brain / Tool protocol | open | 3 recipe tools (view, update, archive) — recipes created by Mira, managed here. |
| `brain/03-tool-protocol/implementation/0006.session-tools.md` | Brain / Tool protocol | open | 2 session tools (load context, FTS5 search history) — read-only, general session only. |
| `brain/03-tool-protocol/implementation/0007.web-tool.md` | Brain / Tool protocol | open | 1 web tool (Brave Search API, 5-call-per-session limit) — general session only. |
| `brain/03-tool-protocol/implementation/0008.executable-artifact-naming.md` | Brain / Tool protocol | done | Established the artifact naming law: executable exports mirror their file stems (`logMemoryEventExecutable` etc.), `run` reserved for orchestration, `executable` added to backend lexicon. Guards clean, brain tests green. |
| `brain/04-agent-identity/0001.identity-prompt.md` | Brain / Agent identity | open | Create `identity-prompt.ts` — BrioelaIdentity constant, 800-token cap. |
| `brain/05-session-lifecycle/0001.session-open.md` | Brain / Session lifecycle | open | `open.session.handler.ts` — creates session row, schedules watchdog alarm, calls system prompt builder. |
| `brain/05-session-lifecycle/0002.system-prompt-builder.md` | Brain / Session lifecycle | open | `build.system.prompt.handler.ts` — assembles 6 blocks in strict prefix-cache order. |
| `brain/05-session-lifecycle/0003.session-close.md` | Brain / Session lifecycle | open | `close.session.handler.ts` — marks session completed, writes outcomeSummary, cancels watchdog alarm. |
| `brain/05-session-lifecycle/0004.session-compression.md` | Brain / Session lifecycle | open | `compress.session.handler.ts` — threshold check + Haiku-powered 4-field compression, child session creation. |
| `brain/06-alarm-system/0001.alarm-dispatch.md` | Brain / Alarm system | open | `dispatch.alarm.handler.ts` — alarm router + session_watchdog case (abandoned session detection). |
| `brain/07-sub-agents/0001.brain-maintenance-agent.md` | Brain / Sub-agents | open | `BrainMaintenanceAgent` DO + brain_maintenance alarm case. |
| `brain/07-sub-agents/0002.behavior-pattern-agent.md` | Brain / Sub-agents | open | `BehaviorPatternAgent` DO + behavior_pattern_detection alarm case. |
| `brain/07-sub-agents/0003.session-context-compressor.md` | Brain / Sub-agents | open | `SessionContextCompressor` ephemeral Haiku call — 4-field summary, child session creation. |
| `brain/08-framework-hardening/0001.chat-entrypoint.md` | Brain / Framework hardening | open | Wire `onMessage`/`chat()` onto BrioelaBrain — connects all prior scopes into a working agent. |
| `tooling/01-lexicon-guard/0001.granular-vocabulary.md` | Tooling / Lexicon guard | done | Split the lexicon guard vocabulary into granular owned slices while keeping stable aggregate exports. |
| `tooling/02-reading-gate/0001.design.docs.md` | Tooling / Reading gate | done | Wrote the Reading Gate and Agent Loop Orchestration design doctrine (build-guide 14 & 15) — hard mechanical read-proof gate at commit time plus the agent loop where the human is reviewer/merger only. |
| `tooling/02-reading-gate/0002.unforgeable-design.md` | Tooling / Reading gate | done | Revised build-guide 14 & 15 to the unforgeable model: root daemon as reader-of-record, root-owned manifest, ed25519-signed passes, clean-room verification, daemon-executed merges, sovereign-territory locks on all tooling, full automation behind one `sudo bun gate:up` command. |
| `tooling/02-reading-gate/0003.daemon-manifest-read.md` | Tooling / Reading gate | done | Slice 1 built: root gate daemon on a unix socket, root-owned TSV manifest, `gate:read`/`gate:status`/`gate:up`/`gate:down` handlers, freshness + hash verdicts, 7 green tests. Blocked items need human unlocks (lexicon wiring, helper-test policy conflict). |
| `tooling/02-reading-gate/0004.hardened-verdict-loop.md` | Tooling / Reading gate | done | Hardened closed loop built fully (phases A–E): signed green receipts + heartbeat (fail closed), reactive all-event watcher, GUARD-RED.md + PostToolUse hook + dynamic delta/nearest-word copy, tamper freeze + launchd KeepAlive, 14 tests + gate:smoke drill. Pre-commit wall + `verify` now run the daemon verdict. |


