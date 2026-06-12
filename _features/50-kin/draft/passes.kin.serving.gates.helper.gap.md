# Draft: passes.kin.serving.gates.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/kin/passes.kin.serving.gates.helper.ts`

**Gap (feature 50):** Hard serving gates — not guidelines.

---

```typescript
import {
	MIN_KIN_CLUSTER_MEMBERS,
	MIN_KIN_SAMPLE_COUNT,
} from '@brioela/shared/constants/kin/kin.serving.gates.constant'

export type KinServingGateInput = {
	sampleCount: number
	clusterMemberCount: number
}

export function passesKinServingGates(input: KinServingGateInput): boolean {
	return (
		input.sampleCount >= MIN_KIN_SAMPLE_COUNT &&
		input.clusterMemberCount >= MIN_KIN_CLUSTER_MEMBERS
	)
}
```

No admin override. No beta exception. Checked on every read path.
