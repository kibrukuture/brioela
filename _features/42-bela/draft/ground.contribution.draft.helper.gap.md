# Draft: draft.ground.finds.from.session.helper.ts (gap — file does not exist)

Target: `backend/src/agents/bela/_helpers/draft.ground.finds.from.session.helper.ts`

**Source:** `implementable-specs/bela/07-ground-contribution.md`, `_features/27-ground/draft/find.schema.gap.md`

---

```typescript
export type ScanForGroundDraft = {
	productName: string
	storeName: string
	priceCents: number | null
	lastKnownPriceCents: number | null
	lastSightingDaysAgo: number | null
	isNewProduct: boolean
	freshnessRating: 'very_fresh' | 'fine' | 'old' | null
	wasConstraintBlock: boolean
}

export type GroundFindDraft = {
	draftText: string
	signalKind: 'price' | 'availability' | 'new_product' | 'freshness'
	productId: string | null
	placeId: string
}

export function draftGroundFindsFromSession(scans: ScanForGroundDraft[]): GroundFindDraft[] {
	const drafts: GroundFindDraft[] = []

	for (const scan of scans) {
		if (scan.wasConstraintBlock) continue

		if (
			scan.priceCents !== null &&
			scan.lastKnownPriceCents !== null &&
			Math.abs(scan.priceCents - scan.lastKnownPriceCents) / scan.lastKnownPriceCents > 0.05
		) {
			drafts.push({
				draftText: `${scan.productName} — $${(scan.priceCents / 100).toFixed(2)} at ${scan.storeName}.`,
				signalKind: 'price',
				productId: null,
				placeId: scan.storeName,
			})
		}

		if (scan.lastSightingDaysAgo === null || scan.lastSightingDaysAgo > 7) {
			drafts.push({
				draftText: `${scan.productName} back in stock at ${scan.storeName}.`,
				signalKind: 'availability',
				productId: null,
				placeId: scan.storeName,
			})
		}

		if (scan.isNewProduct) {
			drafts.push({
				draftText: `New: ${scan.productName} at ${scan.storeName}.`,
				signalKind: 'new_product',
				productId: null,
				placeId: scan.storeName,
			})
		}
	}

	return drafts
}
```
