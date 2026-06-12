# Draft: check.constraint.for.order.helper.ts (gap — file does not exist)

Target: `backend/src/agents/bela/_helpers/check.constraint.for.order.helper.ts`

**Gap:** No shared constraint enforcement for Bela shopper scans and **45** in-store co-pilot.

**Source:** `implementable-specs/bela/03-constraint-travel.md`, `brioela-specs/45-in-store-copilot.md`

---

```typescript
import type { OrderConstraintSnapshot, HardBlock, SoftGuidance } from '@brioela/shared/validator/bela/order.constraint.snapshot.schema'

export type ProductProfileForConstraint = {
	brand: string
	ingredients: string[]
	attributes: string[]
}

export type ConstraintCheckResult =
	| { blocked: true; kind: 'hard'; block: HardBlock }
	| { blocked: false; warnings: Array<{ guidance: SoftGuidance; matched: string }> }

const INGREDIENT_SYNONYMS: Record<string, string[]> = {
	peanut: ['groundnut', 'arachis'],
	sesame: ['sesame oil', 'sesame paste', 'tahini'],
}

function normalizedMatch(haystack: string, needle: string): boolean {
	const h = haystack.toLowerCase()
	const n = needle.toLowerCase()
	if (h.includes(n)) return true
	const synonyms = INGREDIENT_SYNONYMS[n]
	if (synonyms?.some((syn) => h.includes(syn.toLowerCase()))) return true
	return false
}

export function checkConstraintForOrder(
	product: ProductProfileForConstraint,
	snapshot: OrderConstraintSnapshot,
): ConstraintCheckResult {
	for (const block of snapshot.hardBlocks) {
		if (block.entityKind === 'ingredient') {
			const match = product.ingredients.some((ing) => normalizedMatch(ing, block.entityValue))
			if (match) return { blocked: true, kind: 'hard', block }
		}
		if (block.entityKind === 'brand' && normalizedMatch(product.brand, block.entityValue)) {
			return { blocked: true, kind: 'hard', block }
		}
	}

	const warnings: Array<{ guidance: SoftGuidance; matched: string }> = []
	for (const guidance of snapshot.softGuidance) {
		if (guidance.entityKind === 'ingredient') {
			const matched = product.ingredients.find((ing) => normalizedMatch(ing, guidance.entityValue))
			if (matched) warnings.push({ guidance, matched })
		}
		if (guidance.entityKind === 'attribute') {
			const matched = product.attributes.find((attr) => normalizedMatch(attr, guidance.entityValue))
			if (matched) warnings.push({ guidance, matched })
		}
	}

	return { blocked: false, warnings }
}
```
