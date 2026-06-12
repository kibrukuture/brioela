# Menu Scanning — Spec

Feature **26**. Restaurant menu intake (photo, multi-page photo, QR/URL, share-sheet handoff from **25**), GPT-4o mini vision extraction + structured dish parsing, per-dish green/yellow/red verdicts against the user's Brain constraint profile and **23** medical condition rules, ranked dish UI, exact waiter questions, optional map/Ground overlay (**28** / **27**), privacy-filtered shared menu intelligence, and Mira `menu_language_bridge` scene for bilingual staff handoff (**29** / **30**).

**Not in this feature:** Share-sheet classifier and route dispatcher at intake (**25** — routes `menu_scan` here); product barcode/UPC scan (**24** — reuses vision enhancement only); healthy food map place identity and nearby ranking API (**28**); Ground Finds auth gate (**27**); constraint propose/confirm tools (**07** — matching logic); medical condition profile storage and rule config (**23**); recipe normalization and `writeUserRecipe` (**08** / **25**); pricing tier payment mechanics (**43** — entitlement gate only); viral Menu Reality cards (**51**); personalized discovery ranking at map scale (**28** consumes **26** shared intelligence); ambient pre-trip preload orchestration (**35**).

---

## Purpose

Someone with allergies, dietary identity, or medical food watchlists eats at a restaurant → photographs the menu (or scans a QR / shares a menu URL) → within ~3 seconds sees which dishes are likely OK, which need a waiter question, and which to avoid — filtered through their full private food profile without manual setup.

1. **Capture** menu via camera, multi-page session, QR resolution, URL fetch, or **25** share route.
2. **Extract** menu text with GPT-4o mini vision (photos) or HTTP text extraction (URLs).
3. **Parse** into structured dishes — names, descriptions, listed ingredients, cooking methods — without inventing hidden ingredients.
4. **Evaluate** each dish against Brain constraints (**07**) and condition rules (**23**).
5. **Generate** exact waiter questions for yellow dishes (**04-waiter-questions**).
6. **Rank** dishes for practical ordering; overlay map/Ground context when `restaurantId` known (**28** / **27**).
7. **Contribute** validated public menu facts to shared restaurant intelligence (**06**) — never private health profiles.
8. **Escalate** to Mira `menu_language_bridge` when user asks Brioela to speak to staff (**08-language-bridge**).

Without **26**, `menu_scan` routes from **25** have no parser, no dish verdict API, and no restaurant dining UX.

---

## Complete pipeline inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/17-menu-scanning/`, `brioela-specs/27-restaurant-menu-scanning.md`, `backend/src/api/`, `mobile/`, neighbor `_features/07`, `23`, `24`, `25`, `28`, `29`, `30`.

| Component | Type | In **26**? | Shipped? | Owner / trigger | Primary sources |
|---|---|:---:|:---:|---|---|
| **Camera menu capture** | Mobile | **Yes** | No | Scanner-adjacent surface, own session | `01-input-capture.md` |
| **Multi-page capture draft** | Mobile local state | **Yes** | No | User adds pages → analyze | `01-input-capture.md` |
| **QR menu resolution** | Mobile + backend | **Yes** | No | Table QR → URL → parser | `01-input-capture.md` |
| **`POST /api/menu-scans/photos`** | Hono handler | **Yes** | No | Photo / multi-page submit | `01-input-capture.md` |
| **`POST /api/menu-scans/url`** | Hono handler | **Yes** | No | URL / QR-resolved menu | `01-input-capture.md` |
| **`GET /api/menu-scans/:scanId`** | Hono handler | **Yes** | No | Poll / replay session result | `05-storage-offline-map.md` |
| **Share-sheet `menu_scan` route** | **25** dispatcher | Consumer | No | Classifier → enqueue menu job | `19-recipe-ingestion/08-shared-content-classifier.md` |
| **GPT-4o mini vision extraction** | Backend + AI | **Yes** | No | Per-page menu OCR | `02-menu-gpt4o-mini-vision-and-parsing.md` |
| **`enhanceForVisionExtraction`** | Backend helper | Shared **24**/**26** | No | Contrast pass before vision | `07-scanner/05-gpt4o-mini-vision-fallback.md` |
| **Menu text parser (LLM + Zod)** | Backend | **Yes** | No | `ParsedMenuDish[]` | `02-menu-gpt4o-mini-vision-and-parsing.md` |
| **Dish constraint evaluation** | Backend → Brain RPC | **Yes** orchestration | No | Text/ingredient match per dish | `03-dish-verdicts.md`, **07** |
| **Dish condition evaluation** | Backend → **23** RPC | **23** body, **26** calls | No | Medical watchlists per dish | `22-medical-conditions/05-recipe-meal-map-cooking.md` |
| **Verdict assembler + ranker** | Backend | **Yes** | No | green/yellow/red + sort | `03-dish-verdicts.md` |
| **Waiter question generator** | Backend | **Yes** | No | Yellow dishes only | `04-waiter-questions.md` |
| **Map/Ground place overlay** | Read-only consumer | **Yes** display | No | Summarized place context | `05-storage-offline-map.md`, **28**, **27** |
| **Shared menu intelligence write** | Supabase Postgres | **Yes** | No | Validated public facts | `06-shared-menu-intelligence.md` |
| **Menu fingerprint + versioning** | Backend | **Yes** | No | Detect menu changes | `06-shared-menu-intelligence.md` |
| **Personalized discovery scoring** | **28** consumer | **No** — downstream | No | Uses shared intel + user profile | `07-personalized-restaurant-discovery.md` |
| **`memory_event` `menu_scanned`** | Brain write | **Yes** | No | Aggregate counts only — no raw menu | `05-storage-offline-map.md` |
| **Offline partial mode** | Mobile + cached profile | **Yes** | No | Local match when text available | `05-storage-offline-map.md` |
| **Menu result UI** | Mobile | **Yes** | No | Ranked dishes, warnings, copy question | `03`, `04`, design `13-evidence-first-ui` |
| **Language bridge overlay** | Mobile | **Yes** | No | Translated menu + bilingual questions | `08-language-bridge.md` |
| **Mira `menu_language_bridge` scene** | **29**/**30** runtime | Escalation | No | Live staff conversation | `30-mira/01-scene-contract.md` |
| **Luma tier entitlement gate** | **43** check | Consumer | No | Menu scan = Luma feature | `25-pricing-tiers/02-tier-entitlements.md` |
| **Menu Reality share card** | **51** | Consumer | No | Privacy-scrubbed card | `24-viral-sharing/04-feature-specific-card-types.md` |

### Shipped in repo today (menu-related)

- `constraints` Brain SQLite schema (**07**) — dish evaluation will read via new DO RPC; tools unwired.
- `log_memory_event` tool (**05**) — can write `menu_scanned` when scanner ships.
- **No** `backend/src/api/menu-scans/`, **no** menu Zod schemas, **no** shared restaurant intelligence tables.
- **No** mobile menu-scanning feature folder; profile `menu-section-view.tsx` is settings UI only.
- **No** menu scanning tests.

---

## Architecture — menu to dish verdicts

```text
Entry paths
  ├── Camera / multi-page photo ──► POST /api/menu-scans/photos
  ├── QR / menu URL ─────────────► POST /api/menu-scans/url
  └── Share sheet (25) ──────────► classifier menu_scan ──► same API / async job
        │
        ▼
Optional: Luma entitlement check (43) — before upload if policy requires
        │
        ▼
Vision path (photos)                    URL path
  enhanceForVisionExtraction (24/26)      HTTP fetch + visible text extract
  GPT-4o mini per page (parallel)         same parser input
        │
        ▼
Merge pages → combined menu text
        │
        ▼
Menu parser (standard text LLM + Zod) → ParsedMenuDish[]
        │
        ├── For each dish (deterministic, parallelizable):
        │     ├── Brain POST /internal/evaluate-dish-constraints  [07 body]
        │     ├── Brain POST /internal/evaluate-dish-conditions   [23 body]
        │     └── apply red/yellow/green rules (03-dish-verdicts)
        │
        ├── Generate waiter questions for yellow (04)
        ├── Rank dish list (03)
        ├── Optional map/Ground overlay if restaurantId (28/27 read)
        │
        ├── Async: contribute shared menu intelligence (06) — privacy filtered
        └── Brain memory_event kind menu_scanned (aggregate only)
        │
        ▼
Mobile ranked menu UI
        │
        └── User action → Mira menu_language_bridge scene (29/30)
```

**Latency target:** under 3 seconds photo → visible results for a typical single-page menu (`02`, `brioela-specs/27`).

**Processing model:** one-shot structured extraction + deterministic verdict code — **not** Gemini Live (`00-overview`, session log 017).

---

## Entry and capture contract

Four first-class entry paths (`01-input-capture.md`):

| Path | `source` value | API |
|---|---|---|
| Single photo | `photo` | `POST /api/menu-scans/photos` |
| Multi-page photo | `multi_page_photo` | same — ordered `imagePages[]` |
| Digital menu URL | `url` | `POST /api/menu-scans/url` |
| QR-resolved URL | `qr_url` | `POST /api/menu-scans/url` with `qrPayload` |

Request shape:

```typescript
type MenuScanPhotosRequest = {
  imagesBase64: string[]
  restaurantId?: string | null
  placeName?: string | null
  geoHash?: string | null
  capturedAt: number
}

type MenuScanUrlRequest = {
  url: string
  qrPayload?: string
  restaurantId?: string | null
  placeName?: string | null
  geoHash?: string | null
  capturedAt: number
}
```

Rules:

- Place association optional — scan useful without map context.
- Multi-page: preserve order; backend merges text sections; no on-device stitch.
- QR: validate URL; follow redirects within limits; never unrestricted webview.
- Low-light: server contrast enhancement + warnings (`low_light`, `glare`, `partial_page`, `text_too_small`).
- `minConfidence < 0.4` on vision → fail and ask retake; partial pages only with explicit UI warning.

---

## Vision and parsing contract

Reuses from **24** (`02`, `07-scanner/05`):

- GPT-4o mini vision with Zod-enforced output.
- `enhanceForVisionExtraction` before model call.
- JPEG upload conventions.

Does **not** reuse: barcode resolution, Open Food Facts, product cache, product verdict assembly.

Parser output (`ParsedMenuDish`):

- Extract only what menu text supports — empty arrays / null when unknown.
- Do not infer allergens from cuisine alone.
- Do not assign safe/unsafe in parser — verdicts are post-parse.
- Non-menu input → empty dish list + reason `not_menu`.

---

## Dish verdict contract

Profile source: Brain DO active constraints + **23** active medical conditions — not re-derived per scan.

| Verdict | Internal | Meaning |
|---|---|---|
| Green | `safe` | No visible conflict; enough detail to be useful |
| Yellow | `caution` | Missing detail, shared-prep risk, soft conflict, low confidence — **always** includes waiter question |
| Red | `avoid` | Visible hard allergy, dietary identity, or medical watchlist conflict |

**Critical safety rules** (session log 017, `03-dish-verdicts.md`):

- Unknown ingredients → **yellow**, never green.
- Red requires visible menu evidence or deterministic synonym mapping — not cuisine inference.
- Green copy: "No visible conflict found." — never "safe for you" or "allergy-safe."
- Community notes can add yellow context; **cannot** override visible red allergen evidence.
- Ranking never changes verdict severity.

Condition integration (`22-medical-conditions/05-recipe-meal-map-cooking.md`):

- Pregnancy: raw fish, unpasteurized cheese → red/yellow per rule.
- Celiac: wheat/gluten/shared fryer uncertainty → red/yellow.
- Hypertension / diabetes: descriptive sodium/sugar signals → yellow or rank lower.
- Waiter scripts ask about **ingredients/preparation** — never medical advice to staff.

---

## Waiter question contract

Every yellow dish returns one primary question (`04-waiter-questions.md`):

```text
I'm allergic to [X]. Does [dish name] contain [X], or is it prepared in contact with [X]?
```

Question types: `contains`, `shared_prep`, `hidden_component`, `cooking_method`.

Medical watchlist scripts name ingredient classes (e.g. grapefruit) — not medication interactions.

Large-text display for dim restaurant lighting; copy/show target on card.

---

## Storage and privacy

**Transient by default** (`05-storage-offline-map.md`, `brioela-specs/27`):

- Raw extracted menu text discarded after processing unless user explicitly saves.
- Session results may live in client memory or short-lived server session.
- Saved scans: `MenuScan` + `MenuScanResult` rows per spec data model.

**Memory event** (`menu_scanned`):

- Allowed: `restaurantId`, `placeName`, `source`, `dishCount`, green/yellow/red counts, `saved` flag, `resolvedUrlHash`.
- Forbidden by default: raw menu text, full descriptions, waiter questions, health profile.

**Shared intelligence** (`06-shared-menu-intelligence.md`):

- Public: dish names, sections, prices, aggregate risk tags, menu fingerprints.
- Never: user allergies, personalized verdicts, private waiter conversations.

---

## Map, Ground, and discovery boundaries

| Layer | Feature | **26** role |
|---|---|---|
| Place identity | **28** | Optional `restaurantId` on scan; read overlay |
| Community Finds | **27** | Summarized signals in overlay — not auth gate |
| Shared menu tables | **26** writes | **28** reads for ranking |
| Personalized discovery | **28** + **26** intel | `07-personalized-restaurant-discovery.md` — not built in **26** UI |
| Pre-trip preload | **35** | May cache menu intel — verdicts recomputed per user |

Map overlay examples (`05`):

- "3 people with gluten sensitivity reported this restaurant handles gluten well."
- Red dish stays red even if community sentiment is positive.

---

## Classifier handoff from **25** (critical)

**25** owns intake classification. **26** owns parsing after route.

```typescript
// 25 classifier output fragment
recommendedRoute: 'menu_scan'
primaryKind: 'restaurant_menu'
```

Route behavior (`08-shared-content-classifier.md`):

1. **25** writes `shared_import_job` with route `menu_scan` (when **25** ships).
2. Dispatcher calls **26** with URL/image artifacts from share — not recipe normalizer.
3. **26** produces dish-level results; optionally attaches shared menu intelligence when place known.
4. **25** logs `shared_content_routed` memory event — not raw menu content.

**Do not** run recipe normalization on `restaurant_menu` shares.

Low-confidence classifier → user choice includes "Scan as menu" (`needs_user_choice`).

Image shares default to recipe in **25** classifier stub — menu photo from share sheet may need user choice or vision pre-classification; document in **25** G27 overlap.

---

## Language bridge and Mira

Virtualized menu overlay (`08-language-bridge.md`):

- Original dish name visible for staff reference.
- Translated meaning + verdict in user language.
- Bilingual waiter questions when needed.

Live conversation: user taps "Ask for me" or says "Brioela, talk to the waiter" → `MiraSession` with `MiraSceneKind: menu_language_bridge` (**30-mira/01-scene-contract.md`).

Scene constraints:

- Food/order context only — not general travel interpreter.
- Minimum disclosure to staff (Passport-style).
- Summarize staff answers before ordering when hard constraint affected.
- No raw conversation storage unless user saves session.

---

## Offline partial mode

When connectivity weak (`05`):

- Cached constraint profile on device.
- Local deterministic matching only when extracted text already available.
- Banner: offline partial — no live Ground signals; profile may be stale.
- Photo vision requires server — honest UI when unavailable.
- Queue `menu_scanned` event for later sync.

---

## Tier entitlement

Menu scanning is **Luma** tier (`25-pricing-tiers/02-tier-entitlements.md`).

**43** owns payment and access checks. **26** defines:

- Scan pipeline receives authorized requests only.
- Upgrade prompt mentions personal allergy/diet filtering — not generic AI scanning.
- Do not upload menu photos before entitlement confirmed unless **43** explicitly allows trial scan.

Product scanning remains free forever — menu scanning is not the acquisition loop (**24** is).

---

## 26 vs neighbor boundaries

| In **26** | In separate feature |
|---|---|
| Menu capture APIs + parser + dish verdicts | Share classifier + job row — **25** |
| GPT-4o mini vision for menu pages | Product vision handlers — **24** (shared helper) |
| Per-dish constraint orchestration | Constraint matching logic — **07** |
| Per-dish condition orchestration | Condition rules + profiles — **23** |
| Waiter question generation | Mira live runtime — **29** / **30** |
| Shared restaurant menu tables | Map rendering + nearby API — **28** |
| Ground overlay read | Ground Find submission — **27** |
| `menu_scanned` memory event | `log_memory_event` tool — **05** |
| Menu Reality card trigger surface | Card generation + privacy scrub — **51** |
| Discovery ranking algorithm | Map feature — **28** (consumes **26** intel) |
| Entitlement enforcement | Pricing tiers — **43** |

---

## Obsolete / conflicting sources

| Source | Issue | Resolution |
|---|---|---|
| `brioela-specs/27-restaurant-menu-scanning.md` | Simpler two-table model; no QR/shared intel/language bridge | **Prefer build-guide 17** (8 files) for implementation |
| `brioela-specs/27` "Medical condition flags (spec 28)" | Wrong spec number for medical conditions | Medical conditions = **23** / spec 28-medical-condition-food-profile |
| `_records/connections/13-menu-scanning-connections.md` | Missing `08-language-bridge.md` link | Addendum session 018+ — language bridge exists |
| Session log 017 "complete" | Build-guide docs only | **Not production shipped** |
| `build-guide/17-menu-scanning/07-personalized-restaurant-discovery.md` | Long-term map behavior | **28** implements ranking; **26** supplies intel |
| Dual storage: Brain vs Supabase in spec 27 | `menu_scan` tables vs shared intel tables | Session/transient in request path; shared intel in Postgres (**06**); saved scans optional |
| **25** image share → recipe default | Menu photo via share may misroute | **25** `needs_user_choice` or vision pre-classify — coordinate at integration |

---

## Sources

- `build-guide/17-menu-scanning/` (00–08)
- `brioela-specs/27-restaurant-menu-scanning.md`
- `brioela-specs/04-healthy-food-map.md`
- `brioela-specs/35-ground-community-intelligence.md`
- `build-guide/19-recipe-ingestion/08-shared-content-classifier.md`
- `build-guide/22-medical-conditions/05-recipe-meal-map-cooking.md`
- `build-guide/07-scanner/05-gpt4o-mini-vision-fallback.md`
- `build-guide/25-pricing-tiers/02-tier-entitlements.md`
- `build-guide/30-mira/01-scene-contract.md`
- `build-guide/24-viral-sharing/04-feature-specific-card-types.md`
- `build-guide/18-ambient-intelligence/03-pre-trip-food-intelligence.md`
- `_records/session-log/017-menu-scanning-complete.md`
- `_records/session-log/018-menu-scanning-community-intelligence-addendum.md`
- `_records/connections/13-menu-scanning-connections.md`
- `_records/build-order/15-layer-menu-scanning.md`
- `_features/25-recipe-ingestion/spec.md`
- `_features/23-medical-conditions/spec.md`
- `_features/24-scanner/spec.md`
- `_features/28-map/status.md`
