# Draft: kids.mode.routes.ts + API module (gap — files do not exist)

Target: `shared/routes/kids.mode.routes.ts`, `backend/src/api/kids.mode/`

**Gap:** No HTTP routes for profile or explain.

**Source:** `_features/44-kids-mode/build.md`

---

```typescript
// shared/routes/kids.mode.routes.ts
export const KIDS_MODE_ROUTES = {
	profile: '/api/kids-mode/profile',
	explain: '/api/kids-mode/explain',
} as const

export const KIDS_MODE_ROUTE_PATTERNS = {
	profile: '/api/kids-mode/profile',
	explain: '/api/kids-mode/explain',
} as const
```

```typescript
// backend/src/api/kids.mode/kids.mode.route.ts
import { Hono } from 'hono'
import { KIDS_MODE_ROUTES } from '@/shared/routes/kids.mode.routes'
import { generateKidsExplanationHandler } from '@/agents/brain/_handlers/kids.mode/generate.kids.explanation.handler'
import { getKidsModeProfileHandler } from '@/agents/brain/_handlers/kids.mode/get.kids.mode.profile.handler'
import { setKidsModeProfileHandler } from '@/agents/brain/_handlers/kids.mode/set.kids.mode.profile.handler'
import { requireAuth } from '@/core/middleware/require.auth.middleware'

export const kidsModeRoute = new Hono()

kidsModeRoute.get(KIDS_MODE_ROUTES.profile, requireAuth, async (c) => {
	const userId = c.get('userId')
	const result = await getKidsModeProfileHandler({ userId })
	return c.json(result.body, result.status)
})

kidsModeRoute.patch(KIDS_MODE_ROUTES.profile, requireAuth, async (c) => {
	const userId = c.get('userId')
	const body = await c.req.json()
	const result = await setKidsModeProfileHandler({ userId, body })
	return c.json(result.body, result.status)
})

kidsModeRoute.post(KIDS_MODE_ROUTES.explain, requireAuth, async (c) => {
	const userId = c.get('userId')
	const body = await c.req.json()
	const result = await generateKidsExplanationHandler({ userId, body })
	return c.json(result.body, result.status)
})
```
