# Verified Profiles — Build

Feature **46**. Production paths under `shared/drizzle/schema/verified.*.ts`, `shared/validator/verified/`, `shared/routes/verified.routes.ts`, `backend/src/api/verified/`, `backend/src/agents/brain/_schemas/practitioner.client.*.ts`, `backend/src/agents/brain/_handlers/verified/`, `backend/src/agents/brain/_helpers/verified/`, `backend/src/agents/brain/tools/verified/` (if agent mutations needed), `backend/src/core/admin/verification-review/` (internal), and `mobile/features/verified-profiles/`.

**Depends on:** **03** auth + role gating; **04** Brain DO routing; **23** `medical_condition_profiles` + `practitioner_condition_annotations` schema; **28** `map_place` table (write `verification_status`); **43** Signet `checkTierAccess`; **25** recipe attribution hooks; **26** menu transparency read path.

**Blocks:** Signet B2B product surface; practitioner-guided client workflows; verified map badge writer; creator attribution loop completion.

**Scope:** Verified person/business Postgres tables, verification application + admin review, Signet gates, practitioner–client relationship in client Brain DO, scope-gated RPCs, annotation write handlers (table DDL in **23**), business transparency fields, `featured_listing`, creator video storage + firewall ranker, aggregate analytics APIs, public profile surfaces, mobile owner/practitioner dashboards. **Not in 46 build:** Signet Stripe/Superwall SKU mapping (**43**), condition detection/rules (**23**), map render/rank (**28**), Mesa tables (**41**), Bela Veriff KYC (**42**), viral card generation (**51**), Passport PDF (**47**).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/23-verified-profiles/` (8 files) | ✓ docs only |
| `brioela-specs/18-verified-business-and-practitioner-profiles.md` | ✓ spec (legacy table names) |
| `_records/connections/20-verified-profiles-connections.md` | ✓ ledger |
| `_records/build-order/22-layer-verified-profiles.md` | ✓ ledger |
| `_records/session-log/027-verified-profiles-complete.md` | ✓ session log (build-guide complete) |
| **43** Signet FeatureActions in tier matrix draft | ✓ docs only |
| **28** `map_place.verification_status` in draft | ✓ docs only |
| **23** `practitioner_condition_annotations` in draft | ✓ docs only |
| Verified profile Supabase schemas | ✗ |
| Practitioner client Brain tables | ✗ |
| `/api/verified/*` routes | ✗ |
| Admin verification review | ✗ |
| Mobile `features/verified-profiles/` | ✗ |
| Creator video firewall | ✗ |
| Verified profile tests | ✗ |

**Zero verified-profile production code.** `rg 'verified_profile|verified_business|practitioner_client|PractitionerClient' backend/src shared/ mobile/` — no matches (2026-06-12).

---

## File manifest

### Shared constants (**46**)

| File | Role |
|---|---|
| `shared/constants/verified/verification.status.constant.ts` | `VerificationStatus`, transitions |
| `shared/constants/verified/verified.profile.kind.constant.ts` | Two-lane kind + subtype enums |
| `shared/constants/verified/practitioner.client.scope.constant.ts` | Scope union + metadata |
| `shared/constants/verified/creator.video.limits.constant.ts` | Firewall surface caps |
| `shared/constants/verified/index.ts` | Barrel |

### Shared validator + routes (**46**)

| File | Role |
|---|---|
| `shared/validator/verified/verified.person.profile.schema.ts` | Person profile Zod |
| `shared/validator/verified/verified.business.profile.schema.ts` | Business profile Zod |
| `shared/validator/verified/verification.application.schema.ts` | Apply + evidence payload |
| `shared/validator/verified/practitioner.client.relationship.schema.ts` | Relationship + scopes |
| `shared/validator/verified/verified.creator.video.schema.ts` | Creator video + step markers |
| `shared/validator/verified/featured.listing.schema.ts` | Featured listing |
| `shared/validator/verified/verified.analytics.schema.ts` | Aggregate analytics response |
| `shared/validator/verified/index.ts` | Barrel |
| `shared/routes/verified.routes.ts` | `VERIFIED_ROUTES` path constants |

### Supabase Drizzle schemas (**46**)

| File | Role |
|---|---|
| `shared/drizzle/schema/verified.person.profile.schema.ts` | `verified_profiles` table |
| `shared/drizzle/schema/verified.business.profile.schema.ts` | `verified_businesses` table |
| `shared/drizzle/schema/verified.creator.video.schema.ts` | `verified_creator_videos` |
| `shared/drizzle/schema/featured.listing.schema.ts` | `featured_listings` |
| `shared/drizzle/schema/verification.review.event.schema.ts` | Admin audit append-only |
| `shared/drizzle/schema/index.ts` | Export + migration (**01**) |

### Brain SQLite schemas — client DO (**46** + **23** annotation DDL)

| File | Role | Owner |
|---|---|---|
| `_schemas/practitioner.client.relationship.schema.ts` | `practitioner_client_relationships` | **46** |
| `_schemas/practitioner.client.scope.event.schema.ts` | Scope grant/revoke audit | **46** |
| `_schemas/practitioner.condition.annotation.schema.ts` | `practitioner_condition_annotations` | **23** DDL — register in **04** migration |
| `_schemas/index.ts` | Export + migration registration | **04** |

### Backend API — verified module (**46**)

| File | Role |
|---|---|
| `backend/src/api/verified/verified.route.ts` | Hono mount `/api/verified` |
| `backend/src/api/verified/verified.controller.ts` | Controller wiring |
| `backend/src/api/verified/_handlers/post.verification.application.handler.ts` | Apply for verification |
| `backend/src/api/verified/_handlers/get.verified.profile.handler.ts` | Public profile read |
| `backend/src/api/verified/_handlers/patch.verified.business.transparency.handler.ts` | Owner updates transparency JSON |
| `backend/src/api/verified/_handlers/post.practitioner.connection.request.handler.ts` | Practitioner invites client |
| `backend/src/api/verified/_handlers/post.practitioner.connection.respond.handler.ts` | User accept/reject |
| `backend/src/api/verified/_handlers/delete.practitioner.connection.handler.ts` | User revoke |
| `backend/src/api/verified/_handlers/get.practitioner.clients.handler.ts` | Practitioner dashboard list |
| `backend/src/api/verified/_handlers/get.verified.analytics.handler.ts` | Aggregate owner analytics |
| `backend/src/api/verified/_handlers/get.verified.creator.videos.handler.ts` | Firewall-filtered video list |
| `backend/src/api/verified/_handlers/index.ts` | Barrel |
| `backend/src/api/verified/index.ts` | Module export |

Register in backend app router (**01**).

### Brain handlers — scope-gated client data (**46**)

| File | Role |
|---|---|
| `_handlers/verified/read.practitioner.client.conditions.handler.ts` | Scope: `active_conditions` → **23** read |
| `_handlers/verified/write.practitioner.annotation.handler.ts` | Scope: `condition_annotations` → **23** write |
| `_handlers/verified/check.practitioner.client.access.helper.ts` | **Canonical** scope gate — all practitioner reads/writes |
| `_handlers/verified/link.verified.business.to.map.place.handler.ts` | Sets `map_place.verification_status` (**28**) |
| `_handlers/verified/sync.verification.expiry.handler.ts` | Expire badges + disable privileges |
| `_handlers/verified/index.ts` | Barrel |

### Brain helpers (**46**)

| File | Role |
|---|---|
| `_helpers/verified/aggregate.verified.profile.analytics.helper.ts` | Privacy-safe rollups |
| `_helpers/verified/evaluate.creator.video.firewall.helper.ts` | Relevance checks + caps |
| `_helpers/verified/count.active.practitioner.clients.helper.ts` | Enforce 10-client limit |
| `_helpers/verified/validate.verification.evidence.helper.ts` | Automated completeness |
| `_helpers/verified/map.business.transparency.to.menu.source.helper.ts` | **26** read adapter |
| `_helpers/verified/index.ts` | Barrel |

### Entitlement wrapper (**46** → **43**)

| File | Role |
|---|---|
| `_helpers/pricing/check.verified.profile.entitlement.helper.ts` | Thin wrapper: `verified_profile`, `verified_business`, `practitioner_multi_client` |

### Admin / internal review (**46**)

| File | Role |
|---|---|
| `backend/src/core/admin/verification-review/list.pending.applications.handler.ts` | Admin queue |
| `backend/src/core/admin/verification-review/decide.verification.application.handler.ts` | Approve/reject/suspend |
| `backend/src/core/admin/verification-review/index.ts` | Barrel |

Human review required for practitioner credentials — **no LLM auto-approve** (`02-verification-flow.md`).

### Mobile (**46**)

| File | Role |
|---|---|
| `mobile/features/verified-profiles/verified.profiles.feature.tsx` | Entry + role routing |
| `mobile/features/verified-profiles/components/verification.application.form.tsx` | Apply flow |
| `mobile/features/verified-profiles/components/practitioner.dashboard.tsx` | Client list + guidance |
| `mobile/features/verified-profiles/components/business.transparency.editor.tsx` | Menu/product transparency |
| `mobile/features/verified-profiles/components/client.connection.consent.sheet.tsx` | Scope picker before accept |
| `mobile/features/verified-profiles/components/public.profile.screen.tsx` | Public person/business page |
| `mobile/features/verified-profiles/hooks/use.verified.profile.ts` | API client |
| `mobile/features/verified-profiles/hooks/use.practitioner.clients.ts` | Client relationships |
| `mobile/network/verified/verified.api.ts` | Typed fetch wrappers |

### Cross-feature integration hooks (call sites — not owned by **46**)

| File | Role | Owner |
|---|---|---|
| `backend/src/api/map/_helpers/apply.featured.listing.rank.helper.ts` | Trust-bounded boost | **28** |
| `backend/src/api/scan/_helpers/attach.practitioner.annotations.helper.ts` | Scan expanded detail | **24** + **46** read |
| `backend/src/agents/brain/_handlers/recipe/attach.verified.creator.attribution.helper.ts` | Recipe import | **25** |

---

## Acceptance criteria

### Verification

- [ ] User without Signet receives `requires_upgrade` from entitlement check on apply.
- [ ] Application stores evidence; status `draft` → `pending_review` on submit.
- [ ] Practitioner credential applications require human admin decision — no automated approve for regulated claims.
- [ ] `verified` status enables public badge + subtype capabilities; `suspended`/`expired` hides badge within one request.
- [ ] Practitioner verification expiry disables `clientFeaturesEnabled` and active client scopes.

### Practitioner–client boundary

- [ ] Practitioner cannot read client conditions without `active` relationship + `active_conditions` scope.
- [ ] User sees exact scope list before accept; reject leaves no data access.
- [ ] Revoke stops access immediately; practitioner API returns 403 on subsequent reads.
- [ ] Practitioner cannot call `confirm_medical_condition` or write `medical_condition_profiles` (**23** tools blocked at RPC layer).
- [ ] Practitioner cannot read Mesa tables (**41**) — RPC returns 403 without future scope.
- [ ] Annotation write creates **23** row only when `condition_annotations` scope active.
- [ ] Active client count capped at **10** per practitioner.

### Business + map

- [ ] Verified business with `place_id` sets `map_place.verification_status = 'verified'` (**28** column).
- [ ] Business transparency JSON surfaced as source — does not override user-specific scan verdict.
- [ ] Verified business cannot pay to suppress allergy/recall/community warnings.

### Creator

- [ ] Creator video surfaces only on allowed contexts (`07-creator-video-firewall.md` list).
- [ ] Browse/search returns ≤10 firewall-approved videos.
- [ ] No infinite vertical feed route exists in mobile.

### Analytics

- [ ] Owner analytics responses contain no individual user identity or condition breakdowns.
- [ ] Featured listing labeled when paid; ranking still loses to hard safety conflicts.

### Tests

- [ ] Scope gate unit tests: every practitioner handler calls `checkPractitionerClientAccess`.
- [ ] Revocation integration test: 403 after revoke.
- [ ] Client limit test: 11th link rejected.
- [ ] Map sync test: business verify updates `verification_status`.

---

## Draft folder

See `draft/gap-index.md` — **21** gap/intended snapshots + index.

---

## Sources

- `build-guide/23-verified-profiles/` (00–07)
- `brioela-specs/18-verified-business-and-practitioner-profiles.md`
- `_records/build-order/22-layer-verified-profiles.md`
- `_features/23-medical-conditions/draft/practitioner.condition.annotation.schema.gap.md`
- `_features/28-map/draft/map.place.schema.gap.md`
- `_features/43-pricing-tiers/draft/tier.entitlement.matrix.constant.gap.md`
