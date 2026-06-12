# Bela — Build

Feature **42**. Production paths under `backend/src/agents/bela/`, `backend/src/api/bela/`, `shared/validator/bela/`, `shared/routes/bela.routes.ts`, Supabase migrations for order tables, `mobile/features/bela/`, `mobile/features/shopper/`, and Mira scene builder `backend/src/agents/mira/_scenes/bela.shopper.scene.ts`. Order authoritative state in **Supabase** + **BelaOrderAgent** ephemeral DO. User dietary data in **Brain DO** (snapshot at order time).

**Scope:** BelaOrderAgent DO, order/shopper/payment/dispute Supabase schema, constraint snapshot + enforcement helper, live scan relay, shopper onboarding (KYC/Connect/Bela card), PaymentIntent lifecycle, standing orders, cooking intent handoff, order-for-others + `recipient_profiles`, smart routing adapter, Ground draft batch hook, Mira `bela_shopper` scene, mobile user + shopper modes, Bela API routes, Stripe webhooks. **Not in 42 build:** MiraSession DO class body (**29**), speech engine modules (**30**), scanner pipeline (**24**), Ground gate (**27**), map tables (**28**), pantry tables (**34**), Mesa engine (**41**), receipt classifier body (**33**), Encore UI (**48**).

---

## Shipped today

| Area | Status |
|---|---|
| `implementable-specs/bela/` (16 files) | ✓ specs |
| `build-guide/11-bela/` (16 files) | ✓ docs complete (session 011) |
| `_records/connections/06-bela-connections.md` | ✓ ledger |
| `_records/build-order/09-layer-bela.md` | ✓ ledger |
| `_records/session-log/011-bela-complete.md` | ✓ session log |
| `constraints` table + tools (**07**) | ✓ snapshot source only |
| BelaOrderAgent / ORDER_AGENT binding | ✗ |
| Supabase Bela tables | ✗ |
| `tools/bela/*` | ✗ |
| Mira `bela_shopper` scene | ✗ |
| Mobile `features/bela/` / `features/shopper/` | ✗ |
| Bela tests | ✗ |

**Zero Bela production code.** `rg 'bela|BelaOrder|ORDER_AGENT|order_constraint|shopper_scan' backend/src shared/ mobile/` — no matches.

---

## File manifest

### Infrastructure (**42**)

| File | Role |
|---|---|
| `backend/wrangler.toml` (or env-specific) | `ORDER_AGENT` Durable Object binding + migration |
| `backend/src/agents/bela/index.ts` | Export BelaOrderAgent |

### BelaOrderAgent DO (**42**)

| File | Role |
|---|---|
| `agents/bela/bela.order.agent.ts` | Agent class; state machine; WS routes |
| `agents/bela/_handlers/order.state.machine.handler.ts` | Valid transitions + Supabase flush |
| `agents/bela/_handlers/scan.session.handler.ts` | `/scan-session` user + shopper relay |
| `agents/bela/_handlers/shopper.session.orchestrator.handler.ts` | Start/stop Mira `bela_shopper` (**29** RPC) |
| `agents/bela/_handlers/auto.capture.alarm.handler.ts` | 10-minute door-scan timer |
| `agents/bela/_handlers/substitution.timeout.handler.ts` | 90s auto-approve |
| `agents/bela/_handlers/disconnect.replay.handler.ts` | Batch missed scan events on reconnect |
| `agents/bela/_state/bela.order.agent.state.ts` | In-memory state interface |
| `agents/bela/_helpers/load.constraint.snapshot.helper.ts` | Cache from Supabase |
| `agents/bela/_helpers/broadcast.scan.result.helper.ts` | Dual WS broadcast |
| `agents/bela/index.ts` | Barrel |

### Shared validator + routes (**42**)

| File | Role |
|---|---|
| `shared/validator/bela/order.schema.ts` | Order status, source_kind enums |
| `shared/validator/bela/order.item.schema.ts` | Item status, confidence |
| `shared/validator/bela/order.constraint.snapshot.schema.ts` | Snapshot JSON shape |
| `shared/validator/bela/shopper.schema.ts` | Shopper status, quality fields |
| `shared/validator/bela/standing.order.schema.ts` | Frequency, cycle status |
| `shared/validator/bela/dispute.schema.ts` | Dispute types + resolution |
| `shared/validator/bela/order.payment.event.schema.ts` | Ledger kind enum |
| `shared/validator/bela/order.receipt.scan.schema.ts` | Store vs door scan |
| `shared/validator/bela/recipient.profile.schema.ts` | Non-user recipient form |
| `shared/validator/bela/index.ts` | Barrel |
| `shared/routes/bela.routes.ts` | `BELA_ROUTES` constants |

### Supabase migrations (**42**)

| File | Role |
|---|---|
| `supabase/migrations/*_bela_shoppers.sql` | `shoppers` + Bela card fields |
| `supabase/migrations/*_bela_orders.sql` | `orders`, `order_items` |
| `supabase/migrations/*_bela_order_events.sql` | `order_events` |
| `supabase/migrations/*_bela_order_constraint_snapshot.sql` | Snapshot table |
| `supabase/migrations/*_bela_standing_orders.sql` | `standing_orders`, `standing_order_cycles` |
| `supabase/migrations/*_bela_disputes.sql` | `disputes` |
| `supabase/migrations/*_bela_payment_ledger.sql` | `order_payment_events` |
| `supabase/migrations/*_bela_shopper_scan_log.sql` | `shopper_scan_log` |
| `supabase/migrations/*_bela_family_links.sql` | `family_links` |
| `supabase/migrations/*_bela_order_receipt_scans.sql` | `order_receipt_scans` |

### Brain SQLite — recipient profiles (**42**)

| File | Role |
|---|---|
| `_schemas/recipient.profile.schema.ts` | `recipient_profiles` in Brain DO |
| `_handlers/bela/snapshot.constraints.for.order.handler.ts` | Brain RPC: constraints → snapshot JSON |
| `_handlers/bela/list.recipient.profiles.handler.ts` | CRUD for non-user recipients |
| `_handlers/bela/record.cooking.intent.handler.ts` | `cooking_intent` memory_event write |
| `_helpers/bela/build.proposed.order.list.helper.ts` | Pantry gap + recipe + standing inputs |
| `_helpers/bela/merge.mesa.into.snapshot.helper.ts` | **41** adapter when entitled |

### Brain / platform tools — `tools/bela/` (**42**)

| File | Role |
|---|---|
| `tools/bela/check.constraint.for.order.tool.ts` | Scan-time enforcement (wraps helper) |
| `tools/bela/propose.bela.order.tool.ts` | AI list → user approval surface |
| `tools/bela/release.escrow.tool.ts` | Capture PaymentIntent |
| `tools/bela/connect.transfer.tool.ts` | Shopper payout |
| `tools/bela/index.ts` | Barrel → **19** registry |

### Constraint enforcement (**42** + **24** shared)

| File | Role |
|---|---|
| `_helpers/bela/check.constraint.for.order.helper.ts` | `normalizedMatch`, hard/soft logic |
| `_helpers/bela/resolve.order.item.match.helper.ts` | exact / category / no match |
| `_helpers/scanner/run.constraint.check.helper.ts` | **24** shared entry (also **45**) |

### Order API — `backend/src/api/bela/` (**42**)

| File | Role |
|---|---|
| `api/bela/bela.route.ts` | Hono mount |
| `api/bela/bela.controller.ts` | Wiring |
| `api/bela/_handlers/post.create.order.handler.ts` | Place order + snapshot |
| `api/bela/_handlers/post.cancel.order.handler.ts` | Pre-shopping cancel |
| `api/bela/_handlers/get.order.handler.ts` | Order + items + events |
| `api/bela/_handlers/post.shopper.accept.order.handler.ts` | Accept → spawn BelaOrderAgent |
| `api/bela/_handlers/post.shopper.decline.order.handler.ts` | Decline dispatch |
| `api/bela/_handlers/post.shopper.start.shopping.handler.ts` | `shopping` + Mira start |
| `api/bela/_handlers/post.shopper.complete.shopping.handler.ts` | End scan session |
| `api/bela/_handlers/post.shopper.receipt.scan.handler.ts` | Store + door scans |
| `api/bela/_handlers/post.user.confirm.delivery.handler.ts` | Capture trigger |
| `api/bela/_handlers/post.user.dispute.handler.ts` | Open dispute |
| `api/bela/_handlers/post.standing.order.handler.ts` | Create/update standing |
| `api/bela/_handlers/post.family.link.handler.ts` | Family link request/accept |
| `api/bela/_handlers/get.shopper.pending.orders.handler.ts` | Dispatch pool |
| `api/bela/index.ts` | Module export |

### Shopper onboarding API (**42**)

| File | Role |
|---|---|
| `api/bela/_handlers/post.shopper.apply.handler.ts` | Application |
| `api/bela/_handlers/post.shopper.veriff.callback.handler.ts` | KYC webhook |
| `api/bela/_handlers/post.shopper.connect.onboard.handler.ts` | Stripe Connect link |
| `api/bela/_handlers/post.shopper.register.bela.card.handler.ts` | SetupIntent complete |
| `api/bela/_handlers/patch.shopper.availability.handler.ts` | Toggle available |

### Payment + Stripe (**42**)

| File | Role |
|---|---|
| `_helpers/bela/create.payment.intent.hold.helper.ts` | Authorization at accept |
| `_helpers/bela/increment.authorization.helper.ts` | Receipt overflow |
| `_helpers/bela/capture.and.transfer.helper.ts` | Capture + Connect |
| `_helpers/bela/append.payment.event.helper.ts` | `order_payment_events` row |
| `api/bela/_handlers/post.stripe.webhook.handler.ts` | Connect + PI events |

### Standing orders + schedulers (**42**)

| File | Role |
|---|---|
| `_handlers/bela/generate.standing.cycle.handler.ts` | Day-before list AI |
| `_handlers/bela/dispatch.standing.cycle.handler.ts` | Confirm → place order |
| `_handlers/bela/skip.standing.cycle.handler.ts` | User skip |
| `_jobs/bela/standing.order.cron.ts` | Cycle trigger (Workers cron or queue) |

### Smart routing (**42** adapter; data **27**/**28**)

| File | Role |
|---|---|
| `_helpers/bela/compute.smart.route.helper.ts` | Multi-stop assignment |
| `_helpers/bela/score.item.location.helper.ts` | availability × price × quality |
| `_helpers/bela/build.routing.summary.helper.ts` | User-facing transparency copy |

### Ground shopper drafts (**42** → **27**)

| File | Role |
|---|---|
| `_helpers/bela/draft.ground.finds.from.session.helper.ts` | Price/availability/new product |
| `_handlers/bela/submit.shopper.ground.batch.handler.ts` | Post-session Share all → gate |

### Disputes (**42**)

| File | Role |
|---|---|
| `_handlers/bela/auto.resolve.dispute.handler.ts` | Scan log evidence rules |
| `_handlers/bela/escalate.dispute.manual.handler.ts` | Ops queue |
| `_helpers/bela/compute.shopper.quality.delta.helper.ts` | Post-resolution score |

### Cooking intent (**42** + **29**)

| File | Role |
|---|---|
| `_helpers/bela/detect.cooking.intent.helper.ts` | Brain pattern extraction |
| `_helpers/bela/recipe.gap.check.helper.ts` | Missing ingredients list |
| `_handlers/bela/offer.cooking.intent.order.handler.ts` | Notification + pre-filled order |

### Mira bela_shopper scene (**42** + **29**/**30**)

| File | Role |
|---|---|
| `agents/mira/_scenes/build.bela.shopper.mira.scene.ts` | `MiraScene` for `bela_shopper` |
| `agents/mira/_scenes/bela.shopper.system.instruction.ts` | Order + snapshot + Ground blocks |
| `agents/mira/_scenes/bela.shopper.speech.policy.ts` | Shopper-only audience policy (**30** types) |

### Mobile — user Bela (**42**)

| File | Role |
|---|---|
| `mobile/features/bela/screens/bela.home.screen.tsx` | Tab home |
| `mobile/features/bela/screens/order.create.screen.tsx` | List + window + address |
| `mobile/features/bela/screens/order.tracking.screen.tsx` | Status + live scan entry |
| `mobile/features/bela/screens/live.scan.session.screen.tsx` | User scan-together view |
| `mobile/features/bela/screens/standing.order.setup.screen.tsx` | Recurring config |
| `mobile/features/bela/screens/order.for.others.screen.tsx` | Recipient picker |
| `mobile/features/bela/components/scan.result.card.tsx` | Live session card |
| `mobile/features/bela/components/delivery.confirm.sheet.tsx` | 10-minute timer UI |
| `mobile/features/bela/hooks/use.active.order.hook.ts` | Order poll + WS |
| `mobile/network/bela/bela.api.ts` | REST client |

### Mobile — shopper mode (**42**)

| File | Role |
|---|---|
| `mobile/features/shopper/screens/shopper.home.screen.tsx` | Availability + earnings |
| `mobile/features/shopper/screens/shopper.order.detail.screen.tsx` | Accept + route |
| `mobile/features/shopper/screens/shopper.shopping.screen.tsx` | List + scanner + Mira |
| `mobile/features/shopper/screens/shopper.delivery.screen.tsx` | Photo + door scan |
| `mobile/features/shopper/screens/shopper.onboarding.screen.tsx` | KYC + Connect + card |
| `mobile/features/shopper/screens/shopper.ground.batch.screen.tsx` | Post-session finds |
| `mobile/features/shopper/hooks/use.scan.session.ws.hook.ts` | BelaOrderAgent WS |
| `mobile/features/shopper/hooks/use.shopper.mira.session.hook.ts` | Mira join for bela_shopper |

### Tests (**42**)

| File | Role |
|---|---|
| `agents/bela/_helpers/check.constraint.for.order.test.ts` | Hard block + synonym |
| `agents/bela/_handlers/order.state.machine.test.ts` | Transition guards |
| `api/bela/auto.resolve.dispute.test.ts` | Evidence rules |
| `_helpers/bela/compute.smart.route.test.ts` | Two-stop threshold |

---

## Acceptance criteria

### BelaOrderAgent DO

- [ ] `env.ORDER_AGENT.idFromName(orderId)` — one DO per active order.
- [ ] Created on shopper accept; flushed to Supabase before evict; recoverable from `order_events` on cold start.
- [ ] `/scan-session` rejects third-party tokens; shopper + user roles verified.
- [ ] Scan broadcast < 200ms p95 in integration test (mock WS).
- [ ] Auto-capture alarm fires 10 minutes after door receipt scan if user silent.
- [ ] **No** embedded Gemini WebSocket in BelaOrderAgent — MiraSession owns Live transport (conflict resolution).

### Order lifecycle

- [ ] `pending` → no PaymentIntent.
- [ ] `accepted` → auth hold + BelaOrderAgent + `order_events`.
- [ ] `shopping` → live session available; Mira `bela_shopper` startable.
- [ ] Invalid transitions rejected (e.g. cancel during `shopping`).
- [ ] 15 min / 60 min dispatch retry behavior per `01-order-creation`.

### Constraint snapshot + enforcement

- [ ] Snapshot written at place order from Brain `constraints` (+ Mesa when **41** entitled).
- [ ] Snapshot frozen — post-order constraint edits do not affect in-flight order.
- [ ] Hard blocks: no shopper override UI.
- [ ] User override only from user live session → `user_override` event.
- [ ] `checkConstraintForOrder` shared by Bela shopper scan and **45** co-pilot.
- [ ] Unresolved product requires manual check before add.

### Payment

- [ ] No wallet tables; no Stripe Issuing.
- [ ] PaymentIntent `capture_method: 'manual'` at accept.
- [ ] `incrementAuthorization` before shopper leaves store when receipt exceeds buffer.
- [ ] Bela card last-4 mismatch blocks advance to delivery.
- [ ] Capture amount = actual grocery + fees from receipt.
- [ ] Connect transfer on capture; tip separate PI 100% to shopper.
- [ ] All events in `order_payment_events` append-only.

### Shopper platform

- [ ] Veriff KYC + background check gates before `active`.
- [ ] Stripe Connect Express `account_id` stored; no raw bank data.
- [ ] Bela card registered via SetupIntent; fingerprint dedup vs personal card.
- [ ] 90s accept window; decline does not hurt quality score.
- [ ] Automatic suspension rules from `06-shopper-quality`.

### Live scan + Mira

- [ ] User passive banner when not watching; full history on reconnect.
- [ ] Substitution auto-accept 90s; user reject sends shopper message.
- [ ] Mira `bela_shopper`: order list + snapshot in system instruction only.
- [ ] User cannot hear shopper Mira audio channel.
- [ ] Proactive speech uses **30** suppression (5s / 30s cooldowns).

### Standing orders + cooking intent

- [ ] 3-hour approval window; auto-confirm configurable.
- [ ] Budget cap trims with priority scoring; user sees dropped items.
- [ ] Cooking intent never auto-places — explicit user tap required.
- [ ] `source_kind` + `source_ref` populated; post-delivery cooking prompt when linked.

### Order for others

- [ ] Brioela recipient uses recipient constraints, not sender's.
- [ ] `recipient_profiles` in sender Brain DO only for non-users.
- [ ] `family_links` requires mutual accept.

### Disputes

- [ ] 30-minute window from confirm/auto-confirm.
- [ ] Constraint violation → auto full refund + shopper suspended pending review.
- [ ] Delivery photo attached to fraud checks.

### Ground + routing

- [ ] Shopper Ground opt-in recorded; drafts pass **27** gate with `source: bela_shopper`.
- [ ] No order/user identity in find text.
- [ ] Routing uses **28** sightings + **27** signals; max 2 stops; maps deep link only.

### Integration hooks

- [ ] **24** scanner helper invoked for product resolution path.
- [ ] **33** receipt vision for store scan fallback.
- [ ] **34** pantry model read for list generation (stub OK until **34** ships).
- [ ] **41** Mesa warnings on order when audience not `just_me`.
- [ ] **21** push for order lifecycle events.

### Tests

- [ ] Constraint check: sesame partial match, boycott brand, soft guidance.
- [ ] State machine illegal transition rejected.
- [ ] Dispute auto-resolve: missing item with scan log negative.

---

## Build order dependencies

1. **01-platform-foundation** — Hono router, Supabase client, Stripe SDK.
2. **03-platform-auth-onboarding** — user identity, payment method on file.
3. **04-brain-foundation** — Brain RPC, SQLite migrations for `recipient_profiles`.
4. **07-brain-constraint-tools** — constraint read for snapshot.
5. **19-brain-tool-registry** — register `tools/bela/*`.
6. **24-scanner** — product resolution + constraint check pipeline.
7. **29-cooking-session** — MiraSession DO + start/stop RPC.
8. **30-mira-speech-engine** — `MiraScene` types + speech engine for proactive shopper prompts.
9. **27-ground** — authenticity gate for shopper finds.
10. **28-map** — `product_sighting` for routing.
11. **33-receipt-intelligence** — receipt vision extraction.
12. **34-pantry-meal-plan** — pantry gap for list generation.
13. **21-platform-notifications** — order push surfaces.
14. **41-mesa** — Food Audience on orders (soft — can stub).

**Soft depends:** **48-encore**, **47-passport**, **45-in-store-copilot**, **43-pricing-tiers** (Bela tiering TBD).

**Blocks:** Encore sourcing handoff (**48**), Passport `bela_shopper` (**47**), Mesa order warnings (**41** partial).

---

## Draft count

**23** files in `draft/` — 22 gap/intended snapshots + `gap-index.md`.
