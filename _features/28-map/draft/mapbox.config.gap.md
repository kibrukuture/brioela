# Gap snapshot: mapbox.config.ts

Target: `mobile/features/map/config/mapbox.config.ts`, `mapbox.init.ts`

**Status:** Not in repo. From `build-guide/10-map/01-mapbox-setup.md`.

```typescript
import Mapbox from '@rnmapbox/maps'

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN

if (!MAPBOX_ACCESS_TOKEN) {
  throw new Error('EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN is required for map feature')
}

export const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/standard'

export function initMapbox(): void {
  Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN)
  Mapbox.setTelemetryEnabled(false)
}

export const MAP_DEFAULT_CAMERA = {
  zoomLevel: 14,
  pitch: 45,
  animationDuration: 800,
} as const
```

```typescript
// mobile/features/map/config/mapbox.init.ts
import { initMapbox } from './mapbox.config'

let initialized = false

export function ensureMapboxInitialized(): void {
  if (initialized) return
  initMapbox()
  initialized = true
}
```

**Platform split:** native via `@rnmapbox/maps`; web/PWA via Mapbox GL JS (`01-mapbox-setup.md`). Attribution must remain visible.

**Note:** Location autocomplete uses LocationIQ (`backend/src/core/clients/maps/client.ts`) — separate from Mapbox rendering.
