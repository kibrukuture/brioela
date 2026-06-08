/// <reference types="@cloudflare/vitest-pool-workers/types" />

import type { BrioelaBrain } from '@/agents/brain'

declare global {
	namespace Cloudflare {
		interface Env {
			BRIOELA_BRAIN: DurableObjectNamespace<BrioelaBrain>
		}
	}
}
