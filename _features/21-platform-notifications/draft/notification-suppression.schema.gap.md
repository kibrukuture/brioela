# Draft: notification.suppression.schema.ts (gap)

Target: `backend/src/agents/brain/_schemas/notification.suppression.schema.ts`

Source: `build-guide/12-notifications/03-suppression-state.md`

---

## Intended schema

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const notificationSuppression = sqliteTable('notification_suppression', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	notificationType: text('notification_type').notNull(),
	dismissedCount: integer('dismissed_count').notNull().default(0),
	lastDismissedAt: integer('last_dismissed_at'),
	suppressedUntil: integer('suppressed_until'),
	permanent: integer('permanent', { mode: 'boolean' }).notNull().default(false),
	updatedAt: integer('updated_at').notNull(),
})
```

Rules enforced in `evaluate.delivery.rules.helper.ts`:

- 2 dismissals → `suppressed_until = now + 14d`
- 3 dismissals → `permanent = true`
- Critical types (`allergy_safety_scan`, `recall_alert_confirmed`) bypass read

Ambient families may use prefixed types: `ambient:patterns`, `ambient:travel`, etc. per `18-ambient-intelligence/06-surfacing-and-privacy.md`.
