# Draft: test.env.d.ts

Target: `backend/src/agents/brain/test.env.d.ts`

```ts
/// <reference types="@cloudflare/vitest-pool-workers/types" />

import type { BrioelaBrain } from '@/agents/brain'

declare global {
	namespace Cloudflare {
		interface Env {
			BRIOELA_BRAIN: DurableObjectNamespace<BrioelaBrain>
		}
	}
}
```
