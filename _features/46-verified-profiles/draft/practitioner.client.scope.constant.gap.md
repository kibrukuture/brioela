# Draft: practitioner.client.scope.constant.ts (gap — file does not exist)

Target: `shared/constants/verified/practitioner.client.scope.constant.ts`

Source: `build-guide/23-verified-profiles/05-client-and-practitioner-boundary.md`

**Privacy:** Wearable/CGM and Mesa scopes are intentionally absent from v1.

---

```typescript
export const practitionerClientScopeValues = [
  'active_conditions',
  'condition_annotations',
  'recipe_guidance',
  'meal_plan_guidance',
  'scan_flag_context',
] as const

export type PractitionerClientScope = (typeof practitionerClientScopeValues)[number]

export const practitionerClientRelationshipStatusValues = [
  'pending',
  'active',
  'revoked',
  'expired',
] as const

export type PractitionerClientRelationshipStatus =
  (typeof practitionerClientRelationshipStatusValues)[number]

/** Max active client accounts per practitioner (spec 19). */
export const MAX_PRACTITIONER_CLIENTS = 10

export const practitionerScopeLabels: Record<PractitionerClientScope, string> = {
  active_conditions: 'View your active medical food profiles',
  condition_annotations: 'Add food guidance notes to your conditions',
  recipe_guidance: 'Recommend recipes within your food rules',
  meal_plan_guidance: 'Suggest meal-plan constraints',
  scan_flag_context: 'See condition-related scan flags for guidance',
}
```
