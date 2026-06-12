# Gap snapshot: healthy-map.feature.tsx

Target: `mobile/features/map/components/healthy-map.feature.tsx`

**Status:** Not in repo. From `build-guide/10-map/06-map-ui-layers.md`, `01-mapbox-setup.md`.

```typescript
import { useCallback, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import Mapbox from '@rnmapbox/maps'
import { ensureMapboxInitialized } from '../config/mapbox.init'
import { useHealthyMap } from '../hooks/use.healthy.map.hook'
import { useMapLayers } from '../hooks/use.map.layers.hook'
import { HealthySignalLayer } from './healthy-signal-layer'
import { LayerToggles } from './layer-toggles'
import { PlaceDetailSheet } from './place-detail.sheet'
import { TravelContextBanner } from './travel-context.banner'
import { GroundSignalLayer } from '@/features/ground/components/ground-signal-layer'
import { useGroundMap } from '@/features/ground/hooks/use.ground.map.hook'

ensureMapboxInitialized()

type HealthyMapFeatureProps = {
  initialCenter?: { lat: number; lng: number }
  initialBbox?: { minLat: number; minLng: number; maxLat: number; maxLng: number }
}

export function HealthyMapFeature({
  initialCenter,
  initialBbox,
}: HealthyMapFeatureProps) {
  const { layers, setLayerVisible } = useMapLayers()
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)

  const { places, isLoading, bbox, setBbox, refetch } = useHealthyMap({
    enabled: layers.healthy,
    initialBbox,
  })

  const {
    summaries: groundSummaries,
    setBbox: setGroundBbox,
  } = useGroundMap({ enabled: layers.ground })

  const onRegionChange = useCallback((region: Mapbox.RegionPayload) => {
    const bounds = region.properties.visibleBounds
    if (!bounds) return
    const next = {
      minLat: bounds[0][1],
      minLng: bounds[0][0],
      maxLat: bounds[1][1],
      maxLng: bounds[1][0],
    }
    setBbox(next)
    setGroundBbox(next)
  }, [setBbox, setGroundBbox])

  return (
    <View style={styles.container}>
      <TravelContextBanner />

      <Mapbox.MapView style={styles.map} onRegionDidChange={onRegionChange}>
        <Mapbox.Camera
          defaultSettings={{
            centerCoordinate: initialCenter
              ? [initialCenter.lng, initialCenter.lat]
              : undefined,
            zoomLevel: 14,
            pitch: 45,
          }}
        />

        {layers.healthy && (
          <HealthySignalLayer
            places={places}
            onDotPress={(placeId) => setSelectedPlaceId(placeId)}
          />
        )}

        {layers.ground && (
          <GroundSignalLayer
            summaries={groundSummaries}
            onDotPress={() => {}}
            onBuildingLongPress={() => {}}
          />
        )}
      </Mapbox.MapView>

      <LayerToggles
        layers={layers}
        onToggle={(key, visible) => setLayerVisible(key, visible)}
      />

      {selectedPlaceId && (
        <PlaceDetailSheet
          placeId={selectedPlaceId}
          onClose={() => setSelectedPlaceId(null)}
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

**Ownership:** **28** owns MapView shell + healthy layer; **27** `GroundSignalLayer` mounts when Ground toggle on.
