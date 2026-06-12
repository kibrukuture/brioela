# Gap snapshot: menu.scan.schema.ts

Target: `shared/validator/menu.scan.schema.ts`

**Status:** Not in repo. From `build-guide/17-menu-scanning/` 01–04, 08.

```typescript
import { z } from 'zod'

export const MenuScanSourceSchema = z.enum(['photo', 'multi_page_photo', 'url', 'qr_url'])

export const MenuScanPhotosRequestSchema = z.object({
  imagesBase64: z.array(z.string().min(1)).min(1).max(12),
  restaurantId: z.string().uuid().nullable().optional(),
  placeName: z.string().max(200).nullable().optional(),
  geoHash: z.string().max(12).nullable().optional(),
  capturedAt: z.number().int().positive(),
})

export const MenuScanUrlRequestSchema = z.object({
  url: z.string().url(),
  qrPayload: z.string().max(2048).optional(),
  restaurantId: z.string().uuid().nullable().optional(),
  placeName: z.string().max(200).nullable().optional(),
  geoHash: z.string().max(12).nullable().optional(),
  capturedAt: z.number().int().positive(),
})

export const MenuVisionWarningSchema = z.enum([
  'low_light',
  'glare',
  'partial_page',
  'text_too_small',
  'vision_extraction_uncertain',
])

export const ParsedMenuDishSchema = z.object({
  id: z.string(),
  section: z.string().nullable(),
  name: z.string().min(1),
  description: z.string().nullable(),
  listedIngredients: z.array(z.string()),
  cookingMethod: z.string().nullable(),
  modifiers: z.array(z.string()),
  priceText: z.string().nullable(),
  sourcePageIndexes: z.array(z.number().int().nonnegative()),
  extractionConfidence: z.number().min(0).max(1),
})

export const ParsedMenuSchema = z.object({
  source: MenuScanSourceSchema,
  restaurantId: z.string().uuid().nullable(),
  placeName: z.string().nullable(),
  resolvedUrl: z.string().url().nullable(),
  dishes: z.array(ParsedMenuDishSchema),
  parserWarnings: z.array(z.string()),
})

export const DishVerdictLevelSchema = z.enum(['green', 'yellow', 'red'])

export const MatchedConstraintSchema = z.object({
  constraintType: z.enum([
    'hard_allergy',
    'intolerance',
    'dislike',
    'dietary_identity',
    'medical_watchlist',
  ]),
  entityValue: z.string(),
  severity: z.enum(['hard', 'soft']),
})

export const MenuDishVerdictSchema = z.object({
  dishId: z.string(),
  dishName: z.string(),
  verdict: DishVerdictLevelSchema,
  reason: z.string(),
  matchedConstraints: z.array(MatchedConstraintSchema),
  conditionFlags: z.array(
    z.object({
      conditionType: z.string(),
      flagLevel: z.enum(['hard', 'soft', 'info']),
      reason: z.string(),
    }),
  ),
  waiterQuestion: z.string().nullable(),
  confidence: z.number().min(0).max(1),
})

export const WaiterQuestionSchema = z.object({
  dishId: z.string(),
  primaryQuestion: z.string(),
  translatedQuestion: z.string().nullable(),
  staffLanguage: z.string().nullable(),
  riskIngredient: z.string(),
  questionType: z.enum(['contains', 'shared_prep', 'hidden_component', 'cooking_method']),
  secondaryQuestions: z.array(z.string()),
})

export const PlaceMenuOverlaySchema = z.object({
  placeId: z.string().uuid().nullable(),
  summaryLines: z.array(z.string()),
  communityConfidenceNote: z.string().nullable(),
})

export const MenuScanResultSchema = z.object({
  scanId: z.string().uuid(),
  source: MenuScanSourceSchema,
  restaurantId: z.string().uuid().nullable(),
  placeName: z.string().nullable(),
  resolvedUrl: z.string().url().nullable(),
  visionWarnings: z.array(MenuVisionWarningSchema),
  parserWarnings: z.array(z.string()),
  dishes: z.array(MenuDishVerdictSchema),
  placeOverlay: PlaceMenuOverlaySchema.nullable(),
  greenCount: z.number().int().nonnegative(),
  yellowCount: z.number().int().nonnegative(),
  redCount: z.number().int().nonnegative(),
  guardrailsUnavailable: z.boolean(),
  createdAt: z.number().int().positive(),
})

export const MenuLanguageBridgeSchema = z.object({
  userLanguage: z.string(),
  staffLanguage: z.string().nullable(),
  originalDishName: z.string(),
  translatedDishName: z.string(),
  bilingualQuestion: z
    .object({
      userLanguageText: z.string(),
      staffLanguageText: z.string(),
    })
    .nullable(),
  conversationModeAvailable: z.boolean(),
})

export type MenuScanPhotosRequest = z.infer<typeof MenuScanPhotosRequestSchema>
export type MenuScanUrlRequest = z.infer<typeof MenuScanUrlRequestSchema>
export type ParsedMenuDish = z.infer<typeof ParsedMenuDishSchema>
export type ParsedMenu = z.infer<typeof ParsedMenuSchema>
export type MenuDishVerdict = z.infer<typeof MenuDishVerdictSchema>
export type MenuScanResult = z.infer<typeof MenuScanResultSchema>
export type WaiterQuestion = z.infer<typeof WaiterQuestionSchema>
export type MenuLanguageBridge = z.infer<typeof MenuLanguageBridgeSchema>
```
