# Draft: heirloom.item.type.constant.ts (gap — file does not exist)

Target: `shared/constants/heirloom/heirloom.item.type.constant.ts`

---

```typescript
export const heirloomItemTypeValues = ['recipe', 'style_profile', 'moment'] as const
export type HeirloomItemType = (typeof heirloomItemTypeValues)[number]
```
