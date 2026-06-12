# Harvest — Spec

Feature **53**. Annual food year-in-review: once per account-anniversary year, a Brain DO alarm composes 6–10 salience-ranked chapters from existing private data into a stored generative-grammar paged artifact with pre-rendered per-chapter share cards. Product name **Harvest** — never "Year in Food" as a title (lowercase "your year in food" as description only).

**Not in this feature:** generative grammar schema/renderer/Artifact Layer implementation (**52** — renders stored `BrioelaGenerativeUiDocument` sets and exports PNGs); Discovery Card privacy scrub + share-sheet transport (**51** — Harvest cards use pre-validated compose-time content but still flow through **51** share bridge); Food Time Machine inline moment queue and weekly candidate regeneration (**35** / brioela-spec **38** — **53** reads archived candidates, does not own inline surfacing); weekly food summary generation or presentation (**34** / spec **16** — different cadence); growth mirror skill evidence extraction and trajectory maintenance (**40** / brioela-spec **53-growth-mirror** — optional `craft` chapter input only); push infrastructure (**21** — **53** registers `harvest_edition_ready` trigger only); guard/lexicon/reading-gate tooling.

**Living catalog note:** Composition pipeline step 1 is named **gather** — never "harvest" as a verb in code (word reserved for the artifact). Code namespace: `harvest` — tables `harvest_edition`, `harvest_chapter`; handlers under `backend/src/agents/brain/_handlers/harvest/`; future tools under `tools/harvest/`. **Spec numbering:** product behavior lives in `brioela-specs/49-harvest.md`; feature folder is **53** by build order. Do not confuse with `brioela-specs/53-growth-mirror.md` (feature **40**).

---

## Purpose

The Food Time Machine (brioela-spec **38**, implemented in **35**) surfaces personal food history one quiet inline moment at a time. **53** is the once-a-year composition: gather a full anniversary year's signals into one beautiful, personal artifact — rendered through **52**, shareable per chapter via **51**, delivered by one high-priority notification via **21**.

```text
Anniversary alarm (week before) → eligibility → gather → candidates → salience rank → narrative LLM → grammar LLM → store edition + pre-render cards → notification (once)
```

Without **53**, a year of ambient value never becomes visible as a story; **52**'s most expressive surface has no owner; **51**'s highest-volume share channel has no payload.

---

## Product definition

| Term | Meaning |
|---|---|
| **Harvest** | The annual composed artifact and its moment — "your Harvest", "Your Harvest is ready", archive of "your Harvests" |
| **Edition** | One anniversary year's composed artifact (`harvest_edition` row + chapters) |
| **`year_index`** | 1st, 2nd, 3rd… anniversary year (not calendar year) |
| **Gather** | Step 1 — local SQLite reads over the anniversary window (never named `harvest` as a verb) |
| **Chapter candidate** | Typed, query-backed story unit before ranking |
| **Salience ranking** | Spec **38** heuristic family — first-evers highest, maintained changes high, round numbers medium |
| **`source_queries_json`** | Mandatory per-chapter traceability — which queries produced every number |
| **`document_set_json`** | Stored `BrioelaGenerativeUiDocument` set composed at generation time (**52** renders at open) |
| **Share card** | Pre-rendered static PNG per chapter (+ cover) — headline + "my Harvest — Brioela" |
| **Floors** | ≥10 active weeks of data; ≥6 strong chapters — else no edition (silence over filler) |
| **Anniversary timing** | Account-creation anniversary, not December year-end |

**Design principles (non-negotiable):**

- Numbers from queries only — if a number cannot be traced, the chapter does not ship.
- Observations only ("you did X") — never advice, judgment, or "you should."
- Maintained dietary change is observed, never scored — no streak/gamification framing (spec **38** doctrine).
- No comparative framing vs other users — ever (spec **35** anti-performance law).
- Hard sensitivity exclusion at **candidate** layer — excluded categories never become candidates.
- One notification, once, never re-pushed; unopened editions wait quietly in-app.
- Free for every user (spec **19** / **43**) — gating would amputate viral + retention value.
- Nothing shares automatically — per-card explicit share sheet only.

---

## Complete chapter type inventory

> **Authoritative:** `build-guide/36-harvest/02-chapter-rules.md`, `brioela-specs/49-harvest.md` § Composition step 2.

| # | `chapter_type` | Salience class | Example headline (user-facing) | Primary data sources | Owner feature |
|---|---|---|---|---|---|
| 1 | `firsts` | Highest (first-ever events) | "You discovered tahini in March. You've cooked with it 14 times since." | `scan_events` first UPC; first recipe with ingredient; Time Machine `first_time` candidates (**35**/**38**) | **24**, **08**, **35** |
| 2 | `avoidance_maintained` | High (maintained change) | "You've avoided palm oil for 8 months straight." | `user_memory` `diet.*` timeline; constraint maintenance (**07**); negative-space standing concerns (**38** feature — not Harvest body) | **07**, **05** |
| 3 | `heritage` | High (generational/family recipe) | "Grandma's doro wat: captured in December, cooked 9 times, shared with your sister." | `heritage_recipe_capture`, `recipe_history` + `family_capture` origin (**49**); audience-level recipient refs only | **49** |
| 4 | `discovery` | Medium–high (diversity) | "11 new cuisines this year." | Scan/recipe diversity; cuisine tags; Time Machine milestone candidates | **24**, **08**, **35** |
| 5 | `craft` | Medium–high (optional) | Strongest cooking-growth arc — dimension + evidence-backed direction | `skill_trajectory` strongest improving arc (**40** / spec **53**) | **40** (optional — edition works without) |
| 6 | `rhythm` | Medium (patterns) | "Your most-cooked dish, your fastest-growing skill, your best food month." | `recipe_history` counts; cooking session density by month (**29**); receipt/cook rhythm (**33**) | **29**, **08**, **33** |
| 7 | `family` | Medium (audience-level only) | Mesa/Heirloom table moments — who was fed, not health detail | Mesa compatibility outcomes (**41**); Heirloom send events at audience level (**49**); Kin dinner (**50**) if present | **41**, **49**, **50** |

### Hard exclusion list (never chapter, never card)

Enforced when building candidates — downstream narrative/grammar passes never see excluded material:

| Category | Source rule |
|---|---|
| Illness events | spec **30** / **32** |
| Medical conditions | spec **28** |
| Medications | spec **34** (medication data) |
| Glucose / biometric data | spec **40** (wearables) |
| Guest constraint details | spec **37** |
| Craving history | spec **52** craving decoder |
| Locations finer than city | spec **35** privacy |
| Any health-adjacent share risk | hardened for share surface per spec **49** § Out of Scope |

---

## Six-step composition workflow

> **Authoritative:** `build-guide/36-harvest/01-composition-workflow.md`.

| Step | Name | Owner | Description |
|---|---|---|---|
| 1 | **Gather** | **53** | Local SQLite queries per spec **38** source table + year's archived Time Machine candidates (surfaced or not) |
| 2 | **Chapter candidates** | **53** | Build typed candidates for all seven chapter types; apply hard exclusion filter |
| 3 | **Salience ranking** | **53** | Spec **38** heuristic; select 6–10; abort if &lt;6 strong |
| 4 | **Narrative pass** | **53** | One structured LLM call — warm, specific, factual copy; every number pre-bound to query refs |
| 5 | **Grammar composition** | **53** compose → **52** validate/render | AI composes `BrioelaGenerativeUiDocument` set per chapter + cover; mood/motion/Skia differ by chapter type |
| 6 | **Store** | **53** | Persist `harvest_edition` + `harvest_chapter` rows; pre-render share cards via **52** Artifact Layer → R2 `share_card_ref`; trigger **21** notification once |

### Trigger and eligibility

| Rule | Value |
|---|---|
| **When** | Brain DO alarm in the week **before** account anniversary (**09**/**14** ambient mechanism — no cron) |
| **Active weeks floor** | &lt;10 active weeks in the anniversary period → abort silently; spec **38** milestone moment fires instead |
| **Chapter floor** | &lt;6 strong chapters after ranking → no edition this year |
| **Cost model** | Local counting queries + one narrative LLM + one grammar LLM + card renders ≈ few cents/user/year |

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** `rg 'harvest_edition|harvest_chapter|composeHarvest' backend/src shared/ mobile/` — **zero product matches**.

| # | Component | Type | In **53**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **`harvest_edition` table** | Brain SQLite | **Yes** | No | Edition archive | `03-grammar-rendering.md` |
| 2 | **`harvest_chapter` table** | Brain SQLite | **Yes** | No | Per-chapter rows + traceability | `03-grammar-rendering.md` |
| 3 | **`HarvestChapterType` constant** | Shared constant | **Yes** | No | Seven typed chapters | `02-chapter-rules.md` |
| 4 | **Anniversary window calculator** | Pure helper | **Yes** | No | `period_start` / `period_end` from account `created_at` | spec **49** § Timing |
| 5 | **Eligibility checker** | Helper | **Yes** | No | 10 active weeks + not duplicate year | `01-composition-workflow.md` |
| 6 | **Gather data handler** | Brain handler | **Yes** | No | Step 1 queries | spec **49** § Composition |
| 7 | **Time Machine archive reader** | Helper | **Cross — 35** | No | Year's `time_machine_moment` candidates | spec **38** § Annual Composition |
| 8 | **Build chapter candidates** | Brain handler | **Yes** | No | Step 2 typed candidates | `02-chapter-rules.md` |
| 9 | **Sensitivity exclusion policy** | `_policies/` | **Yes** | No | Candidate-layer hard filter | `02-chapter-rules.md` |
| 10 | **Salience ranker** | Pure helper | **Yes** | No | Step 3 — spec **38** heuristic | `01`, spec **38** |
| 11 | **Craft chapter loader** | Brain handler | **Cross — 40** | No | Optional `craft` from `skill_trajectory` | `40-growth-mirror/04` § Annual Handoff |
| 12 | **Narrative LLM pass** | Brain handler | **Yes** | No | Step 4 structured output | spec **49** |
| 13 | **Grammar compose pass** | Brain handler | **Yes** | No | Step 5 — calls **52** compose/validate | `03-grammar-rendering.md` |
| 14 | **Store edition handler** | Brain handler | **Yes** | No | Step 6 persistence | `03-grammar-rendering.md` |
| 15 | **Pre-render share cards** | Brain handler | **Yes** | No | **52** `renderArtifactStatic` → R2 | `04-share-cards.md` |
| 16 | **`compose_harvest_edition` orchestrator** | Alarm handler | **Yes** | No | Full 6-step workflow | `01-composition-workflow.md` |
| 17 | **`harvest_edition_ready` notification** | Trigger | **Cross — 21** | No | One push, dedupe by `edition_id` | `21` spec inventory |
| 18 | **Harvest edition API** | Backend | **Yes** | No | Get edition, list archive, mark opened | — |
| 19 | **Full-screen paged viewer** | Mobile | **Yes** | No | Renders stored docs via **52** renderer | spec **49** § User Outcome |
| 20 | **Archive shelf** | Mobile | **Yes** | No | Past years viewable, deletable | spec **49** |
| 21 | **Per-chapter share button** | Mobile | **Yes** | No | Explicit tap → **51** share bridge | `04-share-cards.md` |
| 22 | **Cover card share** | Mobile | **Yes** | No | Whole-year summary card | `04-share-cards.md` |
| 23 | **Install attribution tag** | Cross — **51** | No | Distinct Harvest share-link path | `04-share-cards.md` |
| 24 | **Content inventory listing** | Cross — passport/delete | **Yes** | No | Edition deletable like other user content | spec **49** § Privacy |
| 25 | **Harvest metrics** | Observability | **Yes** | No | Open, completion, share, retention delta | spec **49** § Success Metrics |
| 26 | **Harvest tests** | Tests | **Yes** | No | Floors, exclusion, traceability gate | — |

### Shipped in repo today (harvest-related)

- `build-guide/36-harvest/` — **5 files complete** (docs only).
- `brioela-specs/49-harvest.md` — primary product spec.
- `_records/connections/32-harvest-connections.md`, `_records/build-order/33-layer-harvest.md`.
- Cross-feature drafts: **52** `harvest.chapter.document.helper.gap.md`; **40** `load.craft.chapter.candidate.handler.gap.md`; **51** `harvest_chapter` / `harvest_cover` card types.
- **Zero** `harvest_edition`, `harvest_chapter`, or `composeHarvest*` production code.

---

## Data model

Brain DO SQLite (private):

```sql
harvest_edition (
  edition_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  year_index INTEGER NOT NULL,        -- 1st, 2nd anniversary year
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  chapter_count INTEGER NOT NULL,
  document_set_json TEXT NOT NULL,    -- BrioelaGenerativeUiDocument[] — **52** schema
  cover_share_card_ref TEXT,          -- R2 user-scoped object
  generated_at INTEGER NOT NULL,
  opened_at INTEGER                   -- nullable
)

harvest_chapter (
  chapter_id TEXT PRIMARY KEY,
  edition_id TEXT NOT NULL REFERENCES harvest_edition(edition_id),
  chapter_type TEXT NOT NULL,         -- HarvestChapterType
  headline TEXT NOT NULL,
  body TEXT NOT NULL,
  source_queries_json TEXT NOT NULL,  -- mandatory traceability
  share_card_ref TEXT,                -- R2 user-scoped PNG
  shared INTEGER NOT NULL DEFAULT 0,  -- boolean
  rank INTEGER NOT NULL
)
```

Editions are permanent user data — listed in content inventory; individually deletable.

---

## Rendering and offline behavior

- Documents composed and **stored at generation** — open renders instantly from `document_set_json` (**52** renderer). The **400ms enhancement budget does not apply** (`36-harvest/03`).
- No safety surfaces or payment surfaces inside the edition — fully generative within **52** validation bounds.
- Validation failure → plain typographic fallback of chapter text; story never breaks (`03-grammar-rendering.md`).
- Fully offline after generation (stored documents + local SQLite).

### Generative surfaces (**52**)

| Surface | Role |
|---|---|
| `harvest_chapter_brioela_generative_ui` | Per-chapter paged scene + share card layout |
| `harvest_cover_brioela_generative_ui` | Whole-year cover card |

Layout template: `harvest_chapter_story_layout` (per **52** draft catalog).

---

## Share cards

| Rule | Detail |
|---|---|
| Pre-render | At composition step 6 via **52** Artifact Layer |
| Content | Chapter headline fact + "my Harvest — Brioela" — nothing else |
| `DiscoveryCardType` | `harvest_chapter` / `harvest_cover` (**51** extension enum **G2**) |
| Privacy | Structurally safe — excluded categories never became chapters |
| EXIF | Stripped (same rule as Ground media, spec **35**) |
| Transport | **51** share sheet bridge — **53** does not post anywhere |
| Attribution | Distinct install tag for Harvest cards (`04-share-cards.md`) |

---

## Tier placement

**Free for every user** (spec **49**, **43**). Paid-tier features (heritage captures, cooking growth) appear naturally when the user has them; free-user editions built from scan/receipt/avoidance history remain real. At most **one quiet in-app line** about what a fuller year could look like — never push, never mid-story interruption.

---

## Privacy

- Composed entirely from private Brain DO data; edition never leaves device except user-initiated share cards.
- Hard exclusion at candidate layer (see inventory above).
- Share cards: static images, no embedded metadata.
- Past editions part of "what Brioela knows about me" — individually deletable.
- Family chapter: audience level only — never member health detail (**41** Mesa rules).

---

## Success metrics

| Metric | Use |
|---|---|
| Edition open rate within 7 days of notification | Delivery quality |
| Completion rate (last chapter reached) | Story engagement |
| Share rate (editions with ≥1 card shared; cards per sharer) | Viral loop |
| Install attribution from Harvest cards | Acquisition channel |
| 60-day retention delta (opened vs matched unopened) | Retention hypothesis |
| Chapter-type share distribution | Feeds next year's salience weights |

---

## Feature boundaries

### vs **34** Weekly food summary (spec **16**)

| **53** Harvest | **34** Weekly summary |
|---|---|
| Annual anniversary cadence | Weekly Sunday alarm |
| 6–10 chapter paged artifact | Single summary card/notification |
| Pre-composed grammar documents | `weekly_summary` JSON + optional **51** `weekly_summary` card |
| Highest-volume share surface | Medium-priority push; competes for daily cap |
| Spec **49** explicitly forbids diluting annual with intermediate recaps | One "from your history" Time Machine line per week allowed |

### vs **52** Generative grammar

| **53** owns | **52** owns |
|---|---|
| Gather, salience, chapter copy, `document_set_json` storage | `BrioelaGenerativeUiDocument` schema + validation |
| Alarm orchestration, edition tables | Native renderer + `renderArtifactStatic` |
| Narrative + grammar **compose calls** | `harvest_chapter_*` / `harvest_cover_*` catalog + Scene components |
| Anti-hallucination via `source_queries_json` | Fallback typographic render on validation fail |

### vs **51** Viral sharing

| **53** owns | **51** owns |
|---|---|
| Chapter selection, headline/body, pre-render trigger | `harvest_chapter` / `harvest_cover` enum registration |
| `share_card_ref` R2 writes | Share sheet bridge + attribution tables |
| Compose-time privacy (candidate exclusion) | Discovery Card scrub pipeline (N/A for Harvest — excluded at source) |

### vs **40** Growth mirror (brioela-spec **53**)

| **53** | **40** |
|---|---|
| Annual `craft` chapter composition | Session skill evidence + trajectories |
| Optional consumer of strongest arc | `loadCraftChapterCandidate` producer |
| Only shareable growth surface | No visible progression UI; no push |
| Edition works without **40** | Chef+ tier gate for evidence existence |

### vs **35** Food Time Machine (brioela-spec **38**)

| **53** | **35** |
|---|---|
| Annual read of year's candidate archive | Weekly 5–10 candidate queue regeneration |
| Full artifact composition | Inline scan/recipe/summary surfacing |
| 6–10 chapters once/year | Moments expire after 14 days unsurfaced |

### vs **49** Heirloom / **48** Encore / **27** Ground

| Input | Chapter | Notes |
|---|---|---|
| **49** heritage captures + cook history | `heritage` | Generational recipe emotional weight |
| **48** Encore | Not a dedicated chapter type | May inform `discovery` or `rhythm` via cook history — no Encore-specific chapter in spec **49** |
| **27** Ground finds | Not a chapter type | Community finds excluded from private Harvest narrative per spec **38** privacy |

---

## Obsolete sources and conflicts

| Issue | Resolution |
|---|---|
| **Feature folder 53** vs **brioela-spec 49** | Expected mapping — folder = build order, spec = product number |
| **brioela-spec 53** = Growth Mirror vs feature **40** | spec **49** § In Scope cites "growth observations (spec 53)" — means Growth Mirror spec, not Harvest folder |
| **brioela-spec 38** = Food Time Machine vs feature **38** = Negative Space Nutrition | Time Machine implementation lives in **35**; **53** reads spec **38** for salience + sources |
| **40** `build.md` lists `_handlers/harvest/load.chapter.candidates.handler.ts` vs **40** draft `load.craft.chapter.candidate.handler.ts` | **53** orchestrator calls **40** craft loader; single craft helper in **40**, wired from **53** gather/candidate step |
| Early "Year in Food" naming | Deprecated as product name — Harvest only (`49-harvest.md` § Naming) |
| `_features/53-harvest/status.md` cited `brioela-specs/16-weekly-food-summary.md` | Weekly summary is boundary reference (**34**), not Harvest primary spec |

---

## Sources

- `brioela-specs/49-harvest.md` — primary
- `build-guide/36-harvest/` (`00`–`04`)
- `brioela-specs/38-food-time-machine.md` — salience, sources, Annual Composition cross-ref
- `brioela-specs/42-brioela-generative-grammar.md`, `39-generative-ui.md` — rendering
- `brioela-specs/25-viral-growth-and-sharing.md` — share-card law, Second-Wave moments
- `brioela-specs/23-ambient-notification-strategy.md` — one-notification rule
- `brioela-specs/53-growth-mirror.md` — optional `craft` input
- `build-guide/18-ambient-intelligence/04-food-time-machine.md` — candidate queue shape
- `build-guide/40-growth-mirror/04-recipe-confidence-touch.md` — Annual Handoff
- `_records/connections/32-harvest-connections.md`, `_records/build-order/33-layer-harvest.md`
- Neighbor `_features/35-ambient-intelligence/`, `40-growth-mirror/`, `51-viral-sharing/`, `52-generative-grammar/`, `21-platform-notifications/`, `34-pantry-meal-plan/`, `43-pricing-tiers/`, `49-heirloom/`
