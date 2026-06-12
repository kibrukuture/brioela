# Draft: compute.smart.route.helper.ts (gap — file does not exist)

Target: `backend/src/agents/bela/_helpers/compute.smart.route.helper.ts`

**Source:** `implementable-specs/bela/08-smart-routing.md`

---

```typescript
export type RouteStop = {
	placeId: string
	placeName: string
	itemIds: string[]
	distanceKmFromPrevious: number
}

export type SmartRouteResult = {
	stops: RouteStop[]
	confidence: 'high' | 'low'
	estimatedSavingsCents: number
}

type ItemLocationScore = {
	itemId: string
	placeId: string
	score: number
}

function availabilityConfidence(daysSinceLastSeen: number): number {
	if (daysSinceLastSeen < 1) return 0.95
	if (daysSinceLastSeen < 3) return 0.85
	if (daysSinceLastSeen < 7) return 0.7
	if (daysSinceLastSeen < 14) return 0.5
	if (daysSinceLastSeen < 30) return 0.3
	return 0.1
}

export function computeSmartRoute(
	itemIds: string[],
	scores: ItemLocationScore[],
	userHome: { lat: number; lng: number },
): SmartRouteResult {
	const byPlace = new Map<string, string[]>()
	for (const row of scores.filter((s) => s.score >= 0.5)) {
		const list = byPlace.get(row.placeId) ?? []
		list.push(row.itemId)
		byPlace.set(row.placeId, list)
	}

	if (byPlace.size === 0) {
		return { stops: [], confidence: 'low', estimatedSavingsCents: 0 }
	}

	const primary = [...byPlace.entries()].sort((a, b) => b[1].length - a[1].length)[0]
	const primaryCoverage = primary[1].length / itemIds.length

	if (primaryCoverage >= 0.8) {
		return {
			stops: [
				{
					placeId: primary[0],
					placeName: primary[0],
					itemIds: primary[1],
					distanceKmFromPrevious: 0,
				},
			],
			confidence: 'high',
			estimatedSavingsCents: 0,
		}
	}

	return { stops: [], confidence: 'low', estimatedSavingsCents: 0 }
}

export { availabilityConfidence }
```
