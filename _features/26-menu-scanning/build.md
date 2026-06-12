# Menu Scanning — Build

Feature **26**. Production paths under `backend/src/api/menu-scans/` (handlers, helpers, routes), `tools/menu-scan/` (Brain DO dish constraint/condition evaluation), `shared/drizzle/schema/` (restaurant menu intelligence tables), `shared/validator/` (menu Zod schemas), `shared/routes/` (menu route constants), and `mobile/features/menu-scanning/` (capture, ranked results, waiter question UI, language bridge entry).

**Scope:** Photo/URL/QR menu APIs, vision extraction, menu parser, per-dish verdict assembly, waiter questions, map/Ground overlay read, shared menu intelligence contribution, `menu_scanned` memory event, offline partial mode, Luma entitlement hook, mobile dining UX. **Not in 26 build:** share classifier (**25**), product scanner (**24**), map place API (**28**), Ground gate (**27**), constraint tools (**07**), condition profiles (**23**), Mira session DO (**29**/**30**), pricing payment (**43**), viral cards (**51**).

---

## Shipped today

| Area | Status |
|---|---|
| `constraints` Brain schema | ✓ (**07** — dish check reads via new DO RPC; tools unwired) |
| `log_memory_event` tool | ✓ (**05** — ready for `menu_scanned`) |
| Profile settings `menu-section-view.tsx` | ✓ unrelated — app settings menu, not restaurant scanning |
| `backend/src/api/menu-scans/` | ✗ |
| `tools/menu-scan/` | ✗ |
| `shared/validator/menu.scan.schema.ts` | ✗ |
| Supabase restaurant menu intelligence tables | ✗ |
| Mobile menu-scanning feature | ✗ |
| **25** `menu_scan` route target | ✗ stub only in draft |
| Tests | ✗ |

---

## File manifest

### Shared validator (26)

| File | Role |
|---|---|
| `shared/validator/menu.scan.schema.ts` | `MenuScanPhotosRequestSchema`, `MenuScanUrlRequestSchema`, `ParsedMenuDishSchema`, `MenuDishVerdictSchema`, `MenuScanResultSchema`, `WaiterQuestionSchema`, `MenuLanguageBridgeSchema` |
| `shared/routes/menu.routes.ts` | `MENU_SCAN_ROUTES`, `MENU_SCAN_PHOTOS`, `MENU_SCAN_URL`, `GET_MENU_SCAN` |

### Supabase Drizzle (26 — shared restaurant intelligence)

| File | Role |
|---|---|
| `shared/drizzle/schema/restaurant.menu.source.schema.ts` | `restaurant_menu_source` |
| `shared/drizzle/schema/restaurant.menu.version.schema.ts` | `restaurant_menu_version` |
| `shared/drizzle/schema/restaurant.menu.dish.schema.ts` | `restaurant_menu_dish` |
| `shared/drizzle/schema/restaurant.dish.signal.summary.schema.ts` | `restaurant_dish_signal_summary` |
| `shared/drizzle/schema/restaurant.fit.summary.schema.ts` | `restaurant_fit_summary` |
| `shared/drizzle/migrations/*` | Postgres migrations for above |

Optional session persistence (saved scans only):

| File | Role |
|---|---|
| `shared/drizzle/schema/menu.scan.session.schema.ts` | `menu_scan_sessions`, `menu_scan_dish_results` — if server-side session store chosen over client-only |

### Backend API — menu-scans module (26)

| File | Role |
|---|---|
| `backend/src/api/menu-scans/menu-scans.route.ts` | Hono mount |
| `backend/src/api/menu-scans/menu-scans.controller.ts` | Controller wiring |
| `backend/src/api/menu-scans/_handlers/create.menu.scan.photos.handler.ts` | `POST /api/menu-scans/photos` |
| `backend/src/api/menu-scans/_handlers/create.menu.scan.url.handler.ts` | `POST /api/menu-scans/url` |
| `backend/src/api/menu-scans/_handlers/get.menu.scan.handler.ts` | `GET /api/menu-scans/:scanId` |
| `backend/src/api/menu-scans/_handlers/index.ts` | Barrel |
| `backend/src/api/menu-scans/_helpers/extract.menu.vision.helper.ts` | Per-page GPT-4o mini vision |
| `backend/src/api/menu-scans/_helpers/fetch.menu.url.helper.ts` | HTTP fetch + visible text extract |
| `backend/src/api/menu-scans/_helpers/parse.menu.helper.ts` | LLM → `ParsedMenuDish[]` |
| `backend/src/api/menu-scans/_helpers/evaluate.dish.verdicts.helper.ts` | red/yellow/green rules + ranking |
| `backend/src/api/menu-scans/_helpers/generate.waiter.question.helper.ts` | Yellow dish scripts |
| `backend/src/api/menu-scans/_helpers/check.dish.constraints.helper.ts` | Brain DO RPC per dish |
| `backend/src/api/menu-scans/_helpers/check.dish.conditions.helper.ts` | **23** body — **26** calls |
| `backend/src/api/menu-scans/_helpers/get.place.menu.overlay.helper.ts` | Read **28**/**27** summarized context |
| `backend/src/api/menu-scans/_helpers/contribute.shared.menu.intelligence.helper.ts` | Validated public fact write |
| `backend/src/api/menu-scans/_helpers/compute.menu.fingerprint.helper.ts` | Menu version detection |
| `backend/src/api/menu-scans/_helpers/log.menu.scanned.helper.ts` | `memory_event` kind `menu_scanned` |
| `backend/src/api/menu-scans/_helpers/enhance.image.helper.ts` | Contrast pass — **shared with 24** (single implementation) |
| `backend/src/api/menu-scans/_helpers/check.menu.entitlement.helper.ts` | **43** Luma gate |
| `backend/src/api/menu-scans/_helpers/index.ts` | Barrel |
| `backend/src/api/menu-scans/index.ts` | Module export |

Register routes in backend app router (**01**).

### Brain DO — dish evaluation tools (07/23 body; 26 wires endpoints)

| File | Role | Owner |
|---|---|---|
| `tools/menu-scan/check-dish-constraint.ts` | Match dish text against constraints | **07** logic; **26** internal route |
| `tools/menu-scan/evaluate-dish-conditions.ts` | Condition rules on dish text | **23** logic; **26** internal route |
| `tools/menu-scan/index.ts` | Barrel | **26** |
| Brain fetch `POST /internal/evaluate-dish-constraints` | Per-dish constraint batch | **26** wires |
| Brain fetch `POST /internal/evaluate-dish-conditions` | Per-dish condition batch | **26** wires |

### **25** integration (consumer — not owned by **26**)

| File | Role |
|---|---|
| `backend/src/api/recipes/_helpers/route.shared.content.helper.ts` | `menu_scan` → enqueue/call **26** |
| Share extension / workflow | Passes URL or image to menu API |

### Mobile (26)

| File | Role |
|---|---|
| `mobile/features/menu-scanning/components/menu-capture.feature.tsx` | Camera + multi-page session |
| `mobile/features/menu-scanning/components/menu-results.feature.tsx` | Ranked green/yellow/red list |
| `mobile/features/menu-scanning/components/dish-detail.sheet.tsx` | Reason, matched constraints, secondary questions |
| `mobile/features/menu-scanning/components/waiter-question.large-text.tsx` | Show/copy question |
| `mobile/features/menu-scanning/components/menu-language-bridge.entry.tsx` | "Ask for me" → Mira scene |
| `mobile/features/menu-scanning/components/offline-partial.banner.tsx` | Offline honesty banner |
| `mobile/features/menu-scanning/hooks/use.menu.capture.hook.ts` | Multi-page draft state |
| `mobile/features/menu-scanning/hooks/use.menu.scan.hook.ts` | API submit + poll |
| `mobile/features/menu-scanning/hooks/use.cached.constraint.profile.hook.ts` | Offline partial mode |
| `mobile/network/menu-scans/create-menu-scan-photos.api.ts` | `POST /api/menu-scans/photos` |
| `mobile/network/menu-scans/create-menu-scan-url.api.ts` | `POST /api/menu-scans/url` |
| `mobile/network/menu-scans/get-menu-scan.api.ts` | `GET /api/menu-scans/:scanId` |

Scanner surface may expose mode toggle (product vs menu) — reuse camera infra from **24** without sharing endpoints.

### Mira scene package (29/30 owns runtime; 26 defines situation context)

| File | Role |
|---|---|
| `backend/src/agents/mira/scenes/menu-language-bridge.scene.ts` | `MiraSceneKind: menu_language_bridge` situation payload |
| `shared/validator/mira.menu-bridge.schema.ts` | Bilingual question + dish context types |

---

## Handler orchestration contract

Single-request flow (v1 — no Upstash required unless **25** async handoff):

1. Validate entitlement (**43**).
2. Normalize input (`MenuScanInput` from `01-input-capture.md`).
3. Extract text (vision per page parallel, or URL fetch).
4. Parse menu → `ParsedMenu`.
5. Load user profile slice via Brain (constraints + conditions) — one RPC or batch per dish evaluation inside DO.
6. For each dish: evaluate constraints + conditions → assign verdict → generate waiter question if yellow.
7. Rank dishes.
8. Attach place overlay if `restaurantId`.
9. Return `MenuScanResult` to client.
10. Fire-and-forget: shared intel contribution + `menu_scanned` memory event.

**Async variant (25 share route):** **25** workflow enqueues job; **26** exposes same pipeline with `scanId` polling — mirror `GET /api/recipes/import/:jobId` pattern.

---

## Acceptance criteria

### Capture API

- [ ] `POST /api/menu-scans/photos` accepts ordered `imagesBase64[]` with optional place fields
- [ ] `POST /api/menu-scans/url` accepts HTTP(S) URL with timeout/size limits
- [ ] QR path stores `qrPayload` and `resolvedUrl` separately
- [ ] Non-HTTP(S) URLs rejected
- [ ] Image-only/JS-only pages return clear fallback to photo capture

### Vision and parsing

- [ ] Server runs contrast enhancement before GPT-4o mini vision (**24** pattern)
- [ ] `minConfidence < 0.4` fails scan with retake guidance
- [ ] Multi-page: parallel per-page extraction; merge in page order
- [ ] Parser output validates against `ParsedMenuDishSchema`
- [ ] Parser never assigns safe/unsafe; empty dish list + `not_menu` for non-menu input
- [ ] No invented hidden ingredients

### Dish verdicts

- [ ] Unknown/sparse ingredient detail → yellow, not green
- [ ] Visible hard allergy in dish text → red
- [ ] Green copy avoids absolute safety language
- [ ] Community overlay cannot downgrade red to green
- [ ] **23** condition rules applied per dish (pregnancy, celiac, etc.)
- [ ] Ranking: green (best detail) → yellow → red; dislikes lower green rank only

### Waiter questions

- [ ] Every yellow dish has `primaryQuestion`
- [ ] Questions are dish-specific and constraint-specific — no generic "is this safe?"
- [ ] Medical watchlist questions name ingredients only
- [ ] Large-text UI for dim lighting

### Storage and privacy

- [ ] Raw extracted text not persisted after response unless user saves
- [ ] `menu_scanned` memory event has aggregate counts only — no raw menu
- [ ] Shared intel write strips private health data
- [ ] Shared contribution skipped when place match confidence too low

### Map and tier

- [ ] When `restaurantId` set, overlay includes summarized Ground/map context (**28**/**27** stubs OK initially)
- [ ] Luma entitlement checked before pipeline (**43**)
- [ ] Offline banner when partial mode active

### **25** integration

- [ ] Classifier `menu_scan` route invokes **26** API — not recipe normalizer
- [ ] Restaurant menu URL share → dish results within async job
- [ ] `shared_content_routed` logged without raw menu content

### Language bridge

- [ ] Translated overlay shows original + translated dish names
- [ ] "Ask for me" starts Mira `menu_language_bridge` scene with minimum disclosure
- [ ] Staff conversation summarized before order when hard constraint affected

### Tests

- [ ] Parser fixture tests (sample menu text → dish list)
- [ ] Verdict rule tests: red/yellow/green edge cases
- [ ] Waiter question generation fixtures
- [ ] Privacy: shared intel payload contains no user constraint values
- [ ] Handler integration test with mocked Brain RPC

---

## Cross-feature build order

1. **04** + **07** constraints schema (shipped)
2. **24** `enhance.image.helper.ts` (or **26** first — **24** imports shared)
3. **26** shared validators + menu-scans API skeleton
4. **07** dish constraint matching in Brain DO
5. **23** dish condition evaluation in Brain DO
6. **26** parser + verdict + waiter question helpers
7. **26** mobile capture + results UI
8. **25** wire `menu_scan` route to **26**
9. **28** place overlay read path
10. **43** Luma entitlement
11. **06** shared restaurant intelligence tables + contribution pipeline
12. **29**/**30** Mira language bridge scene
13. **51** Menu Reality card (optional)

---

## Sources

- `build-guide/17-menu-scanning/` (00–08)
- `brioela-specs/27-restaurant-menu-scanning.md`
- `build-guide/19-recipe-ingestion/08-shared-content-classifier.md`
- `build-guide/22-medical-conditions/05-recipe-meal-map-cooking.md`
- `build-guide/07-scanner/05-gpt4o-mini-vision-fallback.md`
- `build-guide/25-pricing-tiers/02-tier-entitlements.md`
- `build-guide/30-mira/01-scene-contract.md`
- `_features/24-scanner/build.md` (vision + RPC pattern)
- `_features/25-recipe-ingestion/build.md` (classifier handoff)
- `_features/23-medical-conditions/build.md` (condition evaluation)
