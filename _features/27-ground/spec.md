# Ground — Spec

Feature **27**. Community food intelligence layer: anonymous, location-tagged **Finds** (hyperlocal observations — price, availability, ingredients, health signals, new products), AI authenticity gate, voice-to-find and AI-drafted contribution from scans, Supabase shared tables + Brain private find history, personalized Mapbox signal rendering (pulse = freshness, size = relevance), optional haptic walking discovery (second release), and find-to-cooking ambient triggers (second release).

**Not in this feature:** Healthy food map place identity, nearby ranking API, product sightings, price alerts (**28**); product barcode scan and verdict UI (**24**); menu dish parsing and restaurant overlay consumer logic (**26** — reads **27** summarized context only); Bela shopper order flow and shopper consent UI (**42** — writes through **27** gate); Mira live session runtime (**29**/**30**); Brain memory tools body (**05**); ambient pre-trip preload orchestration (**35** — may consume **27** for find-to-cooking cards); viral Ground Find share cards (**51**); illness detective elevation to community alert (**32** — separate `community_illness_signal` table, may hand off to Ground styling).

---

## Purpose

Real people shop, cook, and eat in a place → they notice what is on shelves, at markets, and in stores right now → Brioela surfaces those observations as anonymous **Finds** on a living map, sized for *this* user's ingredient profile — without reviews, feeds, likes, or public contributor identity.

1. **Submit** Finds via scan prompt, map tap, ambient suggestion, voice dictation, or AI-drafted post-scan card.
2. **Gate** every Find through a single structured LLM call (<1.5s) plus face detection on media.
3. **Store** shared Finds in Supabase; private submit history in Brain DO SQLite.
4. **Aggregate** `location_signal_summary` for map rendering — never query individual finds per tile.
5. **Render** pulsing signal dots on the shared Mapbox base (**28** owns base map; **27** owns Ground layer).
6. **Personalize** dot size by relevance to user scan history, constraints, and cooking memory.
7. **Discover** optionally via haptic pulse when walking near fresh relevant Finds (second release).
8. **Trigger** cooking journeys when a Find closes an ingredient gap (second release → **35** ambient surface).

Without **27**, the map has no community observation layer, scan "Add Find" is a no-op, Bela smart routing lacks price/availability signals, and Encore sourcing has no local intel path.

---

## Product definition

| Term | Meaning |
|---|---|
| **Ground** | The system — living intelligence about the physical food environment near you. "Grounded in place," not a feed. |
| **Find** | One anonymous, time-stamped, location-tagged observation. Not a review, rating, post, or opinion. |

**Design principle (non-negotiable):** The product observation is the center, not the person. No profiles, likes, comments, leaderboards, gamification, or performance metrics shown to contributors.

**Explicitly not built** (spec constraint, not roadmap): likes/upvotes, public profiles, follower/reputation systems, comment threads, trending feeds, "your find was seen" notifications, gamification badges, sharing Finds as social links outside Brioela.

---

## Complete pipeline inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/09-ground/`, `brioela-specs/35-ground-community-intelligence.md`, `brioela-specs/35b-ground-finds-deep-design.md`, `backend/`, `mobile/`, `tools/ground/`, neighbor `_features/24`, `26`, `28`, `35`, `42`.

| Component | Type | In **27**? | Shipped? | Owner / trigger | Primary sources |
|---|---|:---:|:---:|---|---|
| **`find` Supabase table** | Postgres | **Yes** | No | Shared community observations | `01-find-data-model.md`, spec 35 |
| **`location_signal_summary` table** | Postgres | **Yes** | No | Pre-aggregated map queries only | `01-find-data-model.md` |
| **`user_find_history` Brain SQLite** | Brain DO | **Yes** | No | Private submit history per user | `01-find-data-model.md` |
| **AI authenticity gate** | Backend LLM | **Yes** | No | 7 checks, <1.5s | `02-authenticity-gate.md` |
| **Face detection on R2 media** | Backend | **Yes** | No | Before gate decision | spec 35 |
| **`POST /api/finds`** | Hono handler | **Yes** | No | Submit after user confirm | spec 03 (deprecated API shape) |
| **`GET /api/finds/nearby`** | Hono handler | **Yes** | No | Bounding box + relevance | spec 35 |
| **`GET /api/finds/:locationId`** | Hono handler | **Yes** | No | Building-level find list | `04-map-rendering.md` |
| **`POST /api/finds/:id/report`** | Hono handler | **Yes** | No | Abuse report | spec 03 (deprecated) |
| **Voice-to-find formatting** | Backend + client STT | **Yes** | No | Transcript → structured Find; audio discarded | spec 35 |
| **AI-drafted Find from scan** | Backend helper | **Yes** | No | Post green/yellow scan when place known | `03-find-submission-flow.md`, 35b Angle 2 |
| **Find-from-scan prompt** | Mobile | **Yes** | No | After product scan | `03`, **24** follow-up |
| **Find-from-map submission** | Mobile | **Yes** | No | Tap building → "+" | `03` |
| **Ambient contribution prompt** | Mobile / Brain | **Yes** | No | Once per location visit | `03` |
| **Ground map signal layer** | Mobile Skia + Mapbox | **Yes** | No | Pulse, color, size | `04-map-rendering.md`, design `05-skia-layers` |
| **Personalized relevance scoring** | Backend | **Yes** | No | Dot size multiplier | 35b Angle 1 |
| **Stale/archive maintenance job** | Worker / Supabase cron | **Yes** | No | 14d stale, 60d archive | `01-find-data-model.md` |
| **`submit-find.ts` Brain tool** | tools/ground | **Yes** | No | Agent-callable submit | `00-overview.md` |
| **`log-find-from-scan.ts` tool** | tools/ground | **Yes** | No | AI-drafted find path | `00-overview.md` |
| **Haptic walking discovery** | Mobile on-device | Second release | No | 150m, relevance > threshold | `05-haptic-walking-discovery.md` |
| **Find-to-cooking trigger** | Brain + ambient card | Second release | No | `ingredient_not_found` match | `06-find-to-cooking-trigger.md` |
| **Bela shopper Ground drafts** | **42** consumer | Consumer | No | Same gate + tables | `implementable-specs/bela/07` |
| **Map base + healthy layer** | **28** | Consumer | No | Shared Mapbox base | `10-map/` |
| **Menu scan Ground overlay read** | **26** consumer | Consumer | No | Summarized place context | `17-menu-scanning/05` |
| **Ground Find viral card** | **51** | Consumer | No | Post-gate public find only | `24-viral-sharing/04` |
| **Recall alert red styling** | **31** | Visual vocab only | No | Same red family as health Finds | spec 35 |

### Shipped in repo today (Ground-related)

- Brain DO foundation (**04**) — no `user_find_history` schema.
- `log_memory_event` tool (**05**) — no Ground-specific kinds; `ingredient_not_found` not in event enum yet.
- Design system Skia Layer 4 spec for map signal dots (`01-design-system/05-skia-layers.md`) — docs only.
- Platform notifications (**21**) — documents `ground_moment` push and `ground_haptic_discovery` haptic kinds; no Ground producers.
- **No** `tools/ground/`, **no** `backend/src/api/finds/`, **no** find Zod schemas, **no** Supabase find tables.
- **No** mobile Ground feature folder.
- **No** Ground tests.

---

## Architecture — Find submission to map

```text
Entry paths
  ├── Scan result → AI draft card / "Add Find" / voice
  ├── Map tap building → voice or typed Find
  ├── Ambient prompt at store (once per visit)
  └── Bela shopper session end → draft batch (**42** → **27** gate)

        │
        ▼
Client: local STT for voice (audio discarded after transcript)
        │
        ▼
Optional: AI format layer (normalize phrasing, strip PII/promo)
        │
        ▼
Media → R2 upload (EXIF stripped client-side)
        │
        ▼
Server: face detection on R2 object
        │
        ▼
AI authenticity gate (single structured LLM, 7 checks)
        │
        ├── Fail → return reason; user edit/resubmit
        └── Pass → write find (Supabase)
                    → update location_signal_summary (trigger/job)
                    → write user_find_history (Brain DO, private)
        │
        ▼
Map layer reads location_signal_summary + user profile for relevance sizing
        │
        ├── Second release: haptic check (on-device, cached summaries)
        └── Second release: find-to-cooking → ambient card (**35**)
```

**Gate latency target:** under 1.5 seconds (`02-authenticity-gate.md`).

**Map query rule:** `location_signal_summary` only for tile rendering — never individual `find` rows per visible tile (spec 35).

---

## Find data contract

### Shared Supabase — `find`

| Field | Notes |
|---|---|
| `find_id` | uuid PK |
| `location_id` | references places DB |
| `signal_type` | `health` \| `ingredient` \| `price` \| `new_product` \| `general` |
| `content` | AI-formatted text, max 280 chars |
| `media_urls` | R2 URLs, nullable |
| `captured_at` | timestamptz |
| `expires_at` | default captured_at + 60 days |
| `status` | `active` \| `stale` \| `archived` \| `removed` |
| `contributor_hash` | hashed user_id — abuse only, never displayed |
| `gate_passed` | boolean |
| `gate_log` | jsonb internal |

### Shared Supabase — `location_signal_summary`

| Field | Notes |
|---|---|
| `location_id` | uuid |
| `signal_type` | text |
| `active_count` | int |
| `last_find_at` | timestamptz |
| `updated_at` | timestamptz |

### Private Brain DO — `user_find_history`

| Field | Notes |
|---|---|
| `find_id` | text |
| `submitted_at` | integer |
| `location_id` | text |
| `signal_type` | text |
| `content_preview` | text |

---

## Authenticity gate checks (all must pass)

| # | Check | Fail behavior |
|---|---|---|
| 1 | Specificity — names product/ingredient/place | User-facing rejection reason |
| 2 | No promotion / marketing copy | Same |
| 3 | No negativity targeting a business | Same |
| 4 | Freshness plausibility vs date/location | Same |
| 5 | No personal information | Same |
| 6 | Face detection — no faces in media | Same |
| 7 | Minimum information density | Same |

**Abuse:** max 10 finds/user/day; repeated failures → 24hr cooldown; no public reputation.

**Media:** images/video allowed if no faces; video max 30s, audio stripped before display; voice audio never stored.

---

## Signal types and map visual language

| Color | `signal_type` | Example |
|---|---|---|
| Red | `health` | Contamination, recall on shelf |
| Orange | `ingredient` | Fresh fenugreek arrived |
| Green | `price` | Eggs dropped to $3.20 |
| Blue | `new_product` | New brand on shelf |
| Grey | `general` | Other concrete observation |

### Pulse = freshness (building zoom)

| Age of most recent find at location | Pulse |
|---|---|
| < 2 hours | fast (1 beat / 1.2s) |
| 2–12 hours | medium (1 / 2.5s) |
| 12–48 hours | slow (1 / 5s) |
| 2–7 days | very slow (1 / 10s) |
| 7–14 days | static dim dot |
| > 14 days | faded 25% opacity |
| > 60 days | archived — off active map |

### Size = personal relevance

```text
rendered_dot_size = base_size × (1 + relevance_score × 0.8)
```

Relevance from overlap between find keywords and user ingredient profile (top scans, constraints, cooking memory). World is not filtered away — irrelevant dots are smaller (35b Angle 1).

---

## Entry points

| Path | Trigger | Prefill |
|---|---|---|
| **From scan** | After product scan, place known | Product name, location, scan verdict context |
| **AI-drafted scan** | Green/yellow scan + known place | Auto draft card: Submit / Edit / Dismiss |
| **From map** | Tap building → "+" | Location only |
| **Ambient suggestion** | At store + recent scan context | Soft prompt, once per visit |
| **Voice-to-find** | Dictation button | Transcript → AI format → preview → gate |
| **Bela shopper** | End of shopping session (**42**) | Price/availability drafts from order scans |

**Tier gate:** Ground Find *authoring* requires Luma (`07-scanner/04-scan-result-ui.md`). Scan verdict itself remains free (**24**).

---

## Privacy model

- Contributor identity never displayed; `contributor_hash` for abuse only.
- Location stored at business/place level — not raw GPS trails for map display.
- Voice audio discarded immediately after client transcription.
- Find media in R2 with EXIF removed; faces blocked.
- Account deletion: finds anonymized in place (hash nulled), not deleted — collective intelligence preserved.
- Haptic checks run on-device from cached summaries — no per-step location stored server-side (`05-haptic-walking-discovery.md`).
- Ground does **not** write to `user_memory` by default; acting on a Find may write memory downstream.

---

## Second-release features (documented, not first ship)

### Haptic walking discovery (`05`)

- Opt-in background location.
- Every ~60s on-device check: cached `location_signal_summary` within 150m.
- Trigger: fresh find (<4h), relevance > 0.6, walking (<8 km/h), not visited in 7d.
- Output: one slow haptic pulse — **not** push (`21-platform-notifications`).
- Suppression: no haptic during cooking session; 20min cooldown; ignored haptics reduce to 1/day.

### Find-to-cooking trigger (`06`)

- New high-relevance Find matches user's `ingredient_not_found` or cooking gap.
- Surfaces ambient two-action card (**35** / spec 23 surface): reminder or start cooking session.
- Requires `ingredient_not_found` memory event kind (introduced in 35b / Encore `31-encore/03`).

---

## Brain integration

| Integration | Direction | Notes |
|---|---|---|
| `user_find_history` | Write on submit | Private Brain SQLite only |
| Relevance scoring | Read | Scan history, constraints, cooking memory via Brain RPC |
| Find-to-cooking | Read + ambient dispatch | Second release; needs alarm/sub-agent path (**35**) |
| Default memory write | **None** | Find itself does not write `memory_event` |

**No Mira scene kind** dedicated to Ground. Voice-to-find uses client STT + formatting layer, not a live Mira session. In-store copilot (**45**) *reads* store-scoped Finds at session start.

---

## Notification surfaces (consumer contract)

From `21-platform-notifications` + `12-notifications/`:

| Kind | Surface | Priority | Owner |
|---|---|---|---|
| `ground_moment` | Medium push OR in-app below scan | Medium; max 1 push/day | **27** produces; **21** delivers |
| `ground_haptic_discovery` | Haptic only | Not push | **27** second release |
| In-app ambient | Find draft below scan result | In-app | **27** + **24** |
| Find-to-cooking card | Ambient two-action | High/medium in-app | **35** renders; **27** supplies Find context |

Spec 23 still says "community note" in one medium-priority example — treat as **Find** (Ground supersedes spec 03).

---

## Release split

| Release | Includes |
|---|---|
| **First** | Data model, AI gate, manual + AI-drafted submission, map pulse rendering, relevance sizing |
| **Second** | Haptic walking discovery, find-to-cooking triggers |

---

## Success metrics (from spec 35)

- Gate pass rate target: 75–85%
- Find density per active city (finds/km² in top cities)
- Stale decay rate (healthy churn)
- Find-to-action rate (see find → scan or visit)
- Contribution rate: 15–25% of active users submit ≥1 find / 30 days
- Gate rejection-to-resubmission rate (gate guidance quality)

---

## 27 vs neighbor boundaries

| In **27** (this feature) | In separate feature |
|---|---|
| Find schema + gate + submit APIs | Mapbox base + healthy places — **28** |
| `location_signal_summary` aggregation | Nearby ranking API — **28** |
| Ground signal layer rendering | Product sightings, price alerts — **28** |
| Voice-to-find + AI drafts | Product scan verdict — **24** |
| Scan/map entry UX for Finds | Menu dish verdicts — **26** (reads overlay) |
| `user_find_history` private table | Memory event tool body — **05** |
| Haptic discovery mechanism | Push delivery infrastructure — **21** |
| Find-to-cooking match logic | Ambient card runtime + alarms — **35** |
| Authenticity gate | Bela shopper consent + draft batch UI — **42** |
| Ground Find share card rules | Viral card renderer — **51** |

---

## Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `brioela-specs/03-hyperlocal-community-notes.md` | **Deprecated** — `community_note` → `find`; prefer spec 35 |
| `brioela-specs/23-ambient-notification-strategy.md` | Still says "community note" — Ground Find is the product term |
| `_records/session-log/009-ground-complete.md` | Build-guide docs only — zero production code |
| `brioela-specs/00b-naming-lexicon.md` | Referenced in README but **file not in repo** |
| Spec 23 vs build-guide 12 | Build-guide adds explicit Ground haptic surface; spec 23 predates Ground naming |

---

## Sources

- `build-guide/09-ground/` (00–06)
- `brioela-specs/35-ground-community-intelligence.md`
- `brioela-specs/35b-ground-finds-deep-design.md`
- `brioela-specs/03-hyperlocal-community-notes.md` (deprecated context)
- `brioela-specs/04-healthy-food-map.md` (Ground layer boundary)
- `brioela-specs/23-ambient-notification-strategy.md`
- `build-guide/07-scanner/04-scan-result-ui.md`
- `build-guide/10-map/06-map-ui-layers.md`
- `build-guide/01-design-system/05-skia-layers.md`
- `build-guide/12-notifications/01-priority-model.md`, `04-surfaces.md`, `05-permission-timing.md`
- `implementable-specs/bela/07-ground-contribution.md`
- `build-guide/31-encore/03-constraint-adaptation-and-sourcing.md`
- `build-guide/32-in-store-copilot/02-context-payload.md`
- `build-guide/24-viral-sharing/04-feature-specific-card-types.md`
- `build-guide/16-illness-detective/04-community-signal.md`
- `_records/connections/04-ground-connections.md`
- `_records/build-order/07-layer-ground.md`
- `_records/session-log/009-ground-complete.md`
