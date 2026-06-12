# Draft: discovery.card.cta.constant.ts (gap — file does not exist)

Target: `shared/constants/viral.sharing/discovery.card.cta.constant.ts`

**Gap (feature 51):** Quiet contextual CTAs per card type.

**Source:** `build-guide/24-viral-sharing/02-discovery-card-system.md`

---

```typescript
import type { DiscoveryCardType } from './discovery.card.type.constant'

const CTA_BY_TYPE: Record<DiscoveryCardType, string> = {
	scan_discovery: 'Scanned with Brioela',
	swap: 'Found with Brioela',
	kids_learning: 'we scanned this together with Brioela',
	mesa_compatibility: 'Found with Mesa',
	menu_reality: 'Scanned with Brioela',
	recipe_preservation: 'Saved to Brioela',
	creator_recipe: 'Cooked with Brioela',
	cook_together: 'Cooked with Brioela',
	savings: 'Found with Brioela',
	ground_find: 'Found with Brioela Ground',
	personal_response: 'Scanned with Brioela',
	encore_first_cook: 'Cooked with Brioela',
	weekly_summary: 'Tracked with Brioela',
	harvest_chapter: 'my Harvest — Brioela',
	harvest_cover: 'my Harvest — Brioela',
}

export function discoveryCardCtaForType(cardType: DiscoveryCardType): string {
	return CTA_BY_TYPE[cardType]
}
```
