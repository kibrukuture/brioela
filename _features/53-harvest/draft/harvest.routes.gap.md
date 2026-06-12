# Draft: harvest.routes.ts (gap — file does not exist)

Target: `shared/routes/harvest.routes.ts`

**Gap (feature 53):** API route constants.

---

```typescript
export const HARVEST_ROUTES = {
	EDITION: '/api/harvest/editions/:editionId',
	EDITIONS: '/api/harvest/editions',
	EDITION_OPENED: '/api/harvest/editions/:editionId/opened',
	CHAPTER_SHARE: '/api/harvest/editions/:editionId/chapters/:chapterId/share',
} as const
```
