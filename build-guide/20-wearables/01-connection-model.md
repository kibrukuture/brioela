# Wearables — Connection Model

## What This File Covers

Device phases, user permission flow, supported integration categories, and the boundary between platform APIs, client code, and the Brain DO.

---

## Device Phases

Wearables ship in phases.

Phase 1:

- Apple HealthKit for iOS/Apple Watch users.
- Oura Ring via Oura API V2/OAuth.

Phase 2:

- CGM integrations where user-authorized APIs are available.
- Google Health Connect for Android aggregation.
- Whoop.
- Withings.

The implementation should keep the connector interface stable so new devices add adapters, not new memory architecture.

---

## Connector Interface

Brioela-owned connectors are the default integration model. A third-party wearable aggregation
provider is not part of the default architecture.

```typescript
type WearableConnector = {
  provider: "apple_health" | "oura" | "health_connect" | "dexcom" | "abbott" | "whoop" | "withings"
  connectionKind: "native_permission" | "oauth" | "manual_import"
  supportedDataTypes: WearableDataType[]
  connect(): Promise<WearableConnectionResult>
  disconnect(): Promise<void>
  buildDailySummary(date: string): Promise<WearableDailySummary | null>
}

type WearableDataType =
  | "sleep"
  | "hrv"
  | "resting_heart_rate"
  | "activity"
  | "body_temperature_deviation"
  | "blood_oxygen"
  | "weight"
  | "glucose"
```

The connector returns daily summaries, not raw streams.

---

## Permission Flow

The user connects devices from `Connected Devices`.

Flow:

1. User chooses a device/provider.
2. Platform-controlled permission or OAuth screen opens.
3. User grants specific data types.
4. Brioela records connection metadata.
5. Client produces first daily summary when data is available.
6. Summary syncs to Brain DO.

Permission rules:

- Never request all health permissions by default.
- Explain why each category matters for food intelligence.
- Let the user connect sleep/recovery without glucose.
- Let the user connect glucose without sleep/recovery.
- No background microphone, camera, or location permission is part of wearables.

---

## Connection Record

```typescript
type WearableConnection = {
  connectionId: string
  userId: string
  provider: WearableConnector["provider"]
  connectionKind: WearableConnector["connectionKind"]
  grantedDataTypes: WearableDataType[]
  status: "connected" | "disconnected" | "needs_reauth" | "error"
  connectedAt: number
  lastSyncAt: number | null
  errorCode: string | null
}
```

Store OAuth tokens or platform credentials only where appropriate for that provider. Native HealthKit/Health Connect permissions are handled by the OS and should not be represented as server tokens.

---

## Provider Boundaries

Apple HealthKit:

- Native iOS-only permission flow.
- User grants data-type-specific access.
- Client reads allowed samples and aggregates locally.
- Server never directly calls HealthKit.

Oura:

- OAuth-based API integration.
- Official docs indicate Oura API V2 is current; V1 was removed.
- Pull sleep/readiness/body temperature summaries where user permission allows.

Health Connect:

- Android aggregation layer.
- Treat similarly to HealthKit: client reads permitted records and aggregates locally.
- Avoid writing implementation docs that assume one device brand; Health Connect can represent many sources.

CGM providers:

- Use user-authorized APIs where available.
- Do not compete with the official CGM app.
- Do not present Brioela as a medical monitoring device.
- If API access is unavailable or restricted, keep the integration disabled or manual until compliant access exists.

---

## Reauthorization

When provider auth expires or permissions change:

- Mark connection `needs_reauth`.
- Stop syncing that provider.
- Keep already-ingested derived memory unless user disconnects/deletes it.
- Surface reauth only in settings or a relevant low-friction in-app moment.

Do not repeatedly nag the user to reconnect.
