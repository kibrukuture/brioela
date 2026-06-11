# Draft: test.worker.ts

Target: `backend/src/agents/brain/test.worker.ts`

```ts
export { BrioelaBrain } from '@/agents/brain'

export default {
	fetch(): Response {
		return new Response(null, { status: 404 })
	},
} satisfies ExportedHandler<Cloudflare.Env>
```
