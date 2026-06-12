# Draft: BelaOrderAgent — cross-feature gap (NOT feature 12)

**Owning feature:** **42-bela**

**Shipped:** No. No `backend/src/agents/bela/` or `order-agent/` in repo.

## What it is

Ephemeral **Durable Object** keyed by `order_id` (`env.ORDER_AGENT.idFromName(orderId)`). Order state machine, live scan-together WebSocket relay, frozen constraint snapshot cache, escrow/delivery triggers.

## Relationship to BrioelaBrain

- Reads user constraints from **BrioelaBrain** SQLite at order acceptance → writes frozen snapshot to Supabase `order_constraint_snapshot`.
- Does **not** spawn from Brain maintenance/compression alarms.
- Shopper-side **Mira bela_shopper** presence: **architectural conflict** —
  - `implementable-specs/bela/14-shopper-ai-assistant.md`: Gemini Live runs **inside BelaOrderAgent** (`shopperGeminiWs`).
  - `build-guide/11-bela/14-shopper-ai-assistant.md`: start **MiraSession** with bela_shopper scene + BelaOrderAgent for order state.
  - Reconcile before implementation; **42** owns resolution.

## Not the same as

| Name | Difference |
|---|---|
| **MiraSession (cooking)** | User-facing cooking; BelaOrderAgent is order-scoped |
| **Brain child sub-agents** | BelaOrderAgent is sibling DO, not `subAgent()` from Brain |
| **search_web** | Scanner constraint checks use snapshot + scanner pipeline, not web search tool |

## Intended production path

```
backend/src/agents/bela/
├── bela.order.agent.ts
├── _handlers/scan.session.handler.ts
├── _handlers/order.state.machine.handler.ts
└── index.ts
```

## Sources read

- `implementable-specs/bela/00-overview.md`
- `implementable-specs/bela/04-live-scan-session.md`
- `implementable-specs/bela/13-data-model.md`
- `implementable-specs/bela/14-shopper-ai-assistant.md`
- `build-guide/11-bela/00-overview.md`
- `build-guide/11-bela/13-data-model.md`
- `build-guide/11-bela/14-shopper-ai-assistant.md`

## Blocked by

- **04-brain-foundation**
- **24-scanner** (constraint-enforced scan pipeline)
- **29-cooking-session** / **30-mira-speech-engine** (if MiraSession path chosen for shopper AI)
