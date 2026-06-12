# Feature 51 — Viral Sharing — Draft index

Production snapshots for review. **None of these files exist in `backend/`, `shared/`, or `mobile/` yet.**

| Draft file | Target production path | Gap ID |
|---|---|---|
| `discovery.card.type.constant.gap.md` | `shared/constants/viral.sharing/discovery.card.type.constant.ts` | G1, G2 |
| `share.consent.level.constant.gap.md` | `shared/constants/viral.sharing/share.consent.level.constant.ts` | G11 |
| `share.moment.threshold.constant.gap.md` | `shared/constants/viral.sharing/share.moment.threshold.constant.ts` | G7 |
| `discovery.card.cta.constant.gap.md` | `shared/constants/viral.sharing/discovery.card.cta.constant.ts` | G4 |
| `brioela.moment.schema.gap.md` | `shared/validator/viral.sharing/brioela.moment.schema.ts` | G3 |
| `discovery.card.schema.gap.md` | `shared/validator/viral.sharing/discovery.card.schema.ts` | G4 |
| `privacy.scrub.result.schema.gap.md` | `shared/validator/viral.sharing/privacy.scrub.result.schema.ts` | G5 |
| `share.moment.score.schema.gap.md` | `shared/validator/viral.sharing/share.moment.score.schema.ts` | G7 |
| `request.discovery.card.schema.gap.md` | `shared/validator/viral.sharing/request.discovery.card.schema.ts` | G10 |
| `confirm.discovery.card.share.schema.gap.md` | `shared/validator/viral.sharing/confirm.discovery.card.share.schema.ts` | G11 |
| `discovery.card.offer.schema.gap.md` | `backend/src/agents/brain/_schemas/discovery.card.offer.schema.ts` | G8 |
| `share.prompt.suppression.schema.gap.md` | `backend/src/agents/brain/_schemas/share.prompt.suppression.schema.ts` | G14 |
| `privacy.scrub.discovery.card.policy.gap.md` | `backend/src/agents/brain/_policies/viral.sharing/privacy.scrub.discovery.card.policy.ts` | G6 |
| `score.share.moment.helper.gap.md` | `backend/src/agents/brain/_helpers/viral.sharing/score.share.moment.helper.ts` | G7 |
| `scrub.discovery.card.payload.helper.gap.md` | `backend/src/agents/brain/_helpers/viral.sharing/scrub.discovery.card.payload.helper.ts` | G6 |
| `build.discovery.card.from.moment.helper.gap.md` | `backend/src/agents/brain/_helpers/viral.sharing/build.discovery.card.from.moment.helper.ts` | G12 |
| `should.suppress.share.prompt.helper.gap.md` | `backend/src/agents/brain/_helpers/viral.sharing/should.suppress.share.prompt.helper.ts` | G14 |
| `build.discovery.card.grammar.document.helper.gap.md` | `backend/src/agents/brain/_helpers/viral.sharing/build.discovery.card.grammar.document.helper.ts` | G28 |
| `render.discovery.card.static.helper.gap.md` | `backend/src/agents/brain/_helpers/viral.sharing/render.discovery.card.static.helper.ts` | G12 |
| `emit.brioela.moment.handler.gap.md` | `backend/src/agents/brain/_handlers/viral.sharing/emit.brioela.moment.handler.ts` | G9 |
| `request.discovery.card.handler.gap.md` | `backend/src/agents/brain/_handlers/viral.sharing/request.discovery.card.handler.ts` | G10 |
| `confirm.discovery.card.share.handler.gap.md` | `backend/src/agents/brain/_handlers/viral.sharing/confirm.discovery.card.share.handler.ts` | G11 |
| `viral.sharing.routes.gap.md` | `shared/routes/viral.sharing.routes.ts` | G10 |
| `viral.sharing.contract.gap.md` | `shared/contracts/viral.sharing.contract.ts` | G10 |
| `post.discovery.card.request.handler.gap.md` | `backend/src/api/viral.sharing/_handlers/post.discovery.card.request.handler.ts` | G10 |
| `discovery.card.attribution.schema.gap.md` | `shared/drizzle/schema/discovery.card.attribution.schema.ts` | G15 |
| `discovery.card.preview.sheet.gap.md` | `mobile/features/viral.sharing/components/discovery.card.preview.sheet.tsx` | G13 |
| `viral.sharing.api.gap.md` | `mobile/network/viral.sharing/viral.sharing.api.ts` | G10 |

## Cross-feature drafts (do not duplicate in 51)

| Feature | Draft / owner |
|---|---|
| **44** | `kids.share.card.schema.gap.md`, `kids.share.card.feature.gap.md` — payload + trigger UI |
| **48** | `encore.discovery.card.trigger.gap.md` — first-cook offer UI |
| **53** | Harvest composition + `share_card_ref` pre-render — calls **51** share transport |
| **25** | Share-sheet recipe import — acquisition, not Discovery Card body |
| **47** | Passport render — explicit non-**51** boundary |
| **52** | Grammar Artifact Layer renderer — **51** builds document only |

## Critical boundary notes

- **Privacy scrub is mandatory** — no card from raw profile state (`03-privacy-scrub-and-consent.md`).
- **`personal_response` blocked default** — `explicit_sensitive_opt_in` only.
- **Passport ≠ Discovery Card** — handoff instructions vs organic share.
- **Heirloom send ≠ Recipe Preservation card** — private DO copy vs scrubbed public image.
- **Harvest highest volume** — **53** composes; **51** renders/transports share artifacts.
- **Extension card types** (`encore_first_cook`, `weekly_summary`, `harvest_*`) must ship in shared enum (**G2**).
