# Draft: passport.routes.ts (gap — file does not exist)

Target: `shared/routes/passport.routes.ts`

**Gap (feature 47):** Route constants for owner API + public link edge.

**Source:** `build-guide/28-passport/02-passport-data-model.md`, `04-privacy-and-consent.md`

---

```typescript
export const PASSPORT_ROUTES = {
	preview: '/api/passport/preview',
	create: '/api/passport/create',
	revoke: '/api/passport/:passportId/revoke',
	get: '/api/passport/:passportId',
	list: '/api/passport',
	/** Public — unguessable token only; no auth */
	publicLink: '/p/:linkToken',
} as const

export type PassportRouteKey = keyof typeof PASSPORT_ROUTES
```
