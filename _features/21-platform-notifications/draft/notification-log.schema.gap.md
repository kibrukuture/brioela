# Draft: notification.log.schema.ts (gap — Brain SQLite table does not exist)

Target: `backend/src/agents/brain/_schemas/notification.log.schema.ts`

Source: `build-guide/12-notifications/06-data-model-and-tools.md`, `brioela-specs/23-ambient-notification-strategy.md`

---

## Intended schema (Brain DO SQLite via Drizzle)

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const notificationLog = sqliteTable('notification_log', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	type: text('type').notNull(),
	priority: text('priority').notNull(), // critical | high | medium | low
	contentRef: text('content_ref'),
	deliveredAt: integer('delivered_at'),
	openedAt: integer('opened_at'),
	dismissedAt: integer('dismissed_at'),
	providerId: text('provider_id'),
	createdAt: integer('created_at').notNull(),
})
```

Mobile open/dismiss events POST back to Brain or Worker to fill `opened_at` / `dismissed_at` — endpoint TBD in **21** follow-up.
