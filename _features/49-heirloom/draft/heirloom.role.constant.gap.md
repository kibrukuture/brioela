# Draft: heirloom.role.constant.ts (gap — file does not exist)

Target: `shared/constants/heirloom/heirloom.role.constant.ts`

---

```typescript
export const heirloomRoleValues = ['owner', 'keeper', 'recipient'] as const
export type HeirloomRole = (typeof heirloomRoleValues)[number]
```
