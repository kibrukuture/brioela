# Cross-ref: SessionContextCompressor drafts (feature 12 — not 13)

Feature **13** orchestrates compression; feature **12** owns the Haiku sub-agent. Full production snapshots for **12**-owned files:

| File | Draft location |
|---|---|
| `session.context.compressor.agent.ts` | `_features/12-brain-sub-agents/draft/session.context.compressor.agent.gap.md` |
| `compress.session.context.handler.ts` | `_features/12-brain-sub-agents/draft/compress.session.context.handler.gap.md` |
| `session.context.compressor.system.prompt.ts` | `_features/12-brain-sub-agents/draft/session.context.compressor.system.prompt.gap.md` |
| `compression.summary.schema.ts` (consumer) | Also duplicated in **13** `draft/compression.summary.schema.gap.md` — **13** defines, **12** imports |

**DO key:** `compressor_${userId}_${sessionId}` per **17**.

**Model:** `claude-haiku-4-5-20251001`.

**Tool permissions:** `compressor: []` — no tools.

**Obsolete:** `_records/implementation-ledger/brain/07-sub-agents/0003.session-context-compressor.md` — wrong schema, inline-only, invalid session types. Do not implement from that ledger.

**Layout conflict:** `build-guide/05-brain/01-do-class-and-setup.md` also lists `_context/compress.session.context.handler.ts` — **prefer `_subagents/session-context-compressor/`** per **12** build manifest.

**13** must not ship a second Haiku path in `_handlers/compress.session.handler.ts` — always `subAgent(SessionContextCompressor)`.
