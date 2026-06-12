# Draft: connected.devices.screen.tsx (gap — file does not exist)

Target: `mobile/features/wearables/screens/connected.devices.screen.tsx`

**Source:** `build-guide/20-wearables/01-connection-model.md`, `06-privacy-disconnect.md`

---

```tsx
import { useCallback } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { useWearableConnections } from '../hooks/use-wearable-connections'
import { ProviderCard } from '../components/provider.card'
import { DisconnectConfirmSheet } from '../components/disconnect.confirm.sheet'
import { syncWearableSummaries } from '../helpers/sync.wearable.summaries.helper'
import { createAppleHealthConnector } from '../connectors/apple.health.connector'
import { createOuraConnector } from '../connectors/oura.connector'

export function ConnectedDevicesScreen() {
  const { connections, connect, disconnect, pendingDisconnect, setPendingDisconnect } =
    useWearableConnections()

  const onConnectAppleHealth = useCallback(async () => {
    const connector = createAppleHealthConnector(crypto.randomUUID())
    await connect(connector, ['sleep', 'hrv', 'resting_heart_rate', 'activity'])
    await syncWearableSummaries()
  }, [connect])

  const onConnectOura = useCallback(async () => {
    const connector = createOuraConnector(
      crypto.randomUUID(),
      () => null,
      () => undefined,
    )
    await connect(connector, ['sleep', 'hrv', 'resting_heart_rate', 'body_temperature_deviation'])
    await syncWearableSummaries()
  }, [connect])

  return (
    <ScrollView>
      <Text>Connected Devices</Text>
      <Text>Connect wearables to personalize food guidance with your sleep, recovery, and glucose data.</Text>

      <ProviderCard
        title="Apple Health"
        subtitle="Sleep, HRV, activity from Apple Watch and connected devices"
        connected={connections.some((c) => c.provider === 'apple_health' && c.status === 'connected')}
        onConnect={onConnectAppleHealth}
        onDisconnect={() => setPendingDisconnect(connections.find((c) => c.provider === 'apple_health')?.connectionId ?? null)}
      />

      <ProviderCard
        title="Oura Ring"
        subtitle="Sleep, readiness, and temperature trends"
        connected={connections.some((c) => c.provider === 'oura' && c.status === 'connected')}
        onConnect={onConnectOura}
        onDisconnect={() => setPendingDisconnect(connections.find((c) => c.provider === 'oura')?.connectionId ?? null)}
      />

      <Pressable onPress={() => syncWearableSummaries()}>
        <Text>Sync now</Text>
      </Pressable>

      {pendingDisconnect ? (
        <DisconnectConfirmSheet
          providerName="device"
          onDisconnectOnly={() => disconnect(pendingDisconnect, false)}
          onDisconnectAndDelete={() => disconnect(pendingDisconnect, true)}
          onCancel={() => setPendingDisconnect(null)}
        />
      ) : null}
    </ScrollView>
  )
}
```

Copy for disconnect sheet per `06-privacy-disconnect.md`: *"Disconnect Oura? I can also remove health data already stored from this device."*
