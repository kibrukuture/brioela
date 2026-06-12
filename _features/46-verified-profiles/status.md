# Status

open

**Verified profiles not shipped.** Build-guide `23-verified-profiles/` is complete (8 files, docs only). Zero `verified_profiles` / `verified_businesses` Supabase tables, zero practitioner–client Brain tables, zero `/api/verified` routes, zero admin verification review, zero scope-gated practitioner RPCs, zero creator video firewall, zero mobile `features/verified-profiles/`. Partial: **43** tier matrix draft lists Signet actions; **28** draft has `verification_status` column; **23** draft has annotation schema.

# Shipped in backend (partial / unrelated)

- [x] `build-guide/23-verified-profiles/` — 8 files docs complete
- [x] `brioela-specs/18-verified-business-and-practitioner-profiles.md` — primary spec
- [x] `_records/connections/20-verified-profiles-connections.md` — ledger
- [x] `_records/build-order/22-layer-verified-profiles.md` — build order
- [x] `_records/session-log/027-verified-profiles-complete.md` — build-guide session log
- [x] **43** `verified_profile`, `verified_business`, `practitioner_multi_client` in tier draft
- [x] **28** `map_place.verification_status` in draft schema
- [x] **23** `practitioner_condition_annotations` in draft schema
- [ ] `verified_profiles` / `verified_businesses` Drizzle schemas
- [ ] `practitioner_client_relationships` Brain table
- [ ] `checkPractitionerClientAccess` helper
- [ ] Verification application API + admin review queue
- [ ] Signet entitlement enforcement at apply/dashboard (**43**)
- [ ] Practitioner invite / accept / revoke flows
- [ ] Scope-gated condition read (**23** integration)
- [ ] Scope-gated annotation write (**23** table)
- [ ] 10-client limit enforcement
- [ ] `map_place.verification_status` sync on business verify (**28**)
- [ ] Business transparency editor + menu source adapter (**26**)
- [ ] `featured_listings` table + trust-bounded rank hook (**28**)
- [ ] `verified_creator_videos` + firewall ranker
- [ ] Aggregate analytics API (privacy-safe)
- [ ] Public profile pages (person + business)
- [ ] Mobile verified profiles feature folder
- [ ] Practitioner dashboard
- [ ] Verified profile / scope / revocation tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `shared/drizzle/schema/verified.*` | `rg verified_profiles shared/drizzle` — zero |
| G2 | No `verified_profiles` Postgres table | spec 18 data model — not migrated |
| G3 | No `verified_businesses` Postgres table | `03-verified-business.md` — not built |
| G4 | No `practitioner_client_relationships` Brain schema | `rg practitioner_client backend/src/agents` — zero |
| G5 | No `checkPractitionerClientAccess` | `05-client-and-practitioner-boundary.md` — no code |
| G6 | No verification status constants | `rg VerificationStatus shared/constants` — zero |
| G7 | No `/api/verified` module | `rg api/verified backend/src` — zero |
| G8 | No `POST` verification application handler | `02-verification-flow.md` — zero |
| G9 | No admin verification review handlers | Human review required — zero |
| G10 | No Signet gate at apply time | **43** `checkTierAccess` unshipped |
| G11 | No practitioner connection request API | `05` flow step 1 — zero |
| G12 | No user consent accept/reject API | `05` flow step 3 — zero |
| G13 | No revocation handler | `05` revoke rules — zero |
| G14 | No scope-gated condition read RPC | **23** profiles exist only in docs |
| G15 | No annotation write handler | **23** draft schema only |
| G16 | Practitioner can set condition — must stay impossible | No RPC guards exist yet |
| G17 | No Mesa access block in practitioner RPC | **41** policy — no enforcement code |
| G18 | No 10-client limit helper | spec **19** — zero |
| G19 | No `map_place.verification_status` writer | **28** G1 — column in draft only |
| G20 | No business transparency JSON schema | `03-verified-business.md` — zero |
| G21 | No `featured_listings` table | spec 18 — zero |
| G22 | No pay-to-safety rank guard | `06-analytics-and-revenue.md` — zero |
| G23 | No `verified_creator_videos` table | `07-creator-video-firewall.md` — zero |
| G24 | No creator video firewall ranker | Surface limits — zero |
| G25 | No aggregate analytics API | `06` — zero |
| G26 | No public profile read API | `04-verified-profile.md` — zero |
| G27 | No mobile `features/verified-profiles/` | `rg verified-profiles mobile/features` — zero |
| G28 | No practitioner dashboard UI | build manifest — zero |
| G29 | No client consent scope sheet UI | `05` — zero |
| G30 | No recipe creator attribution hook | **25** + viral `05` — unwired |
| G31 | No scan annotation attach hook | **24** + **23** — unwired |
| G32 | No verification expiry cron | `02` renewal — zero |
| G33 | No Veriff integration for **46** | Expected — admin review per build guide; Veriff is **42** only |
| G34 | Spec **18** split tables vs two-lane model | **C1** — implement build guide `01` |
| G35 | Session log 027 lists 7 files not 8 | `07-creator-video-firewall.md` omitted from log |
| G36 | No verified profile tests | No `verified*.test.ts` |
| G37 | `check.verified.profile.entitlement.helper` missing | **43** wrapper pattern — zero |

# 46 vs neighbor boundaries

| In **46** (this feature) | In separate feature |
|---|---|
| Verified profile/business bodies + review | Signet SKU + `checkTierAccess` (**43**) |
| Practitioner–client consent + scopes | Condition profiles + rules (**23**) |
| Scope-gated practitioner RPCs | Annotation SQLite DDL (**23**) |
| `map_place.verification_status` writer | Map UI + rank (**28**) |
| Business transparency JSON | Menu scan (**26**) |
| Creator video + firewall | Recipe import (**25**) |
| Aggregate B2B analytics | Ground tables (**27**) |
| Public profile pages | Share scrub (**51**) |
| User-approved notes for export | Passport PDF (**47**) |
| Bela shopper KYC | Veriff (**42**) — **not** **46** |

# Critical boundary: practitioner privacy (legally sensitive)

| Rule | Enforced by |
|---|---|
| No condition access without consent + scope | G5, G14 |
| User owns condition activation | G16 — block writes to **23** confirm tools |
| No Mesa member data | G17 |
| No medications / wearables / full scan history in default scopes | G5 scope enum |
| Revoke = immediate 403 | G13 |
| Annotations ≠ system rules unless user accepts | **23** UI policy |
| Not telehealth | Product copy + blocked APIs |

# Blocked by

- 03-platform-auth-onboarding (role gating for practitioner/business owner)
- 04-brain-foundation (client DO tables + RPC routing)
- 23-medical-conditions (`medical_condition_profiles` + annotation table)
- 28-map (`map_place` exists before verification_status write)
- 43-pricing-tiers (Signet `checkTierAccess`)

# Blocks

- Signet B2B go-to-market surface
- Practitioner-guided client workflows end-to-end
- Verified map badge writer (**28** display blocked on data)
- Creator attribution loop completion (**25**, **51**)

# Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `brioela-specs/18` `business_profile` + `practitioner_profile` | Superseded by two-lane model — **C1** |
| `_records/session-log/027` file count | Omits `07-creator-video-firewall.md` |
| Veriff under `implementable-specs/bela/` | **42** only — do not wire to **46** without new design |
| `_records/session-log/027` "complete" | Means build-guide, not production |
| Spec **19** `$79–99` vs **43** Signet `$99` | **C3** — use **43** customer-facing |

# Draft count

**22** files in `draft/` — 21 gap/intended snapshots + `gap-index.md`.

# Sources

- `build-guide/23-verified-profiles/` (00–07)
- `brioela-specs/18-verified-business-and-practitioner-profiles.md`
- `brioela-specs/19-pricing-and-tiers.md`
- `build-guide/22-medical-conditions/06-practitioner-privacy-boundary.md`
- `_records/connections/20-verified-profiles-connections.md`
- `_records/build-order/22-layer-verified-profiles.md`
- `_records/session-log/027-verified-profiles-complete.md`
- `_features/23-medical-conditions/spec.md`
- `_features/28-map/spec.md`
- `_features/41-mesa/spec.md`
- `_features/42-bela/spec.md`
- `_features/43-pricing-tiers/spec.md`
