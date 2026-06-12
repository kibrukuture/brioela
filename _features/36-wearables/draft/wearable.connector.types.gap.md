# Draft: wearable.connector.types.ts (gap — file does not exist)

Target: `mobile/features/wearables/types/wearable.connector.types.ts`

**Source:** `build-guide/20-wearables/01-connection-model.md`

---

```typescript
import type { WearableDailySummary } from '@brioela/shared/validator/wearables/wearable.daily.summary.schema'

export type WearableProvider =
  | 'apple_health'
  | 'oura'
  | 'health_connect'
  | 'dexcom'
  | 'abbott'
  | 'whoop'
  | 'withings'

export type WearableDataType =
  | 'sleep'
  | 'hrv'
  | 'resting_heart_rate'
  | 'activity'
  | 'body_temperature_deviation'
  | 'blood_oxygen'
  | 'weight'
  | 'glucose'

export type WearableConnectionResult = {
  connectionId: string
  grantedDataTypes: WearableDataType[]
}

export type WearableConnector = {
  provider: WearableProvider
  connectionKind: 'native_permission' | 'oauth' | 'manual_import'
  supportedDataTypes: WearableDataType[]
  connect(grantedTypes: WearableDataType[]): Promise<WearableConnectionResult>
  disconnect(): Promise<void>
  buildDailySummary(localDate: string): Promise<WearableDailySummary | null>
}
```
