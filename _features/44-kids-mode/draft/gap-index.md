# Feature 44 — Kids Mode — Draft index

Production snapshots for review. **None of these files exist in `backend/`, `shared/validator/kids.mode/`, or `mobile/features/kids.mode/` yet.**

| Draft file | Target production path | Gap ID |
|---|---|---|
| `kids.mode.profile.schema.gap.md` | `backend/src/agents/brain/_schemas/kids.mode.profile.schema.ts` | G1 |
| `kids.mode.scan.event.schema.gap.md` | `backend/src/agents/brain/_schemas/kids.mode.scan.event.schema.ts` | G2 |
| `kids.scan.explanation.schema.gap.md` | `shared/validator/kids.mode/kids.scan.explanation.schema.ts` | G3 |
| `kids.share.card.schema.gap.md` | `shared/validator/kids.mode/kids.share.card.schema.ts` | G18 |
| `kid.co.scan.session.schema.gap.md` | `shared/validator/kids.mode/kid.co.scan.session.schema.ts` | G17 |
| `check.kids.mode.entitlement.helper.gap.md` | `backend/src/agents/brain/_helpers/kids.mode/check.kids.mode.entitlement.helper.ts` | G7 |
| `generate.kids.scan.explanation.helper.gap.md` | `backend/src/agents/brain/_helpers/kids.mode/generate.kids.scan.explanation.helper.ts` | G5 |
| `validate.kids.explanation.safety.helper.gap.md` | `backend/src/agents/brain/_helpers/kids.mode/validate.kids.explanation.safety.helper.ts` | G6 |
| `generate.kids.explanation.handler.gap.md` | `backend/src/agents/brain/_handlers/kids.mode/generate.kids.explanation.handler.ts` | G4 |
| `build.kid.co.scan.mira.scene.helper.gap.md` | `backend/src/agents/mira/_scenes/build.kid.co.scan.mira.scene.helper.ts` | G14 |
| `build.kid.explanation.mira.scene.helper.gap.md` | `backend/src/agents/mira/_scenes/build.kid.explanation.mira.scene.helper.ts` | G13 |
| `kids.mode.routes.gap.md` | `shared/routes/kids.mode.routes.ts`, `backend/src/api/kids.mode/` | G4 |
| `explain.to.kid.button.feature.gap.md` | `mobile/features/kids.mode/_components/explain.to.kid.button.tsx` | G9 |
| `kid.co.scan.shell.feature.gap.md` | `mobile/features/kids.mode/_components/kid.co.scan.shell.tsx` | G15 |
| `kids.share.card.feature.gap.md` | share prompt + `build.kids.share.card.payload.helper.ts` | G18 |

**Not drafted (owned by other features):** product scan pipeline (**24**), `checkTierAccess` matrix (**43**), MiraSession DO class (**29**), Discovery Card renderer (**51**), `kids-explainer-gentle` grammar (**52**), Mesa member DDL (**41**), constraint matching (**07**).
