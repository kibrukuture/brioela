# Draft: registry.ts (gap — file does not exist)

Target: `shared/grammar/catalog/registry.ts`

**Gap (feature 52):** Layout template registry — schema, defaults, human+AI descriptions.

**Source:** `11-composition-catalog-and-scale.md`, `12-naming-law.md`

---

```typescript
import type { LayoutTemplate } from '../schema/compositions'
import type { EmotionalTone } from '../schema/tokens/emotional-tone'

export type CatalogEntry = {
	layoutType: LayoutTemplate['type']
	description: string
	whenToUse: string
	emotionalRegister: EmotionalTone[]
	goldExampleRef: string
}

export const compositionCatalog: CatalogEntry[] = [
	{
		layoutType: 'scan_explanation_focus_layout',
		description: 'Single focal scan explanation beneath the static safety block.',
		whenToUse: 'Secondary framing after a scan verdict when there is a plain-language reason worth surfacing.',
		emotionalRegister: ['neutral_factual', 'caution_explanatory', 'discovery_informational'],
		goldExampleRef: 'fewshot/scan.ts',
	},
	{
		layoutType: 'share_discovery_stamp_layout',
		description: 'Shareable discovery stamp — one finding, one context line, quiet attribution.',
		whenToUse: 'Discovery Card Artifact Layer after privacy scrub.',
		emotionalRegister: ['discovery_informational', 'positive_confirming', 'learning_gentle'],
		goldExampleRef: 'fewshot/discovery-card.ts',
	},
	{
		layoutType: 'passport_instruction_frame_layout',
		description: 'Scannable instruction handoff frame — no playful mood.',
		whenToUse: 'Passport image/PDF after validated instruction blocks.',
		emotionalRegister: ['neutral_factual', 'caution_explanatory', 'focused_instructional'],
		goldExampleRef: 'fewshot/passport.ts',
	},
]

export function getCatalogEntry(
	layoutType: LayoutTemplate['type'],
): CatalogEntry | undefined {
	return compositionCatalog.find((entry) => entry.layoutType === layoutType)
}
```
