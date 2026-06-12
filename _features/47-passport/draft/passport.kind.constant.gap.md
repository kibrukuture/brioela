# Draft: passport.kind.constant.ts (gap — file does not exist)

Target: `shared/constants/passport/passport.kind.constant.ts`

**Gap (feature 47):** Canonical `PassportKind` union — product name stays **Passport**, not "Mesa Passport".

**Source:** `brioela-specs/43-passport.md`, `build-guide/28-passport/01-passport-types.md`

---

```typescript
export const passportKindValues = [
	'personal_food_safety',
	'mesa_table',
	'restaurant_menu',
	'bela_shopper',
	'caregiver_school',
	'travel_translation',
	'practitioner_guidance',
] as const

export type PassportKind = (typeof passportKindValues)[number]

export const passportKindLabels: Record<PassportKind, string> = {
	personal_food_safety: 'Personal food safety',
	mesa_table: 'Table',
	restaurant_menu: 'Restaurant menu',
	bela_shopper: 'Shopper rules',
	caregiver_school: 'Caregiver / school',
	travel_translation: 'Travel translation',
	practitioner_guidance: 'Practitioner guidance',
}
```
