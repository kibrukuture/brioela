# Draft: wearable.connection.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/wearable.connection.schema.ts`

**Gap (feature 36):** Per-user wearable provider connection metadata. OAuth tokens stored encrypted in `credentials_json` or device-only per G29 decision.

**Source:** `build-guide/20-wearables/01-connection-model.md`

---

```typescript
import { check, index, integer, sqliteTable, text } from '@/database/sqlite/_schema'

export const wearableProviderValues = [
  'apple_health',
  'oura',
  'health_connect',
  'dexcom',
  'abbott',
  'whoop',
  'withings',
] as const
export type WearableProvider = (typeof wearableProviderValues)[number]

export const wearableConnectionKindValues = [
  'native_permission',
  'oauth',
  'manual_import',
] as const
export type WearableConnectionKind = (typeof wearableConnectionKindValues)[number]

export const wearableConnectionStatusValues = [
  'connected',
  'disconnected',
  'needs_reauth',
  'error',
] as const
export type WearableConnectionStatus = (typeof wearableConnectionStatusValues)[number]

export const wearableDataTypeValues = [
  'sleep',
  'hrv',
  'resting_heart_rate',
  'activity',
  'body_temperature_deviation',
  'blood_oxygen',
  'weight',
  'glucose',
] as const
export type WearableDataType = (typeof wearableDataTypeValues)[number]

export const wearableConnections = sqliteTable(
  'wearable_connection',
  {
    connectionId: text('connection_id').primaryKey(),
    userId: text('user_id').notNull(),
    provider: text('provider').notNull().$type<WearableProvider>(),
    connectionKind: text('connection_kind').notNull().$type<WearableConnectionKind>(),
    grantedDataTypesJson: text('granted_data_types_json').notNull(),
    status: text('status').notNull().$type<WearableConnectionStatus>(),
    credentialsJson: text('credentials_json'),
    connectedAt: integer('connected_at', { mode: 'number' }).notNull(),
    lastSyncAt: integer('last_sync_at', { mode: 'number' }),
    disconnectedAt: integer('disconnected_at', { mode: 'number' }),
    errorCode: text('error_code'),
    createdAt: integer('created_at', { mode: 'number' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
  },
  (table) => [
    check(
      'wearable_connection_granted_types_array_check',
      /* json_valid + json_type = 'array' */ `json_valid(${table.grantedDataTypesJson.name}) AND json_type(${table.grantedDataTypesJson.name}) = 'array'`,
    ),
    index('idx_wearable_connection_user_status').on(table.userId, table.status),
    index('idx_wearable_connection_provider').on(table.userId, table.provider),
  ],
)

export type BrainWearableConnection = typeof wearableConnections.$inferSelect
export type InsertBrainWearableConnection = typeof wearableConnections.$inferInsert
```
