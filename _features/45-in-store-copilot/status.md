# Status

open

**In-store co-pilot not shipped.** Build-guide **32-in-store-copilot** is complete (6 files, docs only). Zero `shop_visit` Brain tables, zero `/api/shop` routes, zero `in_store_copilot` Mira scene, zero context assembly, zero spend estimate helpers, zero scan-to-session push, zero mobile co-pilot feature, zero post-visit workflow. Partial: **43** tier matrix draft lists `in_store_copilot`; **33** receipt validator draft includes `source: shop_visit`; **42** draft documents shared constraint helper gap.

# Shipped in backend (partial / unrelated)

- [x] `build-guide/32-in-store-copilot/` — docs complete
- [x] `brioela-specs/45-in-store-copilot.md` — primary spec
- [x] `_records/connections/28-in-store-copilot-connections.md` — ledger
- [x] **43** `in_store_copilot` in `tier.entitlement.matrix` draft
- [ ] `MiraSession` DO class (**29** G1)
- [ ] `MiraSceneKind: in_store_copilot` (**30** G5)
- [ ] `shop_visit` / `shop_visit_event` Brain tables
- [ ] `assembleShopSessionContext` helper
- [ ] `buildInStoreCopilotMiraScene`
- [ ] `POST /api/shop/session` (+ events, end)
- [ ] Running spend estimate helper
- [ ] Speech policy / 3-intervention cap
- [ ] Scan verdict mid-session push (**24** integration)
- [ ] Shared `checkConstraintForOrder` warn path (**42** G4)
- [ ] Mesa audience slice read (**41**)
- [ ] Ground finds slice read (**27**)
- [ ] Shopping list sources (**34** G29)
- [ ] `purchase_price_event` read (**33** G10)
- [ ] Glucose spike triggers (**36**)
- [ ] Receipt `shop_visit` handoff (**33** G26)
- [ ] Post-visit Upstash workflow
- [ ] Mobile `features/in-store-copilot/`
- [ ] Tier gate at session start (**43**)
- [ ] Shop / co-pilot tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `backend/src/api/shop/` | `rg shop backend/src/api` — zero |
| G2 | No `shop_visit` Brain schema | `rg shop_visit backend/src/agents` — zero |
| G3 | No `shop_visit_event` Brain schema | spec 45 data model — not in migrations |
| G4 | No shop Zod validators | `rg shop.schema shared/validator` — zero |
| G5 | `MiraSceneKind` missing `in_store_copilot` | `30-mira/00-overview.md` enum — 7 kinds only |
| G6 | No `buildInStoreCopilotMiraScene` | `rg in_store_copilot backend/src` — zero |
| G7 | No `MiraSession` DO at all | **29** status — `rg MiraSession backend/src` zero |
| G8 | No `assembleShopSessionContext` | `02-context-payload.md` — not built |
| G9 | No shopping list read for visit | **34** G29 — meal plan + predictive unwired |
| G10 | No `purchase_price_event` read path | **33** unshipped — spend estimate blocked |
| G11 | No community `price_sighting` fallback | **28** unshipped |
| G12 | No Ground finds slice for store | **27** unshipped |
| G13 | No Mesa active audience in payload | **41** unshipped |
| G14 | No glucose spike trigger slice | **36** unshipped |
| G15 | No `estimateRunningSpend` helper | `04-spend-estimate.md` — not built |
| G16 | No swap evidence bar evaluator | `03-speech-rules-and-swaps.md` — not built |
| G17 | No speech intervention cap enforcer | spec 45 max 3 — no code |
| G18 | No `POST /api/shop/session` | spec 45 API — zero |
| G19 | No mid-session events endpoint | `POST /api/shop/session/events` — zero |
| G20 | No session end + workflow trigger | `POST /api/shop/session/end` — zero |
| G21 | No scan verdict push to active visit | **24** has no **45** hook |
| G22 | No shared `checkConstraintForOrder` | **42** G4 — Bela + **45** blocked |
| G23 | No warn-vs-block consequence split | spec 45 vs **42** table — not implemented |
| G24 | No offline degraded mode UX | `05-offline-degradation.md` — mobile missing |
| G25 | No receipt `source: shop_visit` wiring | **33** G26 — enum in draft only |
| G26 | No post-visit list reconciliation | `01-session-lifecycle.md` workflow — zero |
| G27 | No dislike signals from skipped items | behavioral discovery — unwired |
| G28 | No geofence end trigger | lifecycle spec — not built |
| G29 | No ambient store prompt | Ground geo signal — **27** unshipped |
| G30 | No mobile co-pilot feature folder | `rg in-store-copilot mobile/features` — zero |
| G31 | No scanner co-pilot start button | **24** mobile scanner unshipped |
| G32 | No `in_store_copilot` tier enforcement | **43** draft only |
| G33 | No voice allowance draw from cooking pool | spec 45 + **43** `checkUsageLimit` draft |
| G34 | **45** vs **42** scene conflation risk | Both on MiraSession — must stay separate kinds |
| G35 | Spec 45 "Chef/Power" vs **43** Culina/Viva | Tier naming conflict |
| G36 | Wrong feature folder `_features/47-in-store-copilot` | Duplicate number — use **45** |
| G37 | No shop visit tests | No `shop*.test.ts` |
| G38 | Session log 038 shop tools note | "When building begins" — not started |

# 45 vs neighbor boundaries

| In **45** (this feature) | In separate feature |
|---|---|
| Shop visit Mira audio session | MiraSession DO + Gemini bridge (**29**) |
| `in_store_copilot` scene + speech policy | `MiraScene` types (**30**) |
| Visit context payload assembly | Shopping list tables (**34**) |
| Running spend estimate | `purchase_price_event` writes (**33**) |
| Scan verdict push hook | Scan pipeline (**24**) |
| Constraint **warning** speech | Constraint **block** enforcement (**42**) |
| `bela_shopper` — **not** this feature | Bela order + shopper AI (**42**) |
| Mesa warning on scan | Mesa engine (**41**) |
| Ground find **relay** (read) | Ground submit + gate (**27**) |
| Community price fallback read | `price_sighting` schema (**28**) |
| Receipt checkout handoff trigger | Receipt vision ingest (**33**) |
| Culina tier gate | Entitlement matrix (**43**) |
| Geofence / ambient prompt signal | Ground geo contribution (**27**) |

# Critical boundary: **45** vs **42** Bela shopper

| | **42 `bela_shopper`** | **45 `in_store_copilot`** |
|---|---|---|
| Principal | Gig shopper | User |
| Constraints | Order snapshot — **blocks** | User + Mesa — **warns** |
| Video | Shopper continuous scan flow | Audio-only; discrete scans |
| Payment | Bela escrow | Out of scope |
| DO scope | Order / shopper session | `shop-{userId}-{visitId}` |

Shared: MiraSession runtime + constraint-check **implementation**. Not shared: scene kind, speech policy, block vs warn.

# Blocked by

- 29-cooking-session (MiraSession DO)
- 30-mira-speech-engine (`in_store_copilot` enum + types)
- 24-scanner (scan resolve + offline queue + push hook site)
- 07-brain-constraint-tools (constraint reads — partial)
- 33-receipt-intelligence (`purchase_price_event`, receipt handoff)
- 34-pantry-meal-plan (list sources + pantry resets)
- 27-ground (store finds + geo ambient)
- 28-map (place_id, price_sighting fallback)
- 36-wearables (glucose spike triggers)
- 41-mesa (active audience)
- 42-bela (shared `checkConstraintForOrder` — ships with Bela, **45** consumes)
- 43-pricing-tiers (`in_store_copilot` gate)

# Blocks

- None hard — habit metric feature
- Enriches **33** receipt reconciliation (listed items)
- Enriches **34** bought/skipped signals

# Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `_features/47-in-store-copilot/status.md` | Wrong feature number |
| `_features/__tmp_47-in-store-copilot/` | Temp residue |
| Spec 45 "Chef tier" | **43** uses Culina |
| `30-mira/00-overview.md` scene enum | Missing `in_store_copilot` |
| `12-brain-sub-agents/draft/mira.session.agent.gap.md` | Notes enum gap — still open |
| Mobile Schnl `card-controls` "in-store card" | Unrelated payment copy |
| `implementable-specs/bela/14` Gemini in BelaOrderAgent | Do not use for **45** architecture |

# Draft count

**18** files in `draft/` — 17 gap/intended snapshots + `gap-index.md`.

# Sources

- `build-guide/32-in-store-copilot/` (00–05)
- `brioela-specs/45-in-store-copilot.md`
- `build-guide/30-mira/00-overview.md`, `01-scene-contract.md`
- `build-guide/11-bela/14-shopper-ai-assistant.md`, `implementable-specs/bela/03-constraint-travel.md`
- `_records/connections/28-in-store-copilot-connections.md`
- `_records/build-order/29-layer-in-store-copilot.md`
- `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- `_features/24-scanner/status.md`
- `_features/29-cooking-session/status.md`
- `_features/30-mira-speech-engine/status.md`
- `_features/33-receipt-intelligence/status.md`
- `_features/34-pantry-meal-plan/status.md` (G29)
- `_features/42-bela/status.md`
- `_features/43-pricing-tiers/status.md`
