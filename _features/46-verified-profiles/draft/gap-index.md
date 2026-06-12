# Draft index — 46-verified-profiles

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `verification.status.constant.gap.md` | `shared/constants/verified/verification.status.constant.ts` | — |
| `verified.profile.kind.constant.gap.md` | `shared/constants/verified/verified.profile.kind.constant.ts` | — |
| `practitioner.client.scope.constant.gap.md` | `shared/constants/verified/practitioner.client.scope.constant.ts` | — |
| `verified.person.profile.schema.gap.md` | `shared/drizzle/schema/verified.person.profile.schema.ts` | **01** migrations |
| `verified.business.profile.schema.gap.md` | `shared/drizzle/schema/verified.business.profile.schema.ts` | **01** |
| `featured.listing.schema.gap.md` | `shared/drizzle/schema/featured.listing.schema.ts` | **01** |
| `verified.creator.video.schema.gap.md` | `shared/drizzle/schema/verified.creator.video.schema.ts` | **01** |
| `practitioner.client.relationship.schema.gap.md` | `_schemas/practitioner.client.relationship.schema.ts` | **04** |
| `verified.routes.gap.md` | `shared/routes/verified.routes.ts` | — |
| `verification.application.validator.schema.gap.md` | `shared/validator/verified/verification.application.schema.ts` | — |
| `check.practitioner.client.access.helper.gap.md` | `_handlers/verified/check.practitioner.client.access.helper.ts` | G4, G5 |
| `check.verified.profile.entitlement.helper.gap.md` | `_helpers/pricing/check.verified.profile.entitlement.helper.ts` | **43** |
| `post.verification.application.handler.gap.md` | `backend/src/api/verified/_handlers/post.verification.application.handler.ts` | G10 |
| `post.practitioner.connection.request.handler.gap.md` | `backend/src/api/verified/_handlers/post.practitioner.connection.request.handler.ts` | G11 |
| `post.practitioner.connection.respond.handler.gap.md` | `backend/src/api/verified/_handlers/post.practitioner.connection.respond.handler.ts` | G12 |
| `write.practitioner.annotation.handler.gap.md` | `_handlers/verified/write.practitioner.annotation.handler.ts` | **23** G14 |
| `read.practitioner.client.conditions.handler.gap.md` | `_handlers/verified/read.practitioner.client.conditions.handler.ts` | **23** |
| `link.verified.business.to.map.place.handler.gap.md` | `_handlers/verified/link.verified.business.to.map.place.handler.ts` | **28** G19 |
| `evaluate.creator.video.firewall.helper.gap.md` | `_helpers/verified/evaluate.creator.video.firewall.helper.ts` | G24 |
| `aggregate.verified.profile.analytics.helper.gap.md` | `_helpers/verified/aggregate.verified.profile.analytics.helper.ts` | G25 |
| `verified.profiles.feature.gap.md` | `mobile/features/verified-profiles/verified.profiles.feature.tsx` | G27 |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **23** | `_features/23-medical-conditions/draft/practitioner.condition.annotation.schema.gap.md` |
| **28** | `_features/28-map/draft/map.place.schema.gap.md` — `verification_status` column |
| **43** | `_features/43-pricing-tiers/draft/tier.entitlement.matrix.constant.gap.md` — Signet actions |
| **43** | `_features/43-pricing-tiers/draft/check.tier.access.helper.gap.md` — canonical gate |

## Critical boundary notes

- **46** practitioner RPCs must call `checkPractitionerClientAccess` before any **23** read/write.
- **42** Veriff is shopper KYC only — **46** uses admin credential review per `02-verification-flow.md`.
- **41** Mesa: no practitioner scope in v1 — block at RPC layer (G17).
- **28** owns map render; **46** only writes `verification_status` when business verified.
