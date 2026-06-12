# Draft: users.brioela_plan_tier migration (gap — column does not exist)

Target: Supabase migration via **01**/**03** — contract owned by **43**

**Gap:** `users.subscription_tier` enum stores billing **period** (`monthly`/`yearly`) — not product plan (**C3**).

**Source:** `shared/drizzle/schema/user.schema.ts:41-47`, `117`

---

```sql
-- Add product plan tier (authoritative for entitlements)
ALTER TABLE brioela.users
  ADD COLUMN IF NOT EXISTS brioela_plan_tier text
    CHECK (brioela_plan_tier IN ('sapor', 'luma', 'culina', 'viva', 'signet'))
    DEFAULT 'sapor'
    NOT NULL;

ALTER TABLE brioela.users
  ADD COLUMN IF NOT EXISTS brioela_addons jsonb NOT NULL DEFAULT '[]';

ALTER TABLE brioela.users
  ADD COLUMN IF NOT EXISTS voice_sessions_used_period integer NOT NULL DEFAULT 0;

ALTER TABLE brioela.users
  ADD COLUMN IF NOT EXISTS recipe_save_count integer NOT NULL DEFAULT 0;

-- Clarify misnamed column (follow-up migration — do not break existing reads in one step):
-- RENAME subscription_tier → subscription_period_type;
```

```typescript
// user.schema.ts additions (after migration)
export const BrioelaPlanTier = brioelaSchema.enum('brioela_plan_tier', [
  'sapor',
  'luma',
  'culina',
  'viva',
  'signet',
])

// users table:
brioelaPlanTier: BrioelaPlanTier('brioela_plan_tier').default('sapor').notNull(),
brioelaAddons: jsonb('brioela_addons').default([]).notNull(),
voiceSessionsUsedPeriod: integer('voice_sessions_used_period').default(0).notNull(),
recipeSaveCount: integer('recipe_save_count').default(0).notNull(),
```
