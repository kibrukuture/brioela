# Draft: encore.sourcing.status.constant.ts (gap — file does not exist)

Target: `shared/constants/encore/encore.sourcing.status.constant.ts`

**Source:** `build-guide/31-encore/03-constraint-adaptation-and-sourcing.md`

```typescript
export const ENCORE_SOURCING_STATUS = {
	HAVE: 'have',
	NEARBY: 'nearby',
	HARD_TO_FIND: 'hard-to-find',
} as const

export type EncoreSourcingStatus =
	(typeof ENCORE_SOURCING_STATUS)[keyof typeof ENCORE_SOURCING_STATUS]

export const encoreSourcingStatusSchema = [
	ENCORE_SOURCING_STATUS.HAVE,
	ENCORE_SOURCING_STATUS.NEARBY,
	ENCORE_SOURCING_STATUS.HARD_TO_FIND,
] as const
```
