# Feature 53 — Harvest — Draft index

Production snapshots for review. **None of these files exist in `backend/`, `shared/`, or `mobile/` yet.**

| Draft file | Target production path | Gap ID |
|---|---|---|
| `harvest.chapter.type.constant.gap.md` | `shared/constants/harvest/harvest.chapter.type.constant.ts` | G3 |
| `harvest.edition.schema.gap.md` | `backend/src/agents/brain/_schemas/harvest.edition.schema.ts` | G1 |
| `harvest.chapter.schema.gap.md` | `backend/src/agents/brain/_schemas/harvest.chapter.schema.ts` | G2 |
| `harvest.chapter.candidate.schema.gap.md` | `shared/validator/harvest/harvest.chapter.candidate.schema.ts` | G8 |
| `compute.anniversary.window.helper.gap.md` | `backend/src/agents/brain/_helpers/harvest/compute.anniversary.window.helper.ts` | G4 |
| `check.harvest.eligibility.handler.gap.md` | `backend/src/agents/brain/_handlers/harvest/check.harvest.eligibility.handler.ts` | G5, G11 |
| `gather.harvest.data.handler.gap.md` | `backend/src/agents/brain/_handlers/harvest/gather.harvest.data.handler.ts` | G6 |
| `load.time.machine.archive.helper.gap.md` | `backend/src/agents/brain/_helpers/harvest/load.time.machine.archive.helper.ts` | G7 |
| `sensitivity.exclusion.policy.gap.md` | `backend/src/agents/brain/_policies/harvest/sensitivity.exclusion.policy.ts` | G9 |
| `build.chapter.candidates.handler.gap.md` | `backend/src/agents/brain/_handlers/harvest/build.chapter.candidates.handler.ts` | G8, G29–G31 |
| `rank.chapters.by.salience.helper.gap.md` | `backend/src/agents/brain/_helpers/harvest/rank.chapters.by.salience.helper.ts` | G10 |
| `validate.source.queries.helper.gap.md` | `backend/src/agents/brain/_helpers/harvest/validate.source.queries.helper.ts` | G25 |
| `write.harvest.narrative.handler.gap.md` | `backend/src/agents/brain/_handlers/harvest/write.harvest.narrative.handler.ts` | G12 |
| `compose.harvest.grammar.documents.handler.gap.md` | `backend/src/agents/brain/_handlers/harvest/compose.harvest.grammar.documents.handler.ts` | G13, G14 |
| `store.harvest.edition.handler.gap.md` | `backend/src/agents/brain/_handlers/harvest/store.harvest.edition.handler.ts` | G1, G2 |
| `pre.render.harvest.share.cards.handler.gap.md` | `backend/src/agents/brain/_handlers/harvest/pre.render.harvest.share.cards.handler.ts` | G15, G22 |
| `compose.harvest.edition.handler.gap.md` | `backend/src/agents/brain/_handlers/harvest/compose.harvest.edition.handler.ts` | G16 |
| `handle.harvest.edition.compose.alarm.handler.gap.md` | `backend/src/agents/brain/_handlers/alarms/handle.harvest.edition.compose.alarm.handler.ts` | G16, G17 |
| `trigger.harvest.edition.notification.handler.gap.md` | `backend/src/agents/brain/_handlers/harvest/trigger.harvest.edition.notification.handler.ts` | G18 |
| `harvest.routes.gap.md` | `shared/routes/harvest.routes.ts` | G19 |
| `harvest.contract.gap.md` | `shared/contracts/harvest.contract.ts` | G19 |
| `get.harvest.edition.handler.gap.md` | `backend/src/api/harvest/_handlers/get.harvest.edition.handler.ts` | G19 |
| `harvest.edition.viewer.screen.gap.md` | `mobile/features/harvest/screens/harvest.edition.viewer.screen.tsx` | G20 |
| `harvest.archive.shelf.screen.gap.md` | `mobile/features/harvest/screens/harvest.archive.shelf.screen.tsx` | G21 |
| `harvest.chapter.share.button.gap.md` | `mobile/features/harvest/components/harvest.chapter.share.button.tsx` | G22, G23 |

## Cross-feature drafts (do not duplicate in 53)

| Feature | Draft / owner |
|---|---|
| **52** | `harvest.chapter.document.helper.gap.md` — `renderHarvestChapterShareCard` Artifact export |
| **40** | `load.craft.chapter.candidate.handler.gap.md` — optional `craft` chapter producer |
| **51** | `discovery.card.type.constant.gap.md` — `harvest_chapter`, `harvest_cover` enum |
| **35** | Time Machine candidate queue producer — `04-food-time-machine.md` |
| **21** | `harvest_edition_ready` send path — platform notification spine |

## Critical boundary notes

- **Gather ≠ Harvest** — step 1 is `gather`; product name reserved for artifact (`49-harvest.md` § Naming).
- **Pre-composed docs** — no 400ms gate at open; **52** renders stored JSON (`36-harvest/03`).
- **Anti-hallucination** — untraceable numbers block chapter ship (`source_queries_json` mandatory).
- **Highest share volume** — **53** composes; **51** transports; **52** renders PNG.
- **Optional craft** — edition ships without **40** (`33-layer-harvest.md`).
- **Spec 49 / folder 53** — expected numbering split; growth mirror is spec **53** / feature **40**.
