# Draft: user.entitlement.schema.ts (gap — files do not exist)

Targets:
- `shared/validator/pricing/user.entitlement.schema.ts`
- `backend/src/agents/brain/_schemas/user.entitlement.schema.ts`

**Gap:** No Zod contract for `UserEntitlement` / `TierAccessResult`; no Brain mirror table.

**Source:** `build-guide/25-pricing-tiers/04-access-checks-and-tools.md`

---

```typescript
// shared/validator/pricing/user.entitlement.schema.ts
import { z } from 'zod'
import { BrioelaAddon, BrioelaTier } from '@brioela/shared/constants/tiers/tiers.constant'
import type { FeatureAction } from '@brioela/shared/constants/tiers/tier.entitlement.matrix.constant'

export const BillingStateSchema = z.enum([
  'free',
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired',
])

export const UserEntitlementSchema = z.object({
  userId: z.string().uuid(),
  tier: z.enum([
    BrioelaTier.SAPOR,
    BrioelaTier.LUMA,
    BrioelaTier.CULINA,
    BrioelaTier.VIVA,
    BrioelaTier.SIGNET,
  ]),
  addons: z.array(
    z.enum([
      BrioelaAddon.MESA,
      BrioelaAddon.SESSION_CREDITS,
      BrioelaAddon.BELA_SERVICE,
    ]),
  ),
  billingStatus: BillingStateSchema,
  currentPeriodEndsAt: z.number().nullable(),
  voiceSessionsUsedThisPeriod: z.number().int().nonnegative(),
  recipeSaveCount: z.number().int().nonnegative(),
})

export type UserEntitlement = z.infer<typeof UserEntitlementSchema>

export const TierAccessResultSchema = z.object({
  allowed: z.boolean(),
  requiredTier: z
    .enum([
      BrioelaTier.SAPOR,
      BrioelaTier.LUMA,
      BrioelaTier.CULINA,
      BrioelaTier.VIVA,
      BrioelaTier.SIGNET,
    ])
    .nullable(),
  requiredAddon: z
    .enum([
      BrioelaAddon.MESA,
      BrioelaAddon.SESSION_CREDITS,
      BrioelaAddon.BELA_SERVICE,
    ])
    .nullable(),
  reason: z.enum([
    'allowed',
    'requires_upgrade',
    'usage_limit_reached',
    'billing_inactive',
  ]),
  upgradeTarget: z.union([
    z.enum([
      BrioelaTier.SAPOR,
      BrioelaTier.LUMA,
      BrioelaTier.CULINA,
      BrioelaTier.VIVA,
      BrioelaTier.SIGNET,
    ]),
    z.enum([
      BrioelaAddon.MESA,
      BrioelaAddon.SESSION_CREDITS,
      BrioelaAddon.BELA_SERVICE,
    ]),
  ]).nullable(),
})

export type TierAccessResult = z.infer<typeof TierAccessResultSchema>

export const CheckTierAccessRequestSchema = z.object({
  action: z.string() as z.ZodType<FeatureAction>,
})
```

```typescript
// backend/src/agents/brain/_schemas/user.entitlement.schema.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const userEntitlement = sqliteTable('user_entitlement', {
  userId: text('user_id').primaryKey(),
  tier: text('tier').notNull(),
  addonsJson: text('addons_json').notNull().default('[]'),
  billingStatus: text('billing_status').notNull(),
  currentPeriodEndsAt: integer('current_period_ends_at'),
  voiceSessionsUsedThisPeriod: integer('voice_sessions_used_this_period')
    .notNull()
    .default(0),
  recipeSaveCount: integer('recipe_save_count').notNull().default(0),
  syncedAt: integer('synced_at').notNull(),
})
```
