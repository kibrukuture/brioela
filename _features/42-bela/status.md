# Status

open

**Bela not shipped.** Build-guide **11-bela** complete (16 files, docs only). All **16** implementable-specs/bela files authored. Zero BelaOrderAgent DO, zero Supabase order tables, zero `tools/bela/`, zero Mira `bela_shopper` scene, zero mobile Bela/shopper features. Partial: `constraints` table + tools (**07**) — constraint snapshot source only; no `recipient_profiles`, no `cooking_intent` event kind.

# Shipped in backend (partial / unrelated)

- [x] `implementable-specs/bela/` (16 files) — product specs
- [x] `build-guide/11-bela/` (16 files) — docs complete per session 011
- [x] `_records/connections/06-bela-connections.md` — ledger
- [x] `_records/build-order/09-layer-bela.md` — layer marked complete (docs)
- [x] `_records/session-log/011-bela-complete.md` — payment model finalized (no wallet, no Issuing)
- [x] `constraints` table + constraint tools (**07**) — snapshot input only
- [ ] `ORDER_AGENT` wrangler binding + BelaOrderAgent class
- [ ] Supabase `orders` / `shoppers` / payment / dispute tables
- [ ] `order_constraint_snapshot` capture from Brain
- [ ] `checkConstraintForOrder` helper (shared **24**/**45**)
- [ ] Live scan `/scan-session` WebSocket relay
- [ ] PaymentIntent hold / capture / Connect transfer
- [ ] Shopper onboarding (Veriff, Connect, Bela card)
- [ ] Mira `bela_shopper` scene builder (**29**/**30**)
- [ ] Standing order scheduler + cycles
- [ ] Cooking intent trigger + `cooking_intent` memory kind
- [ ] `recipient_profiles` Brain table
- [ ] Smart routing adapter (**28**/**27**)
- [ ] Shopper Ground draft batch (**27** gate)
- [ ] Mobile `features/bela/` + `features/shopper/`
- [ ] Bela tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **Shopper AI architecture conflict unresolved in code** | `implementable-specs/bela/14` embeds Gemini in BelaOrderAgent; `build-guide/11-bela/14` + `30-mira/01` use MiraSession `bela_shopper` |
| G2 | No BelaOrderAgent DO | `rg BelaOrder backend/src` — zero |
| G3 | No `ORDER_AGENT` wrangler binding | `rg ORDER_AGENT backend/` — zero |
| G4 | No Supabase Bela migrations | `rg order_constraint_snapshot supabase/` — zero |
| G5 | No `shared/validator/bela/` | `rg bela.schema shared/validator` — zero |
| G6 | No `tools/bela/` directory | build `00-overview` lists tools — not in **19** registry |
| G7 | No `checkConstraintForOrder` | `03-constraint-travel.md` — not built; **45** blocked on same helper |
| G8 | No constraint snapshot Brain RPC | Snapshot write described; no handler |
| G9 | No live scan WebSocket relay | `04-live-scan-session.md` — not built |
| G10 | No PaymentIntent authorization flow | `05-escrow-payment.md` — no Stripe PI code |
| G11 | No auto-capture DO alarm | 10-minute timer — not built |
| G12 | No Bela card registration (SetupIntent) | `15-checkout-payment.md` shopper fields missing from schema |
| G13 | No store/door receipt scan handlers | `order_receipt_scans` table not migrated |
| G14 | No shopper onboarding API | Veriff/Connect — not built |
| G15 | No order dispatch / 90s accept window | `02-shopper-platform.md` — not built |
| G16 | No MiraSession `bela_shopper` scene | `rg bela_shopper backend/src` — zero |
| G17 | No `buildBelaShopperMiraScene` | **30** contract exists in docs only |
| G18 | No `recipient_profiles` Brain schema | `11-for-others.md` — table not in **04** migrations |
| G19 | No `family_links` Supabase table | `13-data-model.md` — not migrated |
| G20 | No standing order cron | `09-standing-order.md` — not built |
| G21 | No `cooking_intent` memory_event kind | `10-cooking-intent-trigger.md` § spec 01 gap |
| G22 | No cooking intent → order offer flow | Brain detection unwired |
| G23 | No smart routing helper | **28** `product_sighting` unshipped |
| G24 | No shopper Ground draft batch | **27** gate exists; **42** consumer missing |
| G25 | No dispute auto-resolution | `12-dispute-resolution.md` — not built |
| G26 | No shopper quality score job | `06-shopper-quality.md` — not built |
| G27 | No trust relationship dispatch | Priority 5-min window — not built |
| G28 | No Mesa order audience hook | **41** unshipped; `build.bela.mesa.constraints` missing |
| G29 | No pantry gap list generation | **34** unshipped |
| G30 | No receipt vision integration | **33** unshipped |
| G31 | No mobile Bela tab | `rg bela mobile/features` — zero |
| G32 | No mobile shopper mode | `rg shopper mobile/features` — zero |
| G33 | No order push notifications | **21** unwired to Bela lifecycle |
| G34 | No R2 upload for delivery/receipt photos | R2 paths in spec; no handlers |
| G35 | `wallet_transactions` stale refs | Removed in session 011 — grep legacy docs before implement |
| G36 | Session 011 "complete" is docs-only | Inventory marked `[x]` without production code |
| G37 | Bela first launch = one city | Policy in build `00-overview` — no geo gate code |
| G38 | Ethiopia Telebirr fallback | Mentioned in `15-checkout-payment.md` — not specified in build-guide |
| G39 | No Bela tests | No `bela*.test.ts` |
| G40 | Encore / Passport Bela hooks | **48**/**47** consumers blocked |

# 42 vs neighbor boundaries

| In **42** (this feature) | In separate feature |
|---|---|
| BelaOrderAgent + order tables | Brain DO routing — **04** |
| Constraint snapshot + order enforcement | Personal `constraints` tools — **07** |
| `recipient_profiles` | Mesa members — **41** |
| Mira `bela_shopper` scene builder | MiraSession DO + Gemini bridge — **29** |
| Speech policy for shopper scene | MiraSpeechDecisionEngine — **30** |
| Product scan during shop | Scanner pipeline — **24** |
| Receipt vision at checkout | Receipt intelligence — **33** |
| Pantry gap for lists | Inventory model — **34** |
| Ground find drafts from shoppers | Authenticity gate — **27** |
| Routing data reads | Map tables — **28** |
| Cooking session post-delivery link | Cooking runtime — **29** |
| Order push surfaces | Notification transport — **21** |

# Critical boundary: BelaOrderAgent vs MiraSession vs Brain

| | **BelaOrderAgent** | **MiraSession (`bela_shopper`)** | **BrioelaBrain** |
|---|---|---|---|
| **Key** | `order_id` | `bela_shopper:${sessionId}` or order-scoped | `userId` |
| **Lifetime** | Order active → completed | Shopping session | Permanent |
| **Owns** | State machine, scan WS, payment alarms | Gemini Live, A/V, proactive speech | Constraints, recipients, intent events |
| **Writes** | Supabase order_events, triggers capture | Transcript optional; no order state | Snapshot source, memory events |
| **Risk** | Embedding Gemini here duplicates **29** | Starting Mira without order context loses enforcement | Reading constraints per-scan instead of snapshot |

# Critical boundary: Supabase vs Brain vs BelaOrderAgent

| | **Supabase** | **Brain DO** | **BelaOrderAgent** |
|---|---|---|---|
| **Orders, shoppers, payments** | Authoritative shared | No | Cache + relay only |
| **User constraints** | Snapshot copy only | Authoritative live | Cached snapshot in memory |
| **Non-user recipients** | `recipient_profile_id` ref | `recipient_profiles` authoritative | Uses snapshot at order time |
| **Risk** | Treating DO as source of truth | Storing orders in Brain SQLite | Eviction without Supabase flush |

# Blocked by

- 01-platform-foundation (API, Supabase, Stripe)
- 03-platform-auth-onboarding (payment method, identity)
- 04-brain-foundation (Brain RPC, migrations)
- 07-brain-constraint-tools (snapshot source — partial ✓)
- 19-brain-tool-registry (Bela tools)
- 24-scanner (constraint + product resolution)
- 29-cooking-session (MiraSession DO)
- 30-mira-speech-engine (scene contract + engine)
- 27-ground (shopper find gate)
- 28-map (routing sightings)
- 33-receipt-intelligence (receipt scan)
- 34-pantry-meal-plan (list generation)
- 21-platform-notifications (order pushes)
- 41-mesa (order audience — soft)

# Blocks

- 41-mesa (Bela Mesa substitution warnings — partial)
- 45-in-store-copilot (shared constraint helper)
- 47-passport (`bela_shopper` passport kind)
- 48-encore (Bela order from sourcing handoff)

# Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `implementable-specs/bela/14-shopper-ai-assistant.md` § BelaOrderAgent `shopperGeminiWs` | Conflicts with build-guide MiraSession path — resolve before ship (G1) |
| `implementable-specs/bela/05-escrow-payment.md` title "Wallet" in older prose | Body says no wallet; session 011 finalized PaymentIntent model |
| `implementable-specs/bela/09-standing-order.md` "Wallet minimum" | Means payment method authorization failure — not a Brioela wallet |
| `_records/session-log/011-bela-complete.md` inventory `[x]` | Docs-only completion |
| `build-guide/11-bela/00-overview` "terminal feature" | Bela still depends on **29**/**30**/**24** — not independently shippable |
| `family_links` vs Mesa | Mesa is owner Brain DO; family links are Supabase account relationships — both can coexist |
| Charitable order example in `11-for-others` | Manual recipient notes vs future Mesa on recipient account |

# Draft count

**23** files in `draft/` — 22 gap/intended snapshots + `gap-index.md`.

# Sources

### Implementable specs (all 16 — read fully)

- `implementable-specs/bela/00-overview.md`
- `implementable-specs/bela/01-order-creation.md`
- `implementable-specs/bela/02-shopper-platform.md`
- `implementable-specs/bela/03-constraint-travel.md`
- `implementable-specs/bela/04-live-scan-session.md`
- `implementable-specs/bela/05-escrow-payment.md`
- `implementable-specs/bela/06-shopper-quality.md`
- `implementable-specs/bela/07-ground-contribution.md`
- `implementable-specs/bela/08-smart-routing.md`
- `implementable-specs/bela/09-standing-order.md`
- `implementable-specs/bela/10-cooking-intent-trigger.md`
- `implementable-specs/bela/11-for-others.md`
- `implementable-specs/bela/12-dispute-resolution.md`
- `implementable-specs/bela/13-data-model.md`
- `implementable-specs/bela/14-shopper-ai-assistant.md`
- `implementable-specs/bela/15-checkout-payment.md`

### Build guide (all 16 — read fully)

- `build-guide/11-bela/00-overview.md`
- `build-guide/11-bela/01-order-creation.md`
- `build-guide/11-bela/02-shopper-platform.md`
- `build-guide/11-bela/03-constraint-travel.md`
- `build-guide/11-bela/04-live-scan-session.md`
- `build-guide/11-bela/05-payment-and-escrow.md`
- `build-guide/11-bela/06-shopper-quality.md`
- `build-guide/11-bela/07-ground-contribution.md`
- `build-guide/11-bela/08-smart-routing.md`
- `build-guide/11-bela/09-standing-orders.md`
- `build-guide/11-bela/10-cooking-intent-trigger.md`
- `build-guide/11-bela/11-for-others.md`
- `build-guide/11-bela/12-dispute-resolution.md`
- `build-guide/11-bela/13-data-model.md`
- `build-guide/11-bela/14-shopper-ai-assistant.md`
- `build-guide/11-bela/15-checkout-payment.md`

### Cross-feature + ledgers

- `build-guide/30-mira/00-overview.md`, `01-scene-contract.md`
- `brioela-specs/41-mesa.md`, `43-passport.md`, `44-encore.md`, `45-in-store-copilot.md`
- `_records/connections/06-bela-connections.md`
- `_records/build-order/09-layer-bela.md`
- `_records/session-log/011-bela-complete.md`
- `_features/12-brain-sub-agents/spec.md`, `draft/bela.order.agent.gap.md`
- `_features/29-cooking-session/spec.md`
- `_features/30-mira-speech-engine/spec.md`
- `_features/27-ground/spec.md`
- `_features/28-map/spec.md`
- `_features/34-pantry-meal-plan/spec.md`
- `_features/41-mesa/spec.md`
