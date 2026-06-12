# Draft: pairing.ts (gap — file does not exist)

Target: `shared/grammar/catalog/pairing.ts`

**Gap (feature 52):** Legal emotionalTone ↔ backgroundEffect ↔ entranceMotion pairings.

**Source:** `04-emotion-motion-skia.md`, `15-validation-and-repair.md`

---

```typescript
import type { EmotionalTone } from '../schema/tokens/emotional-tone'
import type { BackgroundEffectToken } from '../schema/tokens/background-effect'
import type { EntranceMotionPreset } from '../schema/tokens/entrance-motion'

const allowedBackgroundByEmotionalTone: Record<
	EmotionalTone,
	readonly BackgroundEffectToken[]
> = {
	neutral_factual: ['none', 'neutral_texture_background'],
	discovery_informational: ['discovery_highlight_background', 'neutral_texture_background'],
	caution_explanatory: ['verdict_color_background', 'neutral_texture_background'],
	positive_confirming: ['discovery_highlight_background', 'verdict_color_background'],
	memory_reflective: ['memory_soft_glow_background'],
	focused_instructional: ['neutral_texture_background', 'none'],
	learning_gentle: ['neutral_texture_background', 'discovery_highlight_background'],
	group_considerate: ['mesa_group_background', 'neutral_texture_background'],
	savings_reassuring: ['neutral_texture_background', 'discovery_highlight_background'],
}

const allowedEntranceByEmotionalTone: Record<
	EmotionalTone,
	readonly EntranceMotionPreset[]
> = {
	neutral_factual: ['fade_all_entrance', 'settle_all_entrance'],
	discovery_informational: ['slide_primary_then_details_entrance', 'cascade_details_entrance'],
	caution_explanatory: ['settle_all_entrance', 'fade_all_entrance'],
	positive_confirming: ['scale_primary_then_supporting_entrance', 'cascade_details_entrance'],
	memory_reflective: ['fade_all_entrance', 'settle_all_entrance'],
	focused_instructional: ['slide_primary_then_details_entrance'],
	learning_gentle: ['fade_all_entrance', 'settle_all_entrance'],
	group_considerate: ['settle_all_entrance', 'cascade_details_entrance'],
	savings_reassuring: ['slide_primary_then_details_entrance'],
}

export function isBackgroundEffectPairingLegal(
	emotionalTone: EmotionalTone,
	family: BackgroundEffectToken,
): boolean {
	return allowedBackgroundByEmotionalTone[emotionalTone].includes(family)
}

export function isEntranceMotionPairingLegal(
	emotionalTone: EmotionalTone,
	preset: EntranceMotionPreset,
): boolean {
	return allowedEntranceByEmotionalTone[emotionalTone].includes(preset)
}
```
