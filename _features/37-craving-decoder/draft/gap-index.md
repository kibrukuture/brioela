# Draft index — 37-craving-decoder

## Gap / production snapshots

| File | Target path | Blocked by |
|---|---|---|
| `craving.decoder.skill.seed.gap.md` | `backend/src/agents/brain/_skills/craving-decoder/` | **06** G1 |
| `craving.decoded.event.schema.gap.md` | `shared/validator/craving-decoder/craving.decoded.event.schema.ts` | — |
| `estimate.eating.gap.helper.gap.md` | `_helpers/craving-decoder/estimate.eating.gap.helper.ts` | **05** |
| `search.craving.history.helper.gap.md` | `_helpers/craving-decoder/search.craving.history.helper.ts` | G5 |
| `assemble.craving.evidence.helper.gap.md` | `_helpers/craving-decoder/assemble.craving.evidence.helper.ts` | G2, G10, G11 |
| `match.craving.offer.helper.gap.md` | `_helpers/craving-decoder/match.craving.offer.helper.ts` | G7, G8, G9 |
| `write.craving.decoded.event.handler.gap.md` | `_handlers/craving-decoder/write.craving.decoded.event.handler.ts` | **05** |
| `check.disordered.eating.guard.helper.gap.md` | `_helpers/craving-decoder/check.disordered.eating.guard.helper.ts` | — |
| `build.sacred.disordered.eating.block.gap.md` | `_helpers/session/build.sacred.context.helper.ts` | **13** G13 |
| `on.scan.craving.context.helper.gap.md` | `_handlers/craving-decoder/on.scan.craving.context.helper.ts` | **24** G14 |
| `harden.craving.correlation.patterns.helper.gap.md` | `_handlers/ambient/harden.craving.correlation.patterns.helper.ts` | **35** G12 |
| `check.craving.tier.gate.helper.gap.md` | `_helpers/craving-decoder/check.craving.tier.gate.helper.ts` | **43** G15 |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **36** | `_features/36-wearables/draft/route.wearable.memory.helper.gap.md` — `health.biometrics` writes |
| **35** | `_features/35-ambient-intelligence/draft/wellbeing.signal.schema.gap.md` — stress context |
| **34** | `_features/34-pantry-meal-plan/draft/match.pantry.recipes.helper.gap.md` — bridge rank |
| **15** | `_features/15-brain-system-prompt/` — `buildMemoryContext` / skill index |
| **54** | `_features/54-tonight/` — Tonight adjustment execution |

## 37 vs 38 note

Eating gap helper (**37**) measures **hours since last observed eat**. Negative-space coverage gate (**38**) measures **weeks of nutrient-category absence**. Do not merge helpers.

**Total in this folder:** 13 files (12 snapshots + this index).
