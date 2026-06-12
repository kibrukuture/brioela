# Status

open

**Menu scanning not shipped.** Build-guide **17** is complete (docs only). Zero production menu-scan API, parser, dish verdict pipeline, mobile dining UX, shared restaurant intelligence tables, or tests. Partial dependencies: `constraints` Brain schema (**07**), `log_memory_event` tool (**05**) — no menu caller. **25** `menu_scan` route exists only as draft stub.

# Shipped in backend (partial — dependencies only)

- [x] `constraints` Brain SQLite schema (**07** — dish evaluation needs new DO RPC)
- [x] `log_memory_event` tool (**05** — `menu_scanned` kind documented, no writer)
- [ ] `backend/src/api/menu-scans/` module
- [ ] `POST /api/menu-scans/photos`, `POST /api/menu-scans/url`
- [ ] `GET /api/menu-scans/:scanId`
- [ ] Menu Zod schemas in `shared/validator/`
- [ ] GPT-4o mini menu vision extraction
- [ ] Menu parser (`ParsedMenuDish[]`)
- [ ] Per-dish constraint evaluation (Brain DO)
- [ ] Per-dish condition evaluation (**23**)
- [ ] Waiter question generator
- [ ] Dish ranking + result UI
- [ ] Map/Ground overlay read
- [ ] Shared restaurant menu intelligence tables (Supabase)
- [ ] Menu fingerprint + contribution pipeline
- [ ] `memory_event` `menu_scanned`
- [ ] Offline partial mode (mobile)
- [ ] Luma entitlement gate (**43**)
- [ ] Mobile menu-scanning feature
- [ ] Mira `menu_language_bridge` scene
- [ ] **25** `menu_scan` route wiring to **26**
- [ ] Menu scanning tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `backend/src/api/menu-scans/` | `rg menu-scans backend` — zero |
| G2 | No menu scan Zod schemas | `rg menu.scan.schema shared/validator` — zero |
| G3 | No `POST /api/menu-scans/photos` | `01-input-capture.md` specifies; no handler |
| G4 | No `POST /api/menu-scans/url` / QR path | Same — zero |
| G5 | No menu vision extraction helper | `rg extract.menu.vision backend` — zero |
| G6 | No `enhance.image.helper.ts` | **24** G26 — shared with menu; neither shipped |
| G7 | No menu parser helper | `02-menu-gpt4o-mini-vision-and-parsing.md` — no `parse.menu` |
| G8 | No dish verdict evaluator | `03-dish-verdicts.md` — no implementation |
| G9 | No waiter question generator | `04-waiter-questions.md` — no implementation |
| G10 | No Brain DO dish constraint RPC | **07** has product check only — no dish text path |
| G11 | No Brain DO dish condition RPC | **23** product evaluation only — menu pass unbuilt |
| G12 | No `tools/menu-scan/` | `rg menu-scan tools` — zero |
| G13 | No shared restaurant intelligence Supabase schemas | `06-shared-menu-intelligence.md` SQL — not in drizzle |
| G14 | No menu fingerprint helper | `06` — not implemented |
| G15 | No shared intel contribution pipeline | Validation + abuse checks unbuilt |
| G16 | No `menu_scanned` memory event writer | `05-storage-offline-map.md` — no caller |
| G17 | No mobile menu-scanning feature | `rg menu-scanning mobile/features` — zero |
| G18 | No multi-page capture UI | `MenuCaptureDraft` type in spec only |
| G19 | No offline partial mode | Cached profile hook unbuilt |
| G20 | No map/Ground overlay read | **28**/**27** unshipped — no consumer |
| G21 | No Luma entitlement check on scan | **43** unshipped |
| G22 | No Mira `menu_language_bridge` scene | `30-mira/01-scene-contract.md` — type only in docs |
| G23 | **25** `menu_scan` route is no-op stub | `_features/25-recipe-ingestion/draft/route.shared.content.helper.gap.md` |
| G24 | Classifier may misroute menu photo shares | **25** image default → recipe; needs user choice |
| G25 | No personalized discovery (expected in **28**) | `07-personalized-restaurant-discovery.md` — downstream |
| G26 | No Menu Reality viral card (**51**) | `24-viral-sharing/04` — trigger unbuilt |
| G27 | No menu scanning tests | No `menu.scan*.test.ts` |
| G28 | `brioela-specs/27` stale vs build-guide 17 | Missing QR, shared intel, language bridge — prefer build-guide |
| G29 | Session log 017 "complete" misleading | Docs-only build-guide; no production code |
| G30 | Connections ledger missing `08-language-bridge.md` | `_records/connections/13` — incomplete file list |

# 26 vs neighbor boundaries

| In **26** (this feature) | In separate feature |
|---|---|
| Menu APIs + parser + dish verdicts | Share classifier — **25** |
| Vision extraction for menu pages | Product scan handlers — **24** |
| Dish constraint orchestration | Constraint matching — **07** |
| Dish condition orchestration | Condition rules — **23** |
| Waiter question generation | Mira live runtime — **29** / **30** |
| Shared menu intelligence write | Map API + ranking — **28** |
| Ground overlay read | Ground Find gate — **27** |
| `menu_scanned` memory event | Memory tool — **05** |
| Language bridge situation context | Mira speech engine — **30** |
| Entitlement hook surface | Pricing payment — **43** |

# Classifier handoff (critical)

| Step | Owner | Status |
|---|---|---|
| Share → classify `restaurant_menu` | **25** | Not shipped |
| Route `menu_scan` | **25** dispatcher | Draft stub only (G23) |
| Parse menu + dish verdicts | **26** | Not shipped |
| Log `shared_content_routed` | **25** | Not shipped |

**Rule:** Never run recipe normalization on `menu_scan` route.

# Blocked by

- 01-platform-foundation (API router, mobile feature shell)
- 04-brain-foundation (Brain DO — shipped)
- 07-brain-constraint-tools (matching logic — unwired; needs dish path)
- 23-medical-conditions (dish condition evaluation — unshipped)
- 24-scanner (vision helper reuse — unshipped)
- 25-recipe-ingestion (classifier handoff — unshipped)
- 43-pricing-tiers (Luma entitlement — unshipped)

# Blocks

- 28-map (personalized restaurant discovery consumes shared menu intel)
- 35-ambient-intelligence (pre-trip menu fit preload)
- 51-viral-sharing (Menu Reality card)
- 25-recipe-ingestion (complete `menu_scan` route target)

# Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `brioela-specs/27-restaurant-menu-scanning.md` | Simpler model; wrong medical spec ref (28 vs 23) — prefer build-guide 17 |
| `_records/connections/13-menu-scanning-connections.md` | Omits `08-language-bridge.md` |
| Session logs 017/018 "complete" | Build-guide docs only |
| `build-guide/17/07-personalized-restaurant-discovery.md` | Ranking UI lives in **28**, not **26** |
| No implementation ledger for menu scanning | Build from build-guide 17 only |

# Draft count

**20** files in `draft/` — 1 production snapshot (**07** boundary) + 18 gap/intended snapshots + `gap-index.md`.

# Sources

- `build-guide/17-menu-scanning/` (00–08)
- `brioela-specs/27-restaurant-menu-scanning.md`
- `build-guide/19-recipe-ingestion/08-shared-content-classifier.md`
- `build-guide/22-medical-conditions/05-recipe-meal-map-cooking.md`
- `_records/session-log/017-menu-scanning-complete.md`
- `_records/session-log/018-menu-scanning-community-intelligence-addendum.md`
- `_records/connections/13-menu-scanning-connections.md`
- `_records/build-order/15-layer-menu-scanning.md`
- `_features/25-recipe-ingestion/status.md`
- `_features/24-scanner/status.md`
- `_features/23-medical-conditions/status.md`
