# Draft: wearable.audit.event.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/wearable.audit.event.schema.ts`

**Source:** `build-guide/20-wearables/06-privacy-disconnect.md` — audit without raw health values

---

```typescript
import { check, index, integer, sqliteTable, text } from '@/database/sqlite/_schema'

export const wearableAuditEventTypeValues = [
  'device_connected',
  'permissions_granted',
  'summary_ingested',
  'memory_written',
  'glucose_window_derived',
  'device_disconnected',
  'data_deleted',
] as const
export type WearableAuditEventType = (typeof wearableAuditEventTypeValues)[number]

export const wearableAuditEvents = sqliteTable(
  'wearable_audit_event',
  {
    eventId: text('event_id').primaryKey(),
    userId: text('user_id').notNull(),
    connectionId: text('connection_id'),
    eventType: text('event_type').notNull().$type<WearableAuditEventType>(),
    payloadJson: text('payload_json').notNull(),
    createdAt: integer('created_at', { mode: 'number' }).notNull(),
  },
  (table) => [
    check(
      'wearable_audit_event_payload_object_check',
      `json_valid(${table.payloadJson.name}) AND json_type(${table.payloadJson.name}) = 'object'`,
    ),
    index('idx_wearable_audit_user_time').on(table.userId, table.createdAt),
  ],
)

export type BrainWearableAuditEvent = typeof wearableAuditEvents.$inferSelect
```

Payload must never include raw glucose readings, full sleep stage arrays, or HRV minute series.
