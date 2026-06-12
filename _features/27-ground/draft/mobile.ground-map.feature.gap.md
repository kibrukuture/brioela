# Gap snapshot: ground-map.feature.tsx

Target: `mobile/features/ground/components/ground-map.feature.tsx`

**Status:** Not in repo. From `build-guide/09-ground/04-map-rendering.md`, `build-guide/10-map/06-map-ui-layers.md`.

```typescript
import { useCallback, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import Mapbox from '@rnmapbox/maps'
import { useGroundMap } from '../hooks/use.ground.map.hook'
import { GroundSignalLayer } from './ground-signal-layer'
import { FindListSheet } from './find-list.sheet'
import { FindSubmissionSheet } from './find-submission.sheet'

type GroundMapFeatureProps = {
  initialCenter?: { lat: number; lng: number }
  showHealthyLayer?: boolean
}

export function GroundMapFeature({
  initialCenter,
  showHealthyLayer = true,
}: GroundMapFeatureProps) {
  const [groundLayerVisible, setGroundLayerVisible] = useState(true)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [submitLocationId, setSubmitLocationId] = useState<string | null>(null)

  const { summaries, isLoading, refetch, bbox, setBbox } = useGroundMap({
    enabled: groundLayerVisible,
  })

  const onRegionChange = useCallback((region: Mapbox.RegionPayload) => {
    const bounds = region.properties.visibleBounds
    if (!bounds) return
    setBbox({
      minLat: bounds[0][1],
      minLng: bounds[0][0],
      maxLat: bounds[1][1],
      maxLng: bounds[1][0],
    })
  }, [setBbox])

  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map} onRegionDidChange={onRegionChange}>
        <Mapbox.Camera
          defaultSettings={{
            centerCoordinate: initialCenter
              ? [initialCenter.lng, initialCenter.lat]
              : undefined,
            zoomLevel: 14,
          }}
        />
        {showHealthyLayer && (
          /* Healthy map layer owned by **28** — placeholder until map feature ships */
          null
        )}
        {groundLayerVisible && (
          <GroundSignalLayer
            summaries={summaries}
            onDotPress={(locationId) => setSelectedLocationId(locationId)}
            onBuildingLongPress={(locationId) => setSubmitLocationId(locationId)}
          />
        )}
      </Mapbox.MapView>

      <LayerToggle
        groundVisible={groundLayerVisible}
        onToggleGround={() => setGroundLayerVisible((v) => !v)}
      />

      {selectedLocationId && (
        <FindListSheet
          locationId={selectedLocationId}
          onClose={() => setSelectedLocationId(null)}
          onAddFind={() => {
            setSubmitLocationId(selectedLocationId)
            setSelectedLocationId(null)
          }}
        />
      )}

      {submitLocationId && (
        <FindSubmissionSheet
          locationId={submitLocationId}
          onClose={() => setSubmitLocationId(null)}
          onSubmitted={() => {
            setSubmitLocationId(null)
            refetch()
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
})
```

**UX rule:** map must feel alive — pulses, not Google Maps pins (`04-map-rendering.md`).
