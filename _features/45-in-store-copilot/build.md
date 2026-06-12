# In-Store Co-Pilot — Build

Feature **45**. Production paths under `backend/src/api/shop/` (handlers, helpers, routes), `backend/src/agents/brain/_schemas/shop.visit.*.ts`, `backend/src/agents/brain/_handlers/shop/`, `backend/src/agents/mira/_scenes/build.in.store.copilot.mira.scene.helper.ts`, `shared/validator/shop/`, `shared/routes/shop.routes.ts`, `mobile/features/in-store-copilot/`, and Upstash post-visit workflow worker hook.

**Depends on:** **29** MiraSession DO + Gemini bridge; **30** `MiraScene` contract (`in_store_copilot` enum addition); **24** scan resolve + offline queue; **07**/**23** constraint/condition checks; **33** `purchase_price_event` + receipt ingest; **34** shopping list + predictive nudges; **27** Ground cached finds; **28** `price_sighting` fallback; **36** glucose spike triggers; **41** active Mesa audience read; **42** shared `checkConstraintForOrder` (warn path); **43** `in_store_copilot` tier gate.

**Blocks:** None directly — enhances habit loop. **33** richer receipt match when `shop_visit` lists present; **34** bought/skipped outcomes.

**Scope:** shop visit tables, context assembly, Mira audio session, spend estimate, speech policy, scan push integration, API routes, mobile shell, post-visit workflow, tier gate. **Not in 45 build:** BelaOrderAgent (**42**), continuous shopper video, indoor positioning, payment, Ground find submission, meal plan generation (**34**), receipt vision body (**33**), Mesa tables (**41**).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/32-in-store-copilot/` (6 files) | ✓ docs only |
| `brioela-specs/45-in-store-copilot.md` | ✓ spec |
| `_records/connections/28-in-store-copilot-connections.md` | ✓ ledger |
| `_records/build-order/29-layer-in-store-copilot.md` | ✓ build order |
| **43** `in_store_copilot` in tier matrix draft | ✓ docs only |
| **33** `shop_visit` receipt source enum in draft | ✓ docs only |
| `backend/src/api/shop/` | ✗ |
| `shop_visit` / `shop_visit_event` Brain schemas | ✗ |
| `in_store_copilot` MiraScene builder | ✗ |
| `MiraSceneKind: in_store_copilot` in **30** types | ✗ |
| Mobile `features/in-store-copilot/` | ✗ |
| Post-visit workflow | ✗ |
| Shop tests | ✗ |

**Zero in-store-copilot production code.** `rg 'shop_visit|in_store_copilot|/api/shop' backend/src shared/ mobile/` — no matches.

---

## File manifest

### Shared validator + routes (**45**)

| File | Role |
|---|---|
| `shared/validator/shop/shop.session.schema.ts` | Start/events/end request/response Zod |
| `shared/validator/shop/shop.visit.schema.ts` | Visit + event types for API reads |
| `shared/validator/shop/shop.context.payload.schema.ts` | Session-start payload contract |
| `shared/routes/shop.routes.ts` | `SHOP_ROUTES`, path constants |

### Brain SQLite schemas (**45**)

| File | Role |
|---|---|
| `_schemas/shop.visit.schema.ts` | `shop_visit` table |
| `_schemas/shop.visit.event.schema.ts` | `shop_visit_event` table |
| `_schemas/index.ts` | Export + migration registration (**04**) |
| `_migrations/*` | Add shop visit tables to Brain chain |

### Backend API — shop module (**45**)

| File | Role |
|---|---|
| `backend/src/api/shop/shop.route.ts` | Hono mount `/api/shop` |
| `backend/src/api/shop/shop.controller.ts` | Controller wiring |
| `backend/src/api/shop/_handlers/post.shop.session.handler.ts` | `POST /api/shop/session` — start |
| `backend/src/api/shop/_handlers/post.shop.session.events.handler.ts` | `POST /api/shop/session/events` |
| `backend/src/api/shop/_handlers/post.shop.session.end.handler.ts` | `POST /api/shop/session/end` |
| `backend/src/api/shop/_handlers/get.shop.visit.handler.ts` | Optional: visit detail read |
| `backend/src/api/shop/_handlers/index.ts` | Barrel |
| `backend/src/api/shop/index.ts` | Module export |

Register in backend app router (**01**).

### Shop session orchestration (**45** + **29**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_handlers/shop/start.shop.mira.session.handler.ts` | Entitlement check, context assembly, spawn MiraSession |
| `backend/src/agents/brain/_handlers/shop/assemble.shop.session.context.helper.ts` | Payload from **34**/**33**/**27**/**41**/**36** |
| `backend/src/agents/brain/_handlers/shop/close.shop.visit.handler.ts` | End session + enqueue workflow |
| `backend/src/agents/brain/_handlers/shop/index.ts` | Barrel |

### Spend + speech helpers (**45**)

| File | Role |
|---|---|
| `_handlers/shop/estimate.running.spend.helper.ts` | Price resolution ladder per scan |
| `_handlers/shop/evaluate.swap.suggestion.helper.ts` | Personal evidence + plausibility bar |
| `_handlers/shop/enforce.in.store.speech.policy.helper.ts` | 3-cap + safety bypass |
| `_handlers/shop/infer.list.checkoff.from.scan.helper.ts` | List item ↔ scan match |
| `_handlers/shop/relay.ground.find.at.start.helper.ts` | Max one find selection |
| `_handlers/shop/append.shop.visit.event.helper.ts` | `shop_visit_event` writer |
| `_handlers/shop/index.ts` | Barrel |

### Post-visit workflow (**45** body; platform queue)

| File | Role |
|---|---|
| `_handlers/shop/run.post.shop.visit.workflow.handler.ts` | Upstash workflow entry |
| `_handlers/shop/reconcile.shop.list.with.receipt.helper.ts` | Bought vs skipped |
| `_handlers/shop/emit.dislike.signals.from.skipped.helper.ts` | Behavioral discovery writes |
| `_handlers/shop/link.shop.visit.receipt.helper.ts` | Set `receipt_id` after **33** |

### Mira scene (**45** + **30**)

| File | Role |
|---|---|
| `backend/src/agents/mira/_scenes/build.in.store.copilot.mira.scene.helper.ts` | `MiraScene<InStoreCopilotSituation>` |
| `backend/src/agents/mira/_scenes/in.store.copilot.situation.schema.ts` | Zod situation context |
| `backend/src/agents/mira/_types/mira.scene.types.ts` | Add `in_store_copilot` to `MiraSceneKind` (**30**) |

Audio-only: no RealtimeKit video adapters for **45**. Reuse **29** mobile audio WS + Gemini bridge.

### Scan integration (**24** → **45**)

| File | Role | Owner |
|---|---|---|
| `backend/src/api/scan/_helpers/push.scan.verdict.to.shop.session.helper.ts` | If active `shop_visit`, push to Mira | **45** hook called from **24** resolve |
| Active visit registry | Brain or MiraSession state — `active_shop_visit_id` | **45** |

### Constraint enforcement (**42** shared, **45** warn)

| File | Role |
|---|---|
| `backend/src/agents/bela/_helpers/check.constraint.for.order.helper.ts` | Shared implementation — **42** ships; **45** imports warn path |
| `_handlers/shop/warn.constraint.on.scan.helper.ts` | Map block result → Mira speech stimulus (**45**) |

Do **not** fork constraint matching in **45**.

### Entitlement (**43** consumer)

| File | Role |
|---|---|
| `backend/src/agents/brain/_helpers/pricing/check.in.store.copilot.entitlement.helper.ts` | `in_store_copilot` + voice allowance |
| Uses `check.usage.limit.helper.ts` | Shared Culina monthly cap |

### Mobile (**45**)

| File | Role |
|---|---|
| `mobile/features/in-store-copilot/in.store.copilot.feature.tsx` | Session shell — start/end, earbud UX |
| `mobile/features/in-store-copilot/hooks/use.shop.mira.session.hook.ts` | Audio WS join, session state |
| `mobile/features/in-store-copilot/hooks/use.ambient.store.prompt.hook.ts` | Geo prompt — once per visit |
| `mobile/features/in-store-copilot/components/shop.session.controls.tsx` | Mute, end, list peek |
| `mobile/features/in-store-copilot/components/degraded.mode.banner.tsx` | Honest offline copy |
| `mobile/network/shop/start.shop.session.api.ts` | `POST /api/shop/session` |
| `mobile/network/shop/end.shop.session.api.ts` | `POST /api/shop/session/end` |
| Scanner surface integration | Co-pilot start button on **24** scanner tab |

### Receipt handoff (**33** consumer)

| File | Role |
|---|---|
| **33** `post.receipts.ingest.handler.ts` | Accept `source: shop_visit` + `visitId` |
| **45** `close.shop.visit.handler.ts` | Navigate mobile to receipt capture on checkout end |

---

## Acceptance criteria

### Session lifecycle

- [ ] User can start co-pilot with one tap from scanner; tier gate shows upgrade for below-Culina.
- [ ] Ambient prompt at known grocery fires at most once per visit; dismissible; never auto-starts mic.
- [ ] MiraSession DO named `shop-{userId}-{visitId}`; audio-only — no continuous video stream.
- [ ] Session ends on user done, receipt scan start, or geofence exit.
- [ ] Microphone inactive outside explicit session.

### Context payload

- [ ] Payload assembled once at connect: list (**34**), constraints, Mesa audience (**41**), store price history (**33**), glucose triggers (**36**), Ground finds 7d (**27**), open nudges (**34**).
- [ ] No mid-session Supabase queries from MiraSession DO.
- [ ] Mesa audience never guessed — explicit active only.

### Mid-session behavior

- [ ] Every **24** scan during active visit pushes verdict to Mira via `send_realtime_input`.
- [ ] Running spend updates after each scan; unpriced items excluded from dollar total.
- [ ] List check-offs inferred when scan matches list item.
- [ ] Hard constraint / Mesa-member violations always spoken immediately.
- [ ] Max 3 unprompted non-safety interventions per visit enforced.
- [ ] Swap suggestions only when personal evidence + in-store plausibility both hold.
- [ ] At most one Ground find relayed at session start unless user asks.
- [ ] Baseline crossing mentioned once per visit.

### Constraint boundary vs Bela

- [ ] **45** uses shared `checkConstraintForOrder` — warnings only, never blocks purchase.
- [ ] **42** `bela_shopper` scene not used for user self-shop.
- [ ] Separate `MiraSceneKind: in_store_copilot` — not aliased to `bela_shopper`.

### Spend + receipt

- [ ] Price resolution: personal history → community sighting → unpriced.
- [ ] Mira always says "about" for totals.
- [ ] Receipt ingest with `source: shop_visit` links `shop_visit.receipt_id` and retrains estimates.

### Offline

- [ ] Scans queue offline per **24** contract; session state recovers on reconnect.
- [ ] Degraded mode announced once with honest copy.
- [ ] Visit completes from receipt + queued scans if live session dies.

### Post-visit

- [ ] Workflow writes list completion, bought/skipped, price events, pantry resets.
- [ ] `shop_visit_event` rows for scan, swap, warning, ground relay, total milestone.

### Privacy

- [ ] No audio stored; transcript follows **29** rules.
- [ ] `place_id` only — no GPS trace, no aisle path data.
- [ ] No automatic Ground writes from session.

### Tier

- [ ] `in_store_copilot` gated at Culina+; draws from shared voice session allowance.
- [ ] Scan experience unchanged for free users.

### Tests

- [ ] Speech policy cap unit tests (3 intervention limit, safety bypass).
- [ ] Spend estimate ladder tests (history → sighting → unpriced).
- [ ] Swap evidence bar tests (reject population-level suggestions).
- [ ] Integration: start session → mock scan push → end → workflow enqueue.

---

## 45 vs neighbor build ownership

| Build in **45** | Build elsewhere |
|---|---|
| `shop_visit` tables + events | `purchase_price_event` (**33**) |
| Context assembly read helpers | List generation (**34**) |
| `in_store_copilot` scene | MiraSession class (**29**) |
| Scan push hook | Resolve handler (**24**) |
| Warn constraint speech | Block constraint (**42**) |
| Mobile co-pilot shell | Scanner camera (**24**) |
| Post-visit workflow | Receipt vision (**33**) |
| Tier check at start | Matrix definition (**43**) |

---

## Sources

- `build-guide/32-in-store-copilot/` (00–05)
- `brioela-specs/45-in-store-copilot.md`
- `_features/29-cooking-session/build.md` — MiraSession patterns
- `_features/42-bela/build.md` — shared constraint helper
- `_features/43-pricing-tiers/build.md` — entitlement
- `_records/build-order/29-layer-in-store-copilot.md`
