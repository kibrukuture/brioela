# Draft: compose-brioela-generative-ui-for-contract.ts (gap — file does not exist)

Target: `backend/src/core/generative-grammar/compose-brioela-generative-ui-for-contract.ts`

**Gap (feature 52):** Enforce `brioela_generative_ui` policy from ts-rest contract metadata.

**Source:** `21-contract-spine-hardening.md`, `22-ts-rest-full-stack-standard.md`

---

```typescript
import type { GenerativeSurface } from '@brioela/shared/grammar/schema/surfaces'
import type { BrioelaGenerativeUiDocument } from '@brioela/shared/grammar'
import {
	composeBrioelaGenerativeUi,
	type ComposeBrioelaGenerativeUiInput,
} from './compose-brioela-generative-ui'

export type BrioelaGenerativeUiPolicy =
	| { allowed: false }
	| {
			allowed: true
			mode: 'http_optional' | 'stream_event'
			surfaces: GenerativeSurface[]
			safetyLock: 'always' | 'required_when_hard_blocks' | 'feature_decides'
	  }

export type ContractEndpoint = {
	metadata?: {
		brioela_generative_ui?: BrioelaGenerativeUiPolicy
	}
}

export async function composeBrioelaGenerativeUiForContract(
	endpoint: ContractEndpoint,
	input: ComposeBrioelaGenerativeUiInput,
): Promise<BrioelaGenerativeUiDocument | null> {
	const policy = endpoint.metadata?.brioela_generative_ui
	if (!policy?.allowed) {
		return null
	}

	if (!policy.surfaces.includes(input.surface)) {
		return null
	}

	return composeBrioelaGenerativeUi(input)
}

export function assertBrioelaGenerativeUiAllowedByContract(
	endpoint: ContractEndpoint,
	document: BrioelaGenerativeUiDocument | null | undefined,
): void {
	const policy = endpoint.metadata?.brioela_generative_ui
	if (!document) {
		return
	}
	if (!policy?.allowed) {
		throw new Error('brioelaGenerativeUi present but contract policy disallows it')
	}
	if (!policy.surfaces.includes(document.surface)) {
		throw new Error(`surface ${document.surface} not allowed by contract policy`)
	}
}
```
