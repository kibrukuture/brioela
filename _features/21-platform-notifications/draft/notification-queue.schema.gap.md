# Draft: notification.queue.schema.ts (gap)

Target: `backend/src/agents/brain/_schemas/notification.queue.schema.ts`

Source: `build-guide/12-notifications/06-data-model-and-tools.md`

---

## Intended schema

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const notificationQueue = sqliteTable('notification_queue', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	type: text('type').notNull(),
	priority: text('priority').notNull(),
	payloadJson: text('payload_json').notNull(),
	earliestDeliverAt: integer('earliest_deliver_at').notNull(),
	expiresAt: integer('expires_at'),
	status: text('status').notNull().default('pending'), // pending | delivered | expired
	createdAt: integer('created_at').notNull(),
})
```

`payload_json` stores serialized `{ title, body, data, content_ref, idempotency_key }`.

Drain: `readPendingNotificationQueue(userId, now)` where `earliest_deliver_at <= now` and `expires_at` null or `> now`.
