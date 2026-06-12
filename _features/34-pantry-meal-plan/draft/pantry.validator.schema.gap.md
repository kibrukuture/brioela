# Draft: shared/validator/pantry/*.schema.ts (gap — files do not exist)

Target: `shared/validator/pantry/`

**Gap (feature 34):** Zod contracts for API request/response shapes.

**Source:** `brioela-specs/33-minimum-spend-meal-plan.md`, `14-fridge-and-pantry-ingredient-rescue.md`

---

```typescript
import { z } from 'zod'

export const PantrySnapshotSourceSchema = z.enum(['camera', 'voice', 'import'])

export const PantryItemDetectionSchema = z.object({
  itemLabel: z.string().min(1),
  confidence: z.number().min(0).max(1),
  quantityEstimate: z.string().optional(),
  matchedProductId: z.string().optional(),
})

export const PostPantrySnapshotRequestSchema = z.object({
  sourceType: PantrySnapshotSourceSchema,
  imageBase64: z.string().min(1),
})

export const PantrySnapshotResponseSchema = z.object({
  snapshotId: z.string().uuid(),
  detections: z.array(PantryItemDetectionSchema),
})

export const MealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner'])

export const GenerateMealPlanRequestSchema = z.object({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferExistingInventory: z.boolean().default(true),
  previewDays: z.number().int().min(1).max(7).optional(),
})

export const MealPlanSlotSchema = z.object({
  slotId: z.string().uuid(),
  dayIndex: z.number().int().min(1).max(7),
  mealType: MealTypeSchema,
  recipeId: z.string().uuid(),
  recipeTitle: z.string(),
  ingredientStatus: z.array(
    z.object({
      name: z.string(),
      status: z.enum(['at_home', 'to_buy']),
    }),
  ),
})

export const ShoppingListItemSchema = z.object({
  id: z.string().uuid(),
  ingredientName: z.string(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['to_buy', 'already_have', 'bought']),
  estimatedCost: z.number().optional(),
  storeSuggestion: z.string().optional(),
  source: z.enum(['plan', 'predictive']).default('plan'),
})

export const ActiveMealPlanResponseSchema = z.object({
  planId: z.string().uuid(),
  weekStartDate: z.string(),
  status: z.enum(['active', 'completed', 'abandoned']),
  slots: z.array(MealPlanSlotSchema),
  shoppingList: z.array(ShoppingListItemSchema),
  estimatedTotalCost: z.number().optional(),
  budgetBaseline: z.number().optional(),
})

export const WeeklySummaryResponseSchema = z.object({
  weekStart: z.string(),
  oneLiner: z.string(),
  observations: z.array(z.string()).min(2).max(4),
  action: z.string().optional(),
  generatedAt: z.number().int(),
})
```
