# Verified Profiles — Spec

Feature **46**. Verified person (`verified_profile`) and verified business (`verified_business`) profiles on Brioela: application and credential review, Signet-tier gating, consent-based practitioner–client relationships, condition-annotation write path (shape from **23**), verified map listing and transparency surfaces (display from **28**), creator/chef recipe attribution, creator video relevance firewall, and privacy-safe aggregate analytics. Not a social network, marketplace-first product, or telehealth platform.

**Not in this feature:** Signet SKU billing, webhook tier sync, `checkTierAccess` matrix body (**43** — **46** calls `verified_profile` / `verified_business` / `practitioner_multi_client` gates); medical condition detection, `condition_rule` config, clinical flag evaluation (**23** — **46** reads active conditions only inside granted scope); Mesa tables, Food Audience, compatibility engine (**41** — practitioners cannot access Mesa member data without future explicit scope); healthy map rendering, `map_place` schema, nearby ranking (**28** — consumes `verification_status` written here); Bela shopper Veriff KYC pipeline (**42** — separate identity use case); recipe ingestion pipeline body (**25** — consumes verified attribution); menu scan intelligence (**26**); Ground authenticity (**27**); viral share card scrub rules (**51** — scrubs practitioner/client data); Passport generation body (**47** — may include user-approved practitioner notes); guard/lexicon/reading-gate tooling.

**Living catalog note:** `VerifiedProfileKind`, subtype strings, and scope enums may grow. New practitioner scopes require legal/privacy review before activation. Verification provider choice for person/business credentials is **admin review first** — not instant self-serve for regulated claims.

---

## Purpose

Consumers need trusted food businesses and credentialed practitioners without turning Brioela into Yelp, LinkedIn, or a medical records system. Verified Profiles supply structured trust infrastructure: badges, transparency fields, consent-scoped client guidance, and map/listing attribution — gated on Signet and bounded by strict privacy rules.

Without **46**, spec **18**'s B2B lane has no implementation home, practitioners cannot link to clients, verified map badges have no writer, and **23**'s `PractitionerConditionAnnotation` consent path stays undefined.

---

## Product definition

| Term | Meaning |
|---|---|
| **`verified_profile`** | Top-level kind for a verified **person** (dietitian, clinician, chef, creator, …) |
| **`verified_business`** | Top-level kind for a verified **organization/place** (restaurant, brand, grocery, …) |
| **Subtype** | Capability discriminator within a kind — not a third top-level type |
| **`VerificationStatus`** | `draft` \| `pending_review` \| `verified` \| `rejected` \| `suspended` \| `expired` |
| **Signet** | B2B subscription tier (**43**) — from `$99/mo`; unlocks verified profile tools |
| **Practitioner–client relationship** | Consent-based, scoped, revocable link between `verified_profile` practitioner and user |
| **`PractitionerClientScope`** | Granted permissions — never default-all |
| **Transparency fields** | Business-provided menu/allergen/product metadata — shown as a **source**, not universal safety |
| **Creator video firewall** | Relevance-gated surfacing of step videos — no infinite feed |
| **`featured_listing`** | Paid/boosted visibility within trust constraints — cannot override safety ranking |
| **No pay-to-safety** | Verified status cannot buy better verdicts or suppress warnings |

**Design principle (non-negotiable):** Practitioner access is **user-granted, scoped, and revocable**. No practitioner views client medical data, scan history, Mesa members, or brain memory because they are verified. Verified badge means identity/claims were reviewed — not that Brioela endorses all advice.

**Two-lane rule (product direction, session 027):** Exactly two top-level kinds. Creator/chef is a `verified_profile` subtype — never a third top-level `creator` kind.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/23-verified-profiles/`, `brioela-specs/18-verified-business-and-practitioner-profiles.md`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/23`, `28`, `41`, `42`, `43`, `51`.

| # | Component | Type | In **46**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **Two-lane taxonomy** | Product model | **Yes** | No | `verified_profile` \| `verified_business` | `01-profile-types.md` |
| 2 | **`VerifiedEntity` base shape** | Shared type | **Yes** | No | kind + subtype + status | `01-profile-types.md` |
| 3 | **Person subtypes** | Enum | **Yes** | No | dietitian, clinician, chef, creator, … | `01`, `04-verified-profile.md` |
| 4 | **Business subtypes** | Enum | **Yes** | No | restaurant, brand, grocery, … | `01`, `03-verified-business.md` |
| 5 | **`verified_profiles` Supabase table** | Postgres | **Yes** | No | Person lane storage | spec 18, `04` |
| 6 | **`verified_businesses` Supabase table** | Postgres | **Yes** | No | Business lane + `place_id` | `03-verified-business.md` |
| 7 | **Verification application flow** | API + admin | **Yes** | No | draft → pending → verified | `02-verification-flow.md` |
| 8 | **Evidence collection** | Upload/metadata | **Yes** | No | License, ownership, domain proof | `02` |
| 9 | **Human/admin credential review** | Ops | **Yes** | No | Regulated claims — no LLM approve | `02` |
| 10 | **Renewal + expiry** | Cron/dashboard | **Yes** | No | Badge drop; practitioner privileges off | `02` |
| 11 | **Suspension / abuse** | Admin | **Yes** | No | Immediate badge hide | `02` |
| 12 | **Signet tier gate** | **43** consumer | **Cross** | No | `verified_profile`, `verified_business`, `practitioner_multi_client` | `06-analytics-and-revenue.md`, **43** |
| 13 | **Client limit (10)** | Policy | **Yes** | No | Per practitioner account | spec **19**, `04` |
| 14 | **`practitioner_client_relationship` Brain table** | Brain SQLite | **Yes** | No | Consent record in **client** DO | `05-client-and-practitioner-boundary.md` |
| 15 | **`PractitionerClientScope` scopes** | Policy + schema | **Yes** | No | active_conditions, annotations, … | `05` |
| 16 | **Invite / request connection flow** | API + mobile | **Yes** | No | User sees exact scope before accept | `05` |
| 17 | **Revocation** | Handler | **Yes** | No | Immediate access stop + audit | `05` |
| 18 | **Scope-gated condition read** | Brain RPC | **Cross** | No | Reads **23** `medical_condition_profiles` | `05`, **23** |
| 19 | **`practitioner_condition_annotations` table** | Brain SQLite | **Boundary** | No | Schema **23**; write path **46** | `06-practitioner-privacy-boundary.md`, **23** draft |
| 20 | **Annotation surfaces** | UI integration | **Cross** | No | Scan/condition detail if scoped | **23** `04-scan-verdict-integration` |
| 21 | **Practitioner cannot set condition** | Policy | **Yes** | No | User owns activation | `05`, **23** |
| 22 | **No Mesa access by default** | Policy | **No** | No | Future explicit scope only | `05`, **41** |
| 23 | **No telehealth** | Policy | **Yes** | No | No appointments, Rx, diagnosis | `05` |
| 24 | **Map `verification_status` write** | **28** consumer | **Cross** | No | `verified` when business linked | `03`, **28** `map_place` draft |
| 25 | **Verified map listing badge** | **28** UI | **Cross** | No | Display only in **28** | `03-verified-business.md` |
| 26 | **Ingredient transparency summary** | Business profile | **Yes** | No | Separate from Ground signals | `03` |
| 27 | **Menu/allergen transparency JSON** | Business field | **Yes** | No | Source attribution — not universal safe | `03` |
| 28 | **Product/brand metadata** | Business field | **Yes** | No | UPC mapping confidence | `03` |
| 29 | **Public person profile page** | Web/mobile | **Yes** | No | Bio, badge, public recipes if enabled | `04-verified-profile.md` |
| 30 | **Public recipe profile** | **25** consumer | **Cross** | No | Creator/chef subtype | `04`, `24-viral-sharing/05` |
| 31 | **`VerifiedCreatorVideo` + firewall** | Storage + ranker | **Yes** | No | Max 3/10 surface limits | `07-creator-video-firewall.md` |
| 32 | **Recipe import attribution loop** | **25**/**51** | **Cross** | No | Verified creator on import | `07`, viral `05` |
| 33 | **Privacy-safe business analytics** | Aggregate API | **Yes** | No | Views, scan counts — no user identity | `06-analytics-and-revenue.md` |
| 34 | **Privacy-safe person analytics** | Aggregate API | **Yes** | No | Recipe saves, client count | `06` |
| 35 | **`featured_listing` table** | Postgres | **Yes** | No | Labeled boost — no safety override | spec 18, `06` |
| 36 | **Blocked social features** | Policy | **Yes** | No | No followers, likes, comment threads | `01-profile-types.md` |
| 37 | **Wearable/CGM scope** | Future | **No** | No | Not in default practitioner scope | `05` |
| 38 | **Verification provider (Veriff)** | KYC | **No** | No | **42** Bela shoppers only — not spec'd for **46** | `02-verification-flow.md`, **42** |
| 39 | **Admin review queue** | Internal | **Yes** | No | Practitioner + business ownership | `02` |
| 40 | **Passport practitioner_guidance block** | **47** consumer | **Cross** | No | User-approved notes only | `brioela-specs/43-passport.md` |
| 41 | **Viral share scrub** | **51** consumer | **Cross** | No | Strip practitioner/client data | `24-viral-sharing/03` |
| 42 | **Mobile practitioner dashboard** | React Native | **Yes** | No | Client list, guidance tools | build manifest |
| 43 | **Mobile business owner dashboard** | React Native | **Yes** | No | Transparency + analytics | build manifest |
| 44 | **Mobile verification application UI** | React Native | **Yes** | No | Evidence upload, status | `02` |
| 45 | **Entitlement wrapper** | Brain helper | **Cross** | No | Thin `check.verified.profile.entitlement` | **43** pattern |

### Shipped in repo today (verified-profile-related)

- `build-guide/23-verified-profiles/` — **8 files complete** (docs only).
- `brioela-specs/18-verified-business-and-practitioner-profiles.md` — primary spec (legacy split table names).
- `_records/connections/20-verified-profiles-connections.md`, `_records/build-order/22-layer-verified-profiles.md`, `_records/session-log/027-verified-profiles-complete.md`.
- **28** draft `map.place.schema.gap.md` — `verification_status` column (writer = **46**, reader = **28**).
- **23** draft `practitioner.condition.annotation.schema.gap.md` — annotation table (schema **23**, consent writes **46**).
- **43** tier matrix drafts — `verified_profile`, `verified_business`, `practitioner_multi_client` FeatureActions.
- **`rg 'verified_profile|verified_business|practitioner_client|PractitionerClient|signet' backend/src shared/ mobile/`** — zero product matches (2026-06-12).
- **`rg 'veriff' backend/src shared/`** — zero; Veriff documented only under **42** Bela implementable-specs.
- Unrelated hits: `devices.last_verified_at`, brain migration `verifiedEventCount` — not this feature.

---

## Architecture — verification to client guidance

```text
User applies (mobile or web)
        │
        ▼
Signet entitlement check (**43** `verified_profile` | `verified_business`)
        │
        ▼
Supabase verified_profiles | verified_businesses
  status: draft → pending_review → verified | rejected | suspended | expired
  evidence_json, credential_summary, transparency_fields_json, place_id (business)
        │
        ├── Admin human review (practitioner credentials, ownership conflicts)
        │     └── NOT LLM-approved for regulated claims
        │
        ├── verified business + place_id
        │     └── UPDATE map_place.verification_status (**28** table) = 'verified'
        │
        └── verified_profile (practitioner subtype)
              └── client_features_enabled after stricter review

Practitioner requests client link
        │
        ▼
User sees exact PractitionerClientScope[] requested
        │
        ├── reject → relationship pending/revoked
        └── accept → practitioner_client_relationship (client Brain DO)
                    status: active, scopes granted, granted_at

Practitioner action (e.g. annotate condition)
        │
        ▼
checkPractitionerClientAccess(userId, practitionerProfileId, requiredScope)
        │
        ├── fail → 403, audit, no data leak
        └── pass → read **23** medical_condition_profiles (active only)
                    write practitioner_condition_annotations (**23** table, **46** handler)

Revocation
        │
        └── immediate scope loss; hide future annotations from active context
            (user-saved copies may remain as personal notes)
```

**Storage split:**

| Data | Store | Why |
|---|---|---|
| Verified profile/business records | Supabase Postgres | Cross-user discovery, map FK, admin review |
| Practitioner–client relationship + scopes | Client's Brain DO SQLite | Consent is per-user; practitioner reads via scoped RPC |
| Condition annotations | Client's Brain DO SQLite | **23** schema; same privacy boundary as conditions |
| Aggregate analytics | Postgres rollups or batch jobs | No per-user health traits in B2B analytics |

**Dangerous boundary:** Practitioner RPC must never return full Brain dump, Mesa tables, medications, wearables, or scan history unless explicit future scopes are designed and granted.

---

## Data model

### Shared verification enum

```typescript
type VerificationStatus =
  | 'draft'
  | 'pending_review'
  | 'verified'
  | 'rejected'
  | 'suspended'
  | 'expired'

type VerifiedProfileKind = 'verified_profile' | 'verified_business'
```

### Verified person (`verified_profiles` — Supabase)

```typescript
type VerifiedPersonProfile = {
  profileId: string
  kind: 'verified_profile'
  subtype:
    | 'dietitian'
    | 'nutritionist'
    | 'clinician'
    | 'health_practitioner'
    | 'coach'
    | 'chef'
    | 'creator'
    | 'food_educator'
  ownerUserId: string
  displayName: string
  publicSlug: string
  credentialSummary: string | null
  verificationStatus: VerificationStatus
  publicRecipeProfileEnabled: boolean
  clientFeaturesEnabled: boolean
  evidenceJson: string | null
  createdAt: number
  updatedAt: number
}
```

Practitioner subtypes (`dietitian`, `nutritionist`, `clinician`, `health_practitioner`, `coach` when approved) may receive `clientFeaturesEnabled` after credential review. Creator/chef subtypes use `publicRecipeProfileEnabled`.

### Verified business (`verified_businesses` — Supabase)

```typescript
type VerifiedBusinessProfile = {
  profileId: string
  kind: 'verified_business'
  subtype:
    | 'restaurant'
    | 'cafe'
    | 'cloud_kitchen'
    | 'meal_prep'
    | 'health_store'
    | 'grocery_store'
    | 'brand'
    | 'market'
    | 'other'
  ownerUserId: string
  displayName: string
  publicSlug: string
  placeId: string | null
  verificationStatus: VerificationStatus
  transparencyFieldsJson: string
  createdAt: number
  updatedAt: number
}
```

`transparencyFieldsJson` holds menu allergen statements, handling notes, product metadata pointers — shown as verified **source** data; user-specific verdicts remain private (**24**).

### Practitioner–client scope (client Brain DO)

```typescript
type PractitionerClientScope =
  | 'active_conditions'
  | 'condition_annotations'
  | 'recipe_guidance'
  | 'meal_plan_guidance'
  | 'scan_flag_context'

type PractitionerClientRelationship = {
  relationshipId: string
  practitionerProfileId: string
  userId: string
  scopes: PractitionerClientScope[]
  status: 'pending' | 'active' | 'revoked' | 'expired'
  grantedAt: number | null
  revokedAt: number | null
  createdAt: number
  updatedAt: number
}
```

**Not in default scope:** `mesa_members`, `wearable_data`, `cgm_data`, `full_scan_history`, `medications`, `private_notes`.

### Practitioner condition annotation (**23** owns shape; **46** owns consent gate)

```typescript
type PractitionerConditionAnnotation = {
  annotationId: string
  userId: string
  practitionerId: string
  conditionProfileId: string
  note: string
  status: 'active' | 'revoked' | 'archived'
  createdAt: number
  revokedAt: number | null
}
```

### Featured listing (Supabase)

```typescript
type FeaturedListing = {
  listingId: string
  profileId: string
  placeId: string | null
  active: boolean
  rankInputsJson: string
  labeledPaidPlacement: boolean
  createdAt: number
  updatedAt: number
}
```

Rules: paid placement labeled if user-facing; cannot override allergen/recall/condition conflicts; user-specific filters still apply first (`06-analytics-and-revenue.md`).

### Creator video (**46**)

```typescript
type VerifiedCreatorVideo = {
  videoId: string
  verifiedProfileId: string
  recipeId: string | null
  title: string
  sourceUrl: string | null
  durationSeconds: number
  stepMarkers: Array<{
    stepIndex: number
    startSecond: number
    endSecond: number
    label: string
  }>
  constraintTags: string[]
  cuisineTags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  verificationStatus: 'pending' | 'approved' | 'rejected'
}
```

Firewall limits (`07-creator-video-firewall.md`): max 3 videos in recipe suggestion context; max 1 per cooking step; max 10 per browse/search page; no home autoplay feed; no push for creator videos.

---

## Verification flow

1. User selects kind + subtype.
2. User submits required evidence (license, business registration, domain, place ownership).
3. Automated completeness checks (missing fields, duplicate claims).
4. **Human/admin review** for practitioner credentials, medical-guidance privileges, ownership conflicts.
5. On `verified`: enable badges, map link, subtype capabilities.
6. Renewal warnings before expiry; on `expired`: remove badge, disable client/condition privileges for practitioners.
7. On `suspended`/`rejected`: hide badge and privileged features immediately; factual user-facing reason on rejection.

**Verification provider:** Build guide specifies admin review — **not** instant self-serve for medical/practitioner claims. **Veriff** is specified for Bela gig shoppers (**42**) only. **46** may integrate a KYC vendor later for identity checks, but current authoritative docs do not mandate Veriff for practitioner/business verification. Do not conflate **42** shopper KYC with **46** credential review.

---

## Practitioner and privacy boundaries (legally sensitive)

### Practitioner CAN (with granted scope)

- View client **active** condition names/types from **23** `medical_condition_profiles` when `active_conditions` granted.
- Add food-guidance annotations when `condition_annotations` granted.
- Recommend recipe/meal-plan constraints within `recipe_guidance` / `meal_plan_guidance` scope.
- See aggregate client count in own analytics dashboard.

### Practitioner CANNOT

- Silently set, delete, or activate a user's medical condition.
- View data outside granted scopes.
- Access Mesa member data (**41**) without future explicit Mesa permission design.
- Access medications, wearables/CGM, full scan history, private brain memory, or client identity in public analytics.
- Publish client health data or send promotional copy disguised as medical advice.
- Provide diagnosis, prescriptions, treatment plans, appointments, or emergency alerts.

### User controls

- Sees exact scopes before accept.
- Revokes anytime — access stops immediately.
- Deleting a condition revokes practitioner access to that condition's annotations.

### Creator privacy

Creators see aggregate privacy-safe analytics (saves, cook starts) — never which user has which allergy/condition/Mesa membership.

---

## Analytics and revenue (**43** boundary)

Verified Profiles are a **Signet revenue stream** (from `$99/mo`, spec **19** `$79–99` range).

| Allowed (aggregate) | Blocked |
|---|---|
| Profile/map views, listing taps | Individual user identity |
| Aggregate scan counts for listed products/place | Allergy/condition breakdowns |
| Menu uncertainty trends ("shared fryer often surfaced") | Per-user scan histories |
| Recipe saves/imports for creator profiles | Private health traits |
| Practitioner client count | Client medical details without scope |
| Ground sentiment categories (post Ground privacy gates) | Mesa membership data |
| | Public follower/engagement leaderboards |

Signet enforcement (webhook, SKU mapping, `checkTierAccess`) lives in **43**. **46** calls `checkTierAccess(userId, 'verified_profile' | 'verified_business' | 'practitioner_multi_client')` at application, dashboard, and client-link endpoints.

**Client limit:** Up to **10** active client accounts per practitioner (`spec 19`, `04-verified-profile.md`).

---

## Feature integration summary

| Surface | **46** behavior |
|---|---|
| **Map (28)** | Writes `map_place.verification_status`; **28** renders badge + transparency summary |
| **Menu scan (26)** | Reads verified business transparency as source layer |
| **Scanner (24)** | Shows practitioner annotations in expanded detail when scoped (**23** rows) |
| **Medical conditions (23)** | Practitioner reads active profiles; annotations table; user owns conditions |
| **Recipe ingestion (25)** | Verified creator attribution on import |
| **Viral sharing (51)** | Creator attribution cards; scrub practitioner/client data |
| **Passport (47)** | `practitioner_guidance` block when user explicitly approves |
| **Pricing (43)** | Signet gates verified tools |
| **Mesa (41)** | **No** practitioner access by default |
| **Bela (42)** | Veriff for shoppers — separate from **46** verification |

---

## 46 vs neighbor boundaries

| In **46** (this feature) | In separate feature |
|---|---|
| Verified profile/business records + review | Signet billing + tier matrix — **43** |
| Practitioner–client consent + scopes | Condition detection/rules — **23** |
| Scope-gated reads/writes to client brain | Mesa tables/engine — **41** |
| `map_place.verification_status` updates | Map render/rank APIs — **28** |
| Business transparency JSON | Menu scan pipeline — **26** |
| Creator video storage + firewall | Recipe import body — **25** |
| Aggregate B2B analytics | Community notes tables — **27** |
| Public profile pages | Auth role gating shell — **03** |
| Annotation write handlers | Annotation SQLite schema DDL — **23** |
| Bela shopper KYC | Veriff onboarding — **42** |

### Critical boundary: **46** vs **42** Veriff

| | **42 Bela shopper** | **46 verified profile/business** |
|---|---|---|
| Purpose | Gig worker identity + background check | Professional/business credential trust |
| Provider | Veriff (implementable-spec) | Admin review per build guide — vendor TBD |
| Storage | `shoppers.veriff_session_id` | `evidence_json` + review audit in verified tables |
| Shared? | Same vendor possible later | **Not specified today** — do not reuse Bela KYC flow without design |

### Critical boundary: **46** vs **23** practitioner annotations

| | **23** | **46** |
|---|---|---|
| `PractitionerConditionAnnotation` shape | Owns schema + privacy rules | Implements relationship + write handlers |
| `medical_condition_profiles` | Owns detection/activation | Read-only via scope |
| User owns condition | Yes | Enforces — practitioner cannot activate |

### Critical boundary: **46** vs **41** Mesa

Build guide `05-client-and-practitioner-boundary.md` and **41** spec: practitioners **cannot** access Mesa member data without future explicit permission design. No implicit scope includes `mesa_members`.

---

## Conflicts and naming drift

| ID | Conflict | **46** resolution |
|---|---|---|
| **C1** | Spec **18** lists `business_profile` + `practitioner_profile` as separate tables | Build guide **01** two-lane model is authoritative: `verified_profiles` + `verified_businesses` with `kind` field; practitioner is person subtype |
| **C2** | Spec **18** `featured_listing` vs build guide paid placement rules | Keep `featured_listing` table; enforce no pay-to-safety in ranker (**28** must respect) |
| **C3** | Spec **19** "B2B $79–99" vs **43** "Signet from $99" | **43** public name Signet, from `$99/mo`; spec range is source pricing band |
| **C4** | Veriff mentioned in repo only under **42** | **46** verification = admin review first; do not assume Veriff without new spec |
| **C5** | `map_place.verification_status` enum `unverified\|pending\|verified` vs profile `VerificationStatus` | Map column is display subset; profile status is richer — sync on business verify only |
| **C6** | Session log 027 says 7 build-guide files; folder now has **8** (`07-creator-video-firewall.md`) | Inventory uses 8 files |
| **C7** | `_records/session-log/027` omits `07-creator-video-firewall.md` in written list | File exists — session log incomplete, not blocking |

### Obsolete / absent ledgers

- No `implementable-specs/` entry for verified profiles — build-guide `23-verified-profiles/` is authoritative.
- `_records/session-log/027-verified-profiles-complete.md` — docs complete; "verified profiles shipped" means **build-guide**, not production code.
- `_features/46-verified-profiles/status.md` was stub only before this migration.

---

## Success metrics

From spec **18** and `06-analytics-and-revenue.md`:

- Verified profile applications; approval/rejection rate.
- Verified business listing interactions; map taps.
- Practitioner–client relationship activations.
- Public recipe profile imports/saves.
- Signet conversion and churn by profile subtype.
- Safety: suspension rate, false claim reports, unsafe guidance reports, transparency correction rate.

---

## Sources

- `build-guide/23-verified-profiles/` (00–07)
- `brioela-specs/18-verified-business-and-practitioner-profiles.md`
- `brioela-specs/19-pricing-and-tiers.md` (Signet/B2B section)
- `build-guide/25-pricing-tiers/02-tier-entitlements.md`
- `build-guide/22-medical-conditions/06-practitioner-privacy-boundary.md`
- `build-guide/24-viral-sharing/03-privacy-scrub-and-consent.md`, `05-creator-and-attribution-loop.md`
- `build-guide/28-passport/06-feature-integration.md`
- `brioela-specs/28-medical-condition-food-profile.md`
- `brioela-specs/43-passport.md`
- `_records/connections/20-verified-profiles-connections.md`
- `_records/build-order/22-layer-verified-profiles.md`
- `_records/session-log/027-verified-profiles-complete.md`
- `_features/23-medical-conditions/spec.md`, `draft/practitioner.condition.annotation.schema.gap.md`
- `_features/28-map/spec.md`, `draft/map.place.schema.gap.md`
- `_features/41-mesa/spec.md`
- `_features/42-bela/spec.md`
- `_features/43-pricing-tiers/spec.md`
