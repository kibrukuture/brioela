# Draft: in.store.copilot.feature.tsx (gap — file does not exist)

Target: `mobile/features/in-store-copilot/in.store.copilot.feature.tsx`

**Gap:** No mobile co-pilot shell (G30).

**Source:** `brioela-specs/45-in-store-copilot.md`, `build-guide/32-in-store-copilot/05-offline-degradation.md`

---

```tsx
import { useCallback, useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import { useShopMiraSession } from './hooks/use.shop.mira.session.hook'
import { useAmbientStorePrompt } from './hooks/use.ambient.store.prompt.hook'
import { DegradedModeBanner } from './components/degraded.mode.banner'
import { ShopSessionControls } from './components/shop.session.controls'
import { startShopSession } from '@/network/shop/start.shop.session.api'
import { endShopSession } from '@/network/shop/end.shop.session.api'

type InStoreCopilotFeatureProps = {
  placeId: string
  onCheckoutHandoff: (visitId: string) => void
}

export function InStoreCopilotFeature({
  placeId,
  onCheckoutHandoff,
}: InStoreCopilotFeatureProps) {
  const [visitId, setVisitId] = useState<string | null>(null)
  const [degraded, setDegraded] = useState(false)

  const ambient = useAmbientStorePrompt(placeId)
  const session = useShopMiraSession({ visitId, onDegraded: () => setDegraded(true) })

  const startSession = useCallback(async () => {
    const started = await startShopSession({ placeId })
    setVisitId(started.visitId)
    await session.connect(started)
  }, [placeId, session])

  const endSession = useCallback(
    async (reason: 'user_done' | 'checkout' | 'geofence_exit') => {
      if (!visitId) return
      await endShopSession({ visitId, reason })
      await session.disconnect()
      setVisitId(null)
      if (reason === 'checkout') onCheckoutHandoff(visitId)
    },
    [visitId, session, onCheckoutHandoff],
  )

  useIsomorphicLayoutEffect(() => {
    if (!visitId) return
    return ambient.watchGeofenceExit(() => {
      void endSession('geofence_exit')
    })
  }, [visitId, ambient, endSession])

  if (!visitId) {
    return (
      <View>
        {ambient.shouldShowPrompt ? (
          <Pressable onPress={startSession}>
            <Text>Start shopping with Mira</Text>
          </Pressable>
        ) : (
          <Pressable onPress={startSession}>
            <Text>Co-pilot</Text>
          </Pressable>
        )}
      </View>
    )
  }

  return (
    <View>
      {degraded ? (
        <DegradedModeBanner message="I lost connection — your scans are saved, I'll catch up." />
      ) : null}
      <ShopSessionControls
        onDone={() => void endSession('user_done')}
        onCheckout={() => void endSession('checkout')}
        runningTotal={session.runningSpendEstimate}
      />
    </View>
  )
}
```
