# Draft: viral.sharing.routes.ts (gap — file does not exist)

Target: `shared/routes/viral.sharing.routes.ts`

**Gap (feature 51):** Route spine for preview + confirm + attribution resolve.

**Source:** `build-guide/02-coding-standards/01-monorepo-and-folder-structure.md`

---

```typescript
export const VIRAL_SHARING_ROUTES = {
	base: '/viral-sharing',
	requestCard: () => '/viral-sharing/discovery-cards/request',
	confirmShare: () => '/viral-sharing/discovery-cards/confirm',
	resolveAttribution: (tag: string) => `/viral-sharing/attribution/${tag}`,
} as const

export const VIRAL_SHARING_ROUTE_PATTERNS = {
	requestCard: '/viral-sharing/discovery-cards/request',
	confirmShare: '/viral-sharing/discovery-cards/confirm',
	resolveAttribution: '/viral-sharing/attribution/:tag',
} as const
```
