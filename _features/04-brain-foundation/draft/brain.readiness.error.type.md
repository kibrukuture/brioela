# Draft: brain.readiness.error.type.ts

Target: `backend/src/agents/brain/_types/brain.readiness.error.type.ts`

```ts
export class BrainReadinessUnavailableError extends Error {
	constructor() {
		super('Brioela Brain migrations have not reported readiness.')
		this.name = 'BrainReadinessUnavailableError'
	}
}
```
