# Gap snapshot: place-detail.sheet.tsx

Target: `mobile/features/map/components/place-detail.sheet.tsx`

**Status:** Not in repo. From `build-guide/10-map/06-map-ui-layers.md`.

```typescript
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native'
import { usePlaceDetail } from '../hooks/use.place.detail.hook'
import { FindListSheet } from '@/features/ground/components/find-list.sheet'

type PlaceDetailSheetProps = {
  placeId: string
  onClose: () => void
}

export function PlaceDetailSheet({ placeId, onClose }: PlaceDetailSheetProps) {
  const { detail, isLoading, error } = usePlaceDetail(placeId)
  const [showFinds, setShowFinds] = useState(false)

  if (isLoading || !detail) {
    return (
      <View style={styles.sheet}>
        <Text>Loading place…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.sheet}>
        <Text>Could not load place.</Text>
        <Pressable onPress={onClose}><Text>Close</Text></Pressable>
      </View>
    )
  }

  const openNativeMaps = () => {
    const url = `https://maps.apple.com/?ll=${detail.place.lat},${detail.place.lng}&q=${encodeURIComponent(detail.place.name)}`
    void Linking.openURL(url)
  }

  return (
    <View style={styles.sheet}>
      <Text style={styles.title}>{detail.place.name}</Text>
      <Text style={styles.subtitle}>{detail.explanation ?? detail.place.kind}</Text>

      {detail.place.verificationStatus === 'verified' && (
        <Text style={styles.badge}>Verified — ingredient transparency</Text>
      )}

      <Text style={styles.section}>Health summary</Text>
      <Text>
        Healthy {Math.round(detail.signal.healthyScore * 100)}% · Community{' '}
        {Math.round(detail.signal.communityScore * 100)}%
      </Text>

      {detail.menuFitPreview && (
        <>
          <Text style={styles.section}>Menu fit for you</Text>
          <Text>
            {detail.menuFitPreview.greenCount} green · {detail.menuFitPreview.yellowCount} yellow ·{' '}
            {detail.menuFitPreview.redCount} red
          </Text>
        </>
      )}

      {detail.groundSummaryLines.length > 0 && (
        <>
          <Text style={styles.section}>Ground signals</Text>
          {detail.groundSummaryLines.map((line) => (
            <Text key={line}>{line}</Text>
          ))}
          <Pressable onPress={() => setShowFinds(true)}>
            <Text style={styles.link}>View all Finds</Text>
          </Pressable>
        </>
      )}

      {detail.sightings.length > 0 && (
        <>
          <Text style={styles.section}>Recent product sightings</Text>
          <Text>{detail.sightings.length} products seen recently</Text>
        </>
      )}

      <View style={styles.actions}>
        <Pressable onPress={openNativeMaps}>
          <Text style={styles.action}>Open in Maps</Text>
        </Pressable>
        <Pressable onPress={onClose}>
          <Text style={styles.action}>Close</Text>
        </Pressable>
      </View>

      {showFinds && (
        <FindListSheet
          locationId={placeId}
          onClose={() => setShowFinds(false)}
          onAddFind={() => setShowFinds(false)}
        />
      )}
    </View>
  )
}

// useState import omitted in snippet — add at file top in production

const styles = StyleSheet.create({
  sheet: { padding: 16 },
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { opacity: 0.7, marginBottom: 12 },
  badge: { color: '#34C759', marginBottom: 8 },
  section: { marginTop: 16, fontWeight: '600' },
  link: { color: '#007AFF', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 24 },
  action: { color: '#007AFF' },
})
```

**Actions:** scan here (deep link **24**), native maps route, save place — wire in production.
