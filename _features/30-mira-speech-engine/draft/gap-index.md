# Draft index — 30-mira-speech-engine

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `mira.scene.contract.gap.md` | `backend/src/agents/mira/_scenes/mira.scene.contract.ts` | — |
| `mira.scene.contract.schema.ts.gap.md` | `backend/src/agents/mira/_scenes/mira.scene.contract.schema.ts` | — |
| `types.ts.gap.md` | `backend/src/agents/mira/mira-speech-decision/types.ts` | — |
| `mira.speech.decision.engine.gap.md` | `backend/src/agents/mira/mira-speech-decision/index.ts` | sub-modules |
| `silence-tracker.gap.md` | `backend/src/agents/mira/mira-speech-decision/silence-tracker.ts` | — |
| `visual-change-detector.gap.md` | `backend/src/agents/mira/mira-speech-decision/visual-change-detector.ts` | downsample helper |
| `adaptive-frequency.gap.md` | `backend/src/agents/mira/mira-speech-decision/adaptive-frequency.ts` | — |
| `prompt-builder.gap.md` | `backend/src/agents/mira/mira-speech-decision/prompt-builder.ts` | — |
| `response-filter.gap.md` | `backend/src/agents/mira/mira-speech-decision/response-filter.ts` | — |
| `suppression-rules.gap.md` | `backend/src/agents/mira/mira-speech-decision/suppression-rules.ts` | — |
| `downsample-jpeg.helper.gap.md` | `backend/src/agents/mira/_helpers/downsample-jpeg.helper.ts` | Workers JPEG decode lib |
| `compute-voice-activity.helper.ts.gap.md` | `backend/src/agents/mira/_helpers/compute-voice-activity.helper.ts` | — |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **29** | `_features/29-cooking-session/draft/mira.speech.decision.engine.gap.md` — integration stub only |
| **29** | `_features/29-cooking-session/draft/build-cooking-scene.helper.gap.md` — scene builder |

## Shipped (not in draft/)

None — zero production files for feature **30**.

**Total in this folder:** 13 files (12 gap + this index).
