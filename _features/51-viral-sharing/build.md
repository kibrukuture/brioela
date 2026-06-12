# Viral Sharing — Build

Feature **51**. Production paths under `shared/constants/viral.sharing/`, `shared/validator/viral.sharing/`, `shared/routes/viral.sharing.routes.ts`, `shared/contracts/viral.sharing.contract.ts`, `backend/src/agents/brain/_schemas/discovery.card.*.ts`, `backend/src/agents/brain/_policies/viral.sharing/`, `backend/src/agents/brain/_helpers/viral.sharing/`, `backend/src/agents/brain/_handlers/viral.sharing/`, `backend/src/api/viral.sharing/`, `backend/src/jobs/viral.sharing/` (attribution rollup optional), and `mobile/features/viral.sharing/`.

**Scope:** `DiscoveryCardType` + extension types, `BrioelaMoment` / `DiscoveryCard` / `PrivacyScrubResult` Zod contracts, moment scoring, mandatory privacy scrub policy, `discovery_card_offer` Brain audit table, suppression state, `emitBrioelaMoment` + `requestDiscoveryCard` + `confirmDiscoveryCardShare` handlers, static Artifact Layer render hook for **52**, preview sheet + share sheet bridge, deep-link attribution records, metrics events, API routes. **Not in 51 build:** Scanner verdict body (**24**), Kids explanation LLM (**44**), Mesa engine (**41**), menu parser (**26**), Harvest composition (**53**), Encore reconstruction (**48**), Ground find gate (**27**), receipt spend math (**33**), weekly summary generation body (**34**), share-sheet import classifier (**25**), Passport blocks (**47**), grammar renderer core (**52**), per-feature trigger UI (stay in emitter features).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/24-viral-sharing/` (7 files) | ✓ docs only |
| `brioela-specs/25-viral-growth-and-sharing.md` | ✓ spec |
| `_records/connections/21-viral-sharing-connections.md` | ✓ ledger |
| `_records/build-order/23-layer-viral-sharing.md` | ✓ ledger |
| `_records/session-log/028-viral-sharing-complete.md` | ✓ session log |
| `mobile/features/viral.sharing/` folder name in monorepo doc | ✓ naming only |
| Cross-feature trigger drafts (**48**, **44**) | ✓ gap drafts only |
| Brain/API/shared viral-sharing code | ✗ |
| Discovery Card tests | ✗ |

**Zero viral-sharing production code.** `rg 'discovery.?card|BrioelaMoment|privacyScrub|viral.sharing' backend/src shared/ mobile/` — no matches.

---

## File manifest

### Shared constants (**51**)

| File | Role |
|---|---|
| `shared/constants/viral.sharing/discovery.card.type.constant.ts` | Baseline 11 + extension 4 types |
| `shared/constants/viral.sharing/share.consent.level.constant.ts` | `none` \| `preview_confirmed` \| `explicit_sensitive_opt_in` |
| `shared/constants/viral.sharing/discovery.card.cta.constant.ts` | Allowed attribution lines per card type |
| `shared/constants/viral.sharing/share.moment.threshold.constant.ts` | Score floors for offer prompt |
| `shared/constants/viral.sharing/index.ts` | Barrel |

### Shared validators (**51**)

| File | Role |
|---|---|
| `shared/validator/viral.sharing/brioela.moment.schema.ts` | Emitter contract |
| `shared/validator/viral.sharing/discovery.card.schema.ts` | Post-scrub card shape |
| `shared/validator/viral.sharing/privacy.scrub.result.schema.ts` | Scrub output |
| `shared/validator/viral.sharing/share.moment.score.schema.ts` | Scoring struct |
| `shared/validator/viral.sharing/request.discovery.card.schema.ts` | API: feature → preview |
| `shared/validator/viral.sharing/confirm.discovery.card.share.schema.ts` | API: consent + share |
| `shared/validator/viral.sharing/discovery.card.payload.union.schema.ts` | Per-type payload discriminated union |
| `shared/validator/viral.sharing/index.ts` | Barrel |
| `shared/routes/viral.sharing.routes.ts` | `VIRAL_SHARING_ROUTES` |
| `shared/contracts/viral.sharing.contract.ts` | ts-rest request/preview/confirm |

### Supabase Postgres (**51** — attribution only)

| File | Role |
|---|---|
| `shared/drizzle/schema/discovery.card.attribution.schema.ts` | Anonymous install/open tags by `cardType` + campaign |
| `supabase/migrations/*_discovery_card_attribution.sql` | Indexes |

### Brain SQLite schemas (**51**)

| File | Role |
|---|---|
| `_schemas/discovery.card.offer.schema.ts` | Offer/preview/share audit per moment |
| `_schemas/share.prompt.suppression.schema.ts` | Dismissal counts + window |
| `_schemas/index.ts` | Export + migration registration (**04**) |

### Brain policies (**51**)

| File | Role |
|---|---|
| `_policies/viral.sharing/privacy.scrub.discovery.card.policy.ts` | Blocked fields, safe rewrites, business language |
| `_policies/viral.sharing/creator.attribution.card.policy.ts` | **46** verified_profile firewall |
| `_policies/viral.sharing/index.ts` | Barrel |

### Brain helpers — scoring + scrub (**51**)

| File | Role |
|---|---|
| `_helpers/viral.sharing/score.share.moment.helper.ts` | `ShareMomentScore` computation |
| `_helpers/viral.sharing/scrub.discovery.card.payload.helper.ts` | Returns `PrivacyScrubResult` |
| `_helpers/viral.sharing/build.discovery.card.from.moment.helper.ts` | Moment + scrub → `DiscoveryCard` |
| `_helpers/viral.sharing/should.suppress.share.prompt.helper.ts` | Dismissal rules |
| `_helpers/viral.sharing/build.discovery.card.grammar.document.helper.ts` | **52** Artifact Layer input |
| `_helpers/viral.sharing/render.discovery.card.static.helper.ts` | PNG/WebP artifact (R2 or inline base64) |
| `_helpers/viral.sharing/build.discovery.card.deep.link.helper.ts` | Tagged attribution URL |
| `_helpers/viral.sharing/index.ts` | Barrel |

### Brain handlers (**51**)

| File | Role |
|---|---|
| `_handlers/viral.sharing/emit.brioela.moment.handler.ts` | Feature RPC — queue moment |
| `_handlers/viral.sharing/request.discovery.card.handler.ts` | Score + scrub + return preview |
| `_handlers/viral.sharing/confirm.discovery.card.share.handler.ts` | Consent + render + audit |
| `_handlers/viral.sharing/record.share.prompt.dismissal.handler.ts` | Suppression write |
| `_handlers/viral.sharing/index.ts` | Barrel |

### Backend API (**51**)

| File | Role |
|---|---|
| `backend/src/api/viral.sharing/viral.sharing.route.ts` | Hono mount |
| `backend/src/api/viral.sharing/viral.sharing.controller.ts` | Wiring |
| `backend/src/api/viral.sharing/_handlers/post.discovery.card.request.handler.ts` | Preview |
| `backend/src/api/viral.sharing/_handlers/post.discovery.card.confirm.handler.ts` | Share confirm |
| `backend/src/api/viral.sharing/_handlers/get.discovery.card.attribution.handler.ts` | Deep link resolve (edge) |
| `backend/src/api/viral.sharing/index.ts` | Module export |

Register in backend app router (**01**).

### Mobile (**51**)

| File | Role |
|---|---|
| `mobile/features/viral.sharing/components/discovery.card.preview.sheet.tsx` | Preview + consent |
| `mobile/features/viral.sharing/components/discovery.card.share.actions.tsx` | Share / save / dismiss |
| `mobile/features/viral.sharing/hooks/use.discovery.card.preview.hook.ts` | Request + confirm flow |
| `mobile/network/viral.sharing/viral.sharing.api.ts` | API client |
| `mobile/network/viral.sharing/use.discovery.card.hook.ts` | TanStack mutation |

### Integration entry surfaces (emitters call **51** — triggers stay in owner features)

| Surface | Owner | **51** entry |
|---|---|---|
| Scan result Share action | **24** | `emitBrioelaMoment` `scan_discovery` / `swap` |
| Kids "Share this learning moment" | **44** | `kids_learning` payload → `requestDiscoveryCard` |
| Menu scan share CTA | **26** | `menu_reality` |
| Mesa compatibility moment | **41** | `mesa_compatibility` |
| Heritage capture complete | **13** / **49** | `recipe_preservation` |
| Verified creator cook complete | **25** + **46** | `creator_recipe` |
| Cooking room session end | **29** | `cook_together` (both participants) |
| Receipt savings surfacing | **33** | `savings` |
| Ground find approved | **27** | `ground_find` |
| CGM insight opt-in share | **36** | `personal_response` (explicit opt-in) |
| Encore first cook complete | **48** | `encore_first_cook` via `requestDiscoveryCard` |
| Weekly summary share line | **34** | `weekly_summary` |
| Harvest chapter/cover share | **53** | Pre-rendered artifact + **51** share transport |

### Tests (**51**)

| File | Role |
|---|---|
| `_policies/viral.sharing/privacy.scrub.discovery.card.policy.test.ts` | Allergy/child/Mesa/glucose blocked |
| `_helpers/viral.sharing/scrub.discovery.card.payload.helper.test.ts` | Safe rewrites |
| `_helpers/viral.sharing/should.suppress.share.prompt.helper.test.ts` | 2-dismiss/week |
| `_helpers/viral.sharing/score.share.moment.helper.test.ts` | Threshold gating |
| `post.discovery.card.request.handler.test.ts` | End-to-end preview blocked on `sensitivity: blocked` |

---

## Acceptance criteria

### Core pipeline

- [ ] No production path renders a share image without `scrubDiscoveryCardPayload` returning `allowed: true`.
- [ ] `personal_response` cards return `blocked` unless consent is `explicit_sensitive_opt_in`.
- [ ] Preview sheet shown before system share sheet opens — never auto-share.
- [ ] `shouldSuppressSharePrompt` stops repeat prompts after two dismissals in seven days.
- [ ] `scoreShareMoment` below threshold → no offer UI (scanner green/normal scans silent).

### Privacy scrub (must-pass cases from `03-privacy-scrub-and-consent.md`)

- [ ] Child name in payload → redacted/blocked.
- [ ] Mesa member names → generalized table wording.
- [ ] Raw glucose values → blocked default.
- [ ] "Restaurant is unsafe" from single menu scan → blocked.
- [ ] Kids hard allergy → safe family wording only.

### Card types

- [ ] All 11 baseline `DiscoveryCardType` values have payload union branch + CTA constant.
- [ ] Extension types `encore_first_cook`, `weekly_summary`, `harvest_chapter`, `harvest_cover` registered (**G2**).
- [ ] `ground_find` rejected if source find lacks **27** approved public flag.
- [ ] `creator_recipe` rejected if creator not `verified_profile`.

### Attribution + metrics

- [ ] Shared artifacts include quiet CTA only — no referral codes.
- [ ] Harvest shares use distinct attribution tag (per `36-harvest/04-share-cards.md`).
- [ ] Metrics: offer, preview, share completion, install/open (no PII in events).

### Boundaries

- [ ] Passport generation does not call **51** pipeline.
- [ ] Heirloom DO-to-DO delivery does not call **51** pipeline.
- [ ] **52** grammar failure falls back to static template render — share not blocked.
- [ ] Share-sheet recipe import remains **25** — not duplicated in **51**.

### Cross-feature triggers (integration tests with stubs)

- [ ] **48** `encore.discovery.card.trigger` calls `requestDiscoveryCard` with `encore_first_cook`.
- [ ] **44** `KidsShareCard` validates against `kids_learning` payload branch.
- [ ] **53** chapter `share_card_ref` opens **51** share transport without re-scrubbing excluded categories.

---

## Build order notes

Per `_records/build-order/23-layer-viral-sharing.md`: depends on scanner, cooking session, pantry/meal plan, menu scanning, recipe ingestion, wearables (privacy boundary), kids mode, verified profiles. **Also requires:** design system templates (**02**), generative grammar Artifact Layer (**52**) for composed layouts, feature emitters shipped or stubbed for integration tests.

**Recommended implementation sequence:**

1. Shared constants + Zod contracts + scrub policy (tests first).
2. Brain `discovery_card_offer` + handlers (preview/confirm without render).
3. Static render fallback (design system only).
4. Wire **52** grammar document builder.
5. Mobile preview sheet + API.
6. Per-feature emitter integration one card type at a time (`scan_discovery` → `kids_learning` → …).

---

## Sources

- `brioela-specs/25-viral-growth-and-sharing.md`
- `build-guide/24-viral-sharing/`
- `_records/build-order/23-layer-viral-sharing.md`
- `build-guide/02-coding-standards/01-monorepo-and-folder-structure.md` (`viral.sharing/`)
