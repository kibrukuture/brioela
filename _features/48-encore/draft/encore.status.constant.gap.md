# Draft: encore.status.constant.ts (gap — file does not exist)

Target: `shared/constants/encore/encore.status.constant.ts`

```typescript
export const ENCORE_STATUS = {
	RECONSTRUCTING: 'reconstructing',
	DRAFT: 'draft',
	REFINING: 'refining',
	STABLE: 'stable',
} as const

export type EncoreStatus = (typeof ENCORE_STATUS)[keyof typeof ENCORE_STATUS]

export const encoreStatusSchema = [
	ENCORE_STATUS.RECONSTRUCTING,
	ENCORE_STATUS.DRAFT,
	ENCORE_STATUS.REFINING,
	ENCORE_STATUS.STABLE,
] as const
```
