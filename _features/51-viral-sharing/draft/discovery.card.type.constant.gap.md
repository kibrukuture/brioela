# Draft: discovery.card.type.constant.ts (gap — file does not exist)

Target: `shared/constants/viral.sharing/discovery.card.type.constant.ts`

**Gap (feature 51):** Baseline 11 types from build-guide `02` + extension types from specs **44**, **16**, **49**.

**Source:** `build-guide/24-viral-sharing/02-discovery-card-system.md`, `brioela-specs/44-encore.md`, `brioela-specs/49-harvest.md`

---

```typescript
export const discoveryCardTypeValues = [
	'scan_discovery',
	'swap',
	'kids_learning',
	'mesa_compatibility',
	'menu_reality',
	'recipe_preservation',
	'creator_recipe',
	'cook_together',
	'savings',
	'ground_find',
	'personal_response',
	// Extension types — spec cross-refs (G2)
	'encore_first_cook',
	'weekly_summary',
	'harvest_chapter',
	'harvest_cover',
] as const

export type DiscoveryCardType = (typeof discoveryCardTypeValues)[number]

export const baselineDiscoveryCardTypeValues = discoveryCardTypeValues.slice(0, 11)

export const extensionDiscoveryCardTypeValues = discoveryCardTypeValues.slice(11)

export function isDiscoveryCardType(value: string): value is DiscoveryCardType {
	return (discoveryCardTypeValues as readonly string[]).includes(value)
}
```
