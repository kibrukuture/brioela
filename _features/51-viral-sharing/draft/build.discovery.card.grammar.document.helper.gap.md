# Draft: build.discovery.card.grammar.document.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/viral.sharing/build.discovery.card.grammar.document.helper.ts`

**Gap (feature 51):** **52** Artifact Layer input from scrubbed card.

**Source:** `build-guide/27-generative-grammar/06-surface-integration.md`

---

```typescript
import type { DiscoveryCard } from '@brioela/shared/validator/viral.sharing/discovery.card.schema'

export type DiscoveryCardGrammarDocument = {
	grammarVersion: '1'
	surface: 'discovery_card_render'
	safetyLock: true
	mood: 'informative' | 'warm' | 'celebratory'
	layout: {
		kind: 'discovery_card'
		title: string
		finding: string
		contextLine: string | null
		visualEntity: DiscoveryCard['visualEntity']
		attribution: string
	}
	motion: null
	haptics: null
	skia: null
	expiresAt: null
}

export function buildDiscoveryCardGrammarDocument(
	card: DiscoveryCard,
): DiscoveryCardGrammarDocument {
	const mood = moodForCardType(card.cardType)
	return {
		grammarVersion: '1',
		surface: 'discovery_card_render',
		safetyLock: true,
		mood,
		layout: {
			kind: 'discovery_card',
			title: card.title,
			finding: card.finding,
			contextLine: card.contextLine,
			visualEntity: card.visualEntity,
			attribution: card.attribution,
		},
		motion: null,
		haptics: null,
		skia: null,
		expiresAt: null,
	}
}

function moodForCardType(
	cardType: DiscoveryCard['cardType'],
): DiscoveryCardGrammarDocument['mood'] {
	switch (cardType) {
		case 'recipe_preservation':
		case 'encore_first_cook':
		case 'harvest_chapter':
		case 'harvest_cover':
			return 'celebratory'
		case 'kids_learning':
		case 'cook_together':
			return 'warm'
		default:
			return 'informative'
	}
}
```
