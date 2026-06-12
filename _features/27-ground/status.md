# Status

open

**Ground not shipped.** Build-guide **09** is complete (docs only). Zero production find API, authenticity gate, Supabase find tables, Brain `user_find_history`, mobile Ground map layer, scan/map submission UX, or tests. Partial dependencies: Brain DO (**04**), `log_memory_event` (**05** — no `ingredient_not_found`), platform notification kinds documented (**21** — no Ground producers).

# Shipped in backend (partial — dependencies only)

- [x] Brain DO foundation (**04** — no Ground-specific schema)
- [x] `log_memory_event` tool (**05** — Ground does not write memory by default)
- [x] Notification spec kinds `ground_moment`, `ground_haptic_discovery` (**21** — documented only)
- [ ] `find` Supabase table
- [ ] `location_signal_summary` Supabase table
- [ ] `user_find_history` Brain SQLite table
- [ ] `backend/src/api/finds/` module
- [ ] `POST /api/finds` + authenticity gate
- [ ] `GET /api/finds/nearby`
- [ ] `GET /api/finds/locations/:locationId`
- [ ] Face detection on R2 media
- [ ] Voice-to-find formatting layer
- [ ] AI-drafted Find from scan helper
- [ ] Relevance scoring for map dots
- [ ] Stale/archive maintenance job
- [ ] `tools/ground/` (`submit-find`, `log-find-from-scan`)
- [ ] Mobile Ground map + signal layer (Skia)
- [ ] Find submission sheets + AI draft card
- [ ] Scan "Add Find" follow-up (**24** integration)
- [ ] Ambient store contribution prompt
- [ ] Luma entitlement gate for Find authoring
- [ ] Haptic walking discovery (second release)
- [ ] Find-to-cooking ambient trigger (second release)
- [ ] Bela shopper Ground draft path (**42** consumer)
- [ ] Ground tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `backend/src/api/finds/` | `rg finds backend/src/api` — zero |
| G2 | No find Zod schemas | `rg find.schema shared/validator` — zero |
| G3 | No Supabase `find` drizzle schema | `rg location_signal shared/drizzle` — zero |
| G4 | No `location_signal_summary` table | Same |
| G5 | No `user_find_history` Brain schema | `rg user_find_history backend` — zero |
| G6 | No AI authenticity gate helper | `02-authenticity-gate.md` — no implementation |
| G7 | No face detection pipeline | spec 35 media gate — not built |
| G8 | No `POST /api/finds` handler | spec 35 API — zero |
| G9 | No `GET /api/finds/nearby` | spec 35 — zero |
| G10 | No summary aggregation trigger/job | `01-find-data-model.md` — not implemented |
| G11 | No relevance scoring helper | 35b Angle 1 — not implemented |
| G12 | No `tools/ground/` | `glob tools/ground` — zero files |
| G13 | No mobile `features/ground/` | `rg ground mobile/features` — zero |
| G14 | No Skia Ground signal layer | design `05-skia-layers` Layer 4 — docs only |
| G15 | No AI-drafted Find card on scan | `03-find-submission-flow.md` — no `draft.find.from.scan` |
| G16 | No voice-to-find formatting | `03` — no helper |
| G17 | No scan "Add Find" action wired | **24** `04-scan-result-ui` — action spec only |
| G18 | No map Ground layer toggle | **28** unshipped — **27** layer unbuilt |
| G19 | No stale/archive maintenance | 14d/60d rules — no cron |
| G20 | No rate limit (10/day) + gate cooldown | `02-authenticity-gate.md` — not enforced |
| G21 | No Luma entitlement on Find authoring | scanner spec tier gate — not wired |
| G22 | No haptic walking discovery | second release — `05-haptic-walking-discovery.md` |
| G23 | No find-to-cooking trigger | second release — `06-find-to-cooking-trigger.md` |
| G24 | No `ingredient_not_found` memory kind | 35b Angle 4 / Encore — not in **05** enum |
| G25 | No `ground_moment` producer | **21** spec lists kind — no backend writer |
| G26 | Bela shopper Ground drafts unbuilt | **42** + `implementable-specs/bela/07` — consumer only |
| G27 | Menu scan Ground overlay read unbuilt | **26** G20 — depends on **27**/**28** |
| G28 | No Ground Find viral card trigger | **51** `24-viral-sharing/04` — unbuilt |
| G29 | Illness → Ground alert handoff unbuilt | **32** `community_illness_signal` — separate |
| G30 | No Ground tests | No `find*.test.ts` |
| G31 | Session log 009 "complete" misleading | Build-guide docs only; no production |
| G32 | Spec 23 still says "community note" | Prefer Find/Ground terminology from spec 35 |
| G33 | `brioela-specs/00b-naming-lexicon.md` missing | README references file not in repo |
| G34 | Places FK for `location_id` blocked | **28** `map_place` not migrated |

# 27 vs neighbor boundaries

| In **27** (this feature) | In separate feature |
|---|---|
| Find data model + gate | Mapbox base + healthy places — **28** |
| `location_signal_summary` | Nearby ranking — **28** |
| Ground signal rendering (Skia) | Product sightings, price alerts — **28** |
| Submit flows (scan/map/voice) | Product scan verdict — **24** |
| AI-drafted Find generation | Menu dish parsing — **26** |
| Private `user_find_history` | Memory event kinds body — **05** |
| Haptic discovery pulse | Push infrastructure — **21** |
| Find-to-cooking match | Ambient alarm dispatch — **35** |
| Authenticity gate | Bela shopper UI + consent — **42** |
| Public Find content rules | Viral card render — **51** |

# Critical boundary: Ground ≠ Map

| | **27-ground** | **28-map** |
|---|---|---|
| **What** | Anonymous community observations (Finds) | Curated healthy place/product discovery |
| **Tables** | `find`, `location_signal_summary` | `map_place`, `map_place_signal`, `product_sighting`, … |
| **Rendering** | Pulsing signal dots, personalized size | Health scores, place badges, sightings |
| **Same surface** | Both layers on one Mapbox base with toggles | Owns base map setup |

# Critical boundary: Ground ≠ Ambient Intelligence

| | **27-ground** | **35-ambient-intelligence** |
|---|---|---|
| **What** | Shared community food observations | Private behavioral patterns, pre-trip intel, food time machine |
| **Data** | Supabase shared | Brain DO private + geo cache |
| **Proactive** | Optional haptic near relevant Find | Brain alarm loop, pattern cards |
| **Bridge** | Find-to-cooking trigger (second release) surfaces via **35** ambient card |

# Blocked by

- 01-platform-foundation (API router, mobile feature shell, R2 bindings)
- 04-brain-foundation (Brain DO — shipped; needs Ground schema)
- 24-scanner (find-from-scan + AI draft entry — unshipped)
- 28-map (shared places/`location_id` FK — partial; Ground can ship API before full map UI)
- 43-pricing-tiers (Luma Find authoring gate — unshipped)

# Blocks

- 28-map (Ground overlay layer consumes **27** summaries)
- 26-menu-scanning (Ground overlay read for restaurantId)
- 42-bela (shopper Ground contribution + smart routing signals)
- 45-in-store-copilot (store-scoped Ground intel at session start)
- 48-encore (sourcing check reads Ground finds)
- 51-viral-sharing (Ground Find card)
- 21-platform-notifications (`ground_moment` producer)

# Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `brioela-specs/03-hyperlocal-community-notes.md` | Deprecated — `community_note` API replaced by Find |
| `brioela-specs/23-ambient-notification-strategy.md` | "Community note" wording; no Ground haptic surface |
| `_records/session-log/009-ground-complete.md` | Docs-only completion |
| `_records/connections/04-ground-connections.md` | Omits `05`, `06` second-release files in header (content mapped) |
| No implementation ledger for Ground | Build from build-guide 09 only |

# Draft count

**19** files in `draft/` — 18 gap/intended snapshots + `gap-index.md`.

# Sources

- `build-guide/09-ground/` (00–06)
- `brioela-specs/35-ground-community-intelligence.md`
- `brioela-specs/35b-ground-finds-deep-design.md`
- `brioela-specs/03-hyperlocal-community-notes.md` (deprecated)
- `brioela-specs/04-healthy-food-map.md`
- `implementable-specs/bela/07-ground-contribution.md`
- `_records/connections/04-ground-connections.md`
- `_records/build-order/07-layer-ground.md`
- `_records/session-log/009-ground-complete.md`
- `_features/24-scanner/status.md`
- `_features/26-menu-scanning/status.md`
- `_features/28-map/status.md`
- `_features/35-ambient-intelligence/status.md`
- `_features/21-platform-notifications/spec.md`
