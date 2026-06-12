# Draft: apple.health.connector.ts (gap — file does not exist)

Target: `mobile/features/wearables/connectors/apple.health.connector.ts`

**Source:** `build-guide/20-wearables/01-connection-model.md` — server never calls HealthKit

**Implementation note:** Use `react-native-health` or Expo health module per current project stack — verify against Apple docs at implementation (session 022: docs were JS-gated).

---

```typescript
import AppleHealthKit, {
  type HealthKitPermissions,
  type HealthValue,
} from 'react-native-health'
import type { WearableConnector } from '../types/wearable.connector.types'
import type { WearableDailySummary } from '@brioela/shared/validator/wearables/wearable.daily.summary.schema'
import { buildDailySummaryFromHealthKit } from '../helpers/build.daily.summary.helper'

const PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.HeartRateVariability,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.OxygenSaturation,
      AppleHealthKit.Constants.Permissions.Weight,
    ],
    write: [],
  },
}

export function createAppleHealthConnector(connectionId: string): WearableConnector {
  return {
    provider: 'apple_health',
    connectionKind: 'native_permission',
    supportedDataTypes: [
      'sleep',
      'hrv',
      'resting_heart_rate',
      'activity',
      'blood_oxygen',
      'weight',
    ],
    async connect(grantedTypes) {
      await new Promise<void>((resolve, reject) => {
        AppleHealthKit.initHealthKit(PERMISSIONS, (err: string) => {
          if (err) reject(new Error(err))
          else resolve()
        })
      })
      return { connectionId, grantedDataTypes: grantedTypes }
    },
    async disconnect() {
      // OS permissions remain — Brioela stops reading locally
    },
    async buildDailySummary(localDate: string): Promise<WearableDailySummary | null> {
      const samples: HealthValue[] = []
      return buildDailySummaryFromHealthKit({
        connectionId,
        localDate,
        samples,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    },
  }
}
```

`app.json` must include `NSHealthShareUsageDescription` / `NSHealthUpdateUsageDescription` (G5).
