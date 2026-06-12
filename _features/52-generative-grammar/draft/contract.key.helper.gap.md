# Draft: contract-key.ts (gap — file does not exist)

Target: `shared/contracts/contract-key.ts`

**Gap (feature 52):** Contract-derived TanStack Query keys — part of contract spine.

**Source:** `21-contract-spine-hardening.md`, `22-ts-rest-full-stack-standard.md`

---

```typescript
import { createHash } from 'node:crypto'

export function stableContractInputHash(input: unknown): string {
	const json = JSON.stringify(input, Object.keys(input as object).sort())
	return createHash('sha256').update(json).digest('hex').slice(0, 16)
}

export function contractKey(
	endpoint: { metadata?: { id?: string } },
	input?: unknown,
): readonly [string] | readonly [string, string] {
	const id = endpoint.metadata?.id
	if (!id) {
		throw new Error('Contract endpoint is missing metadata.id')
	}
	return input ? ([id, stableContractInputHash(input)] as const) : ([id] as const)
}
```
