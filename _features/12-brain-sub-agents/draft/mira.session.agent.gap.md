# Draft: MiraSession — cross-feature gap (NOT feature 12)

**Owning features:** **29-cooking-session**, **30-mira-speech-engine**, scene builders in **42**, **28**, **25**, **44**, **45**.

**Shipped:** No. `backend/src/agents/` contains only `brain/` — no `mira/` folder. Wrangler binding documented in `build-guide/05-brain/01-do-class-and-setup.md` and `03-foundation/02-backend-worker-setup.md` but not registered in production worker yet.

## What it is

One **Agent-backed Durable Object class** (`MiraSession`) — ephemeral, session-scoped. **Not** a Brain child sub-agent. Permanent user truth flows through typed **BrioelaBrain** RPC.

## Relationship to BrioelaBrain

| Brain | MiraSession |
|---|---|
| Permanent `idFromName(userId)` | Ephemeral per session (`cook-…`, `shop-…`, etc.) |
| Owns user SQLite | Owns live Gemini WS, timers, local recovery ledger |
| Creates RealtimeKit room + spawns MiraSession for cooking | Writes `sessions` row with `session_type: cooking` |
| Receives session-end summary + memory writes | Forwards tool calls to Brain RPC |

## MiraSceneKind (one Mira, many scenes)

From `build-guide/30-mira/01-scene-contract.md`:

`cooking` · `bela_shopper` · `menu_language_bridge` · `recipe_review` · `scan_followup` · `kid_explanation` · `kid_co_scan`

In-store co-pilot (**45**) uses Mira lifecycle with DO name `shop-{userId}-{visitId}` but scene kind not yet in enum — reconcile in **30** / **45**.

## Intended production path

```
backend/src/agents/mira/
├── mira.session.agent.ts       ← extends Agent<Env>
├── _handlers/open.gemini.session.handler.ts
├── _handlers/forward.tool.to.brain.handler.ts
└── index.ts
```

## Sources read

- `implementable-specs/cooking-session/02-mira-session.md`
- `build-guide/08-cooking-session/02-mira-session-do.md`
- `build-guide/30-mira/00-overview.md`
- `build-guide/30-mira/01-scene-contract.md`
- `implementable-specs/07-sessions.md` (dual writer: Brain + MiraSession)
- `brioela-specs/09-per-user-brain.md` (cooking session = sub-agent DO rationale)

## Blocked by

- **04-brain-foundation** (Brain RPC surface for Mira forwarding)
- **20-brain-chat-runtime** (shared tool/registry patterns)
- **11-brain-sessions-lifecycle** (session open/close contract)
