# Draft: encore.routes.ts (gap — file does not exist)

Target: `shared/routes/encore.routes.ts`

```typescript
export const ENCORE_ROUTES = {
	create: '/api/encores',
	getById: (encoreId: string) => `/api/encores/${encoreId}`,
	refine: (encoreId: string) => `/api/encores/${encoreId}/refine`,
} as const
```
