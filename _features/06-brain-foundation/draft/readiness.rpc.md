# Draft: readiness.rpc.ts

Target: `backend/src/agents/brain/_rpc/readiness.rpc.ts`

```ts
import type { BrainMigrationReadiness } from '@/agents/brain/_migrations'

export interface CheckedBrainReadiness {
	readiness: BrainMigrationReadiness
}
```
