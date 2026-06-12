# Status

open

**Viral sharing not shipped.** Build-guide **24-viral-sharing** is complete (7 files, docs only). Zero `BrioelaMoment` / `DiscoveryCard` / privacy scrub production code in `backend/`, `shared/`, `mobile/`. Cross-feature trigger drafts exist in **48** (Encore) and **44** (Kids) only. Monorepo documents `mobile/features/viral.sharing/` — folder not created.

# Shipped in backend (partial / unrelated)

- [x] `build-guide/24-viral-sharing/` (7 files) — docs complete per session **028**
- [x] `brioela-specs/25-viral-growth-and-sharing.md` — primary spec
- [x] `_records/connections/21-viral-sharing-connections.md` — ledger
- [x] `_records/build-order/23-layer-viral-sharing.md` — layer deps
- [x] `_records/session-log/028-viral-sharing-complete.md` — session log
- [x] `_features/48-encore/draft/encore.discovery.card.trigger.gap.md` — trigger stub draft
- [x] `_features/44-kids-mode/draft/kids.share.card.*.gap.md` — payload draft
- [ ] `shared/constants/viral.sharing/`
- [ ] `shared/validator/viral.sharing/`
- [ ] `_policies/viral.sharing/privacy.scrub.discovery.card.policy.ts`
- [ ] `_helpers/viral.sharing/` scrub + score + render
- [ ] `_handlers/viral.sharing/`
- [ ] `discovery_card_offer` Brain table
- [ ] `/api/viral.sharing/*`
- [ ] `mobile/features/viral.sharing/`
- [ ] Discovery Card + scrub tests
- [ ] Extension card types in shared enum (**G2**)
- [ ] **52** Artifact Layer wired for card render (**G28**)
- [ ] Per-feature emitter integration (**24**, **26**, **29**, **33**, **34**, **41**, **48**, **53**, …)

# Blocked by

- 02-platform-design-system (Discovery Card visual templates)
- 52-generative-grammar (Artifact Layer render — fallback static OK for v1)
- Feature emitters (moments require shipped or stubbed **24**, **29**, **34**, **44**, **48**, **53**, …)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `shared/constants/viral.sharing/` | `rg discovery.card.type backend/src shared/` — zero |
| G2 | **Extension `DiscoveryCardType` values missing from build-guide enum** | `encore_first_cook`, `weekly_summary`, `harvest_chapter`, `harvest_cover` in specs **44**, **16**, **49** — not in `02-discovery-card-system.md` union |
| G3 | No `BrioelaMoment` Zod schema | `01-shareable-moment-taxonomy.md` — not in `shared/validator/` |
| G4 | No `DiscoveryCard` Zod schema | `02-discovery-card-system.md` — not in repo |
| G5 | No `PrivacyScrubResult` schema | `03-privacy-scrub-and-consent.md` — not in repo |
| G6 | No privacy scrub policy | Critical path — zero `_policies/viral.sharing/` |
| G7 | No `scoreShareMoment` helper | `01` threshold logic — not implemented |
| G8 | No `discovery_card_offer` Brain table | No audit trail for offer/preview/share |
| G9 | No `emitBrioelaMoment` handler | Feature emitters have no RPC target |
| G10 | No `requestDiscoveryCard` API | `encore.discovery.card.trigger` imports missing `viral.sharing.api` |
| G11 | No `confirmDiscoveryCardShare` consent path | `ShareConsentLevel` not enforced in code |
| G12 | No static card renderer | Artifact Layer + design system templates missing |
| G13 | No mobile `discovery.card.preview.sheet` | Never auto-open share sheet rule untested |
| G14 | No suppression state | `06` two-dismissals/week — no storage |
| G15 | No attribution / deep-link tables | `05`, Harvest `04` install tags — not built |
| G16 | No metrics instrumentation | `06-growth-metrics-and-suppression.md` events — none |
| G17 | Scanner Share action unwired | `07-scanner/04` table lists Share — no **51** call |
| G18 | Kids share card unwired | **44** payload draft only; **51** renderer missing |
| G19 | Encore first-cook trigger unwired | **48** G24 — depends on **51** G10 |
| G20 | Mesa Discovery Cards future-ready only | `26-mesa/10-tiering-and-rollout.md` — **41** not shipped |
| G21 | Cook Together card unwired | `08-cooking-session` — no share hook |
| G22 | Weekly summary `shareable_moment` unwired | **34** spec field — no **51** consumer |
| G23 | Harvest pre-render share transport unwired | **53** step 6 — **51** share bridge missing |
| G24 | `personal_response` opt-in UI missing | **36** + `03-privacy-scrub` — blocked default only in docs |
| G25 | `ground_find` card gate unwired | **27** must approve find before **51** accepts payload |
| G26 | `creator_recipe` verified_profile firewall unwired | **46** policy in docs only |
| G27 | Community notes / map share moments unspecified | Spec **25** lists; build-guide `04` has no dedicated type — **G2** class |
| G28 | **52** lists **51** as blocker | `52-generative-grammar/status.md` — Artifact Layer ordering |
| G29 | Share-sheet acquisition not **51** | **25** + **03** own extension; **51** owns card attribution only |
| G30 | No viral-sharing tests | `rg discovery.card *.test.ts` — zero |
| G31 | Layer ledger omits **48**/**53** card types | `_records/build-order/23-layer-viral-sharing.md` stale vs product specs |
| G32 | Spec **25** Cook Together + weekly summary | Documented in product spec; cook_together in enum; weekly_summary extension only in **34** |

# 51 vs neighbor boundaries

| In **51** (this feature) | In separate feature |
|---|---|
| Moment scoring + suppression | Scan verdict surprise detection (**24**) |
| Privacy scrub + consent | Kids explanation content (**44**) |
| Static Discovery Card render | Harvest chapter composition (**53**) |
| Preview + share sheet bridge | Encore first-cook UI trigger (**48**) |
| Attribution metrics | Recipe share-sheet import (**25**) |
| `kids_learning` card render | `KidsShareCard` payload build (**44**) |
| Grammar document for card layout | Grammar renderer runtime (**52**) |
| Deep link install tags | Passport QR/link handoff (**47**) |
| Public-safe share image | Heirloom private family copy (**49**) |

# Sources

- `brioela-specs/25-viral-growth-and-sharing.md`
- `build-guide/24-viral-sharing/`
- `_records/connections/21-viral-sharing-connections.md`
- `_records/build-order/23-layer-viral-sharing.md`
- `_records/session-log/028-viral-sharing-complete.md`
- Neighbor `_features/44-kids-mode/`, `47-passport/`, `48-encore/`, `49-heirloom/`, `52-generative-grammar/`, `53-harvest/`
