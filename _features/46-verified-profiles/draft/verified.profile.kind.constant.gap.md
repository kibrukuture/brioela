# Draft: verified.profile.kind.constant.ts (gap — file does not exist)

Target: `shared/constants/verified/verified.profile.kind.constant.ts`

Source: `build-guide/23-verified-profiles/01-profile-types.md`, `04-verified-profile.md`, `03-verified-business.md`

---

```typescript
export const verifiedProfileKindValues = ['verified_profile', 'verified_business'] as const
export type VerifiedProfileKind = (typeof verifiedProfileKindValues)[number]

export const verifiedPersonSubtypeValues = [
  'dietitian',
  'nutritionist',
  'clinician',
  'health_practitioner',
  'coach',
  'chef',
  'creator',
  'food_educator',
] as const
export type VerifiedPersonSubtype = (typeof verifiedPersonSubtypeValues)[number]

export const verifiedBusinessSubtypeValues = [
  'restaurant',
  'cafe',
  'cloud_kitchen',
  'meal_prep',
  'health_store',
  'grocery_store',
  'brand',
  'market',
  'other',
] as const
export type VerifiedBusinessSubtype = (typeof verifiedBusinessSubtypeValues)[number]

export const practitionerPersonSubtypes = [
  'dietitian',
  'nutritionist',
  'clinician',
  'health_practitioner',
  'coach',
] as const satisfies readonly VerifiedPersonSubtype[]

export const creatorPersonSubtypes = ['chef', 'creator', 'food_educator'] as const satisfies readonly VerifiedPersonSubtype[]

export function isPractitionerSubtype(subtype: VerifiedPersonSubtype): boolean {
  return (practitionerPersonSubtypes as readonly string[]).includes(subtype)
}
```
