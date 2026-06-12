# Draft: harvest.chapter.type.constant.ts (gap — file does not exist)

Target: `shared/constants/harvest/harvest.chapter.type.constant.ts`

**Gap (feature 53):** Typed chapter taxonomy for salience ranking and grammar mood selection.

**Source:** `build-guide/36-harvest/02-chapter-rules.md`, `brioela-specs/49-harvest.md` § Composition step 2

---

```typescript
export const harvestChapterTypeValues = [
	'firsts',
	'avoidance_maintained',
	'heritage',
	'discovery',
	'craft',
	'rhythm',
	'family',
] as const

export type HarvestChapterType = (typeof harvestChapterTypeValues)[number]

/** Salience class hints for ranking — spec 38 heuristic family */
export const harvestChapterSalienceClass: Record<
	HarvestChapterType,
	'high' | 'medium_high' | 'medium'
> = {
	firsts: 'high',
	avoidance_maintained: 'high',
	heritage: 'high',
	discovery: 'medium_high',
	craft: 'medium_high',
	rhythm: 'medium',
	family: 'medium',
}
```
