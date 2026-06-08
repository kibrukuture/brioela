# Scanner — Barcode Decode (On-Device)

## What This File Covers

On-device barcode detection, UPC extraction, what happens offline, what the mobile client sends to the backend, and the Supabase `scan_event` write.

---

## Rule: Barcode Decode Is Always On-Device

The UPC is extracted from the camera frame entirely on the device, using the native Vision framework (iOS) or ML Kit (Android). No network request is needed to decode a barcode. The device can identify the product by UPC with no connectivity.

This is why scan-to-verdict can target under 3 seconds — the slowest step (network) does not start until the device already has the product ID.

---

## Mobile — Camera and Barcode Detection

Expo Camera + Expo's barcode scanning API handles the capture. The scanner screen runs continuously while the camera is open — no tap required. When a barcode is detected with sufficient confidence, it is locked and the network request fires.

```typescript
// mobile/features/scanner/components/scanner.feature.tsx

import { CameraView, useCameraPermissions } from 'expo-camera'
import type { BarcodeScanningResult } from 'expo-camera'
import { useCallback, useRef } from 'react'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import { useCreateScan } from '@/network/scan'
import { useAuthStore } from '@/stores/account/use-auth-store'

export function ScannerFeature() {
  const [permission, requestPermission] = useCameraPermissions()
  const lastScannedRef = useRef<string | null>(null)
  const cooldownRef    = useRef<boolean>(false)

  const { mutateAsync: createScan } = useCreateScan()
  const geoHash = useLocationGeoHash()

  const onBarcodeScanned = useCallback(async (result: BarcodeScanningResult) => {
    const upc = result.data

    // De-duplicate: ignore if same barcode was just scanned
    if (cooldownRef.current || lastScannedRef.current === upc) return

    // Lock for 3 seconds to prevent re-scan while result loads
    cooldownRef.current = true
    lastScannedRef.current = upc
    setTimeout(() => { cooldownRef.current = false }, 3000)

    await createScan({
      upc,
      rawScanType: result.type,
      geoHash:     geoHash ?? null,
      capturedAt:  Date.now(),
    })
  }, [createScan, geoHash])

  if (!permission?.granted) {
    return <CameraPermissionPrompt onRequest={requestPermission} />
  }

  return (
    <CameraView
      style={{ flex: 1 }}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
      onBarcodeScanned={onBarcodeScanned}
    />
  )
}
```

**Supported barcode types:** EAN-13 (most EU/global products), EAN-8, UPC-A (US), UPC-E (US short form), QR (for products that use QR instead of barcode). The device decodes all of these natively — no library dependency.

---

## What the Mobile Client Sends

```typescript
// shared/validator/scan.schema.ts

import { z } from 'zod'

export const CreateScanInputSchema = z.object({
  upc:         z.string().min(4).max(20),
  rawScanType: z.string(),                    // barcode type as reported by device
  geoHash:     z.string().length(6).nullable(), // 6-char geohash or null
  capturedAt:  z.number().int().positive(),   // unix ms — device time
})

export type CreateScanInput = z.infer<typeof CreateScanInputSchema>
```

---

## Offline Behavior

When the device has no connectivity:
- Barcode is still decoded on-device — always works
- Network request queues locally (React Query offline mutation queue)
- Device shows "Scanning..." with a local pending state
- When connectivity returns, the queued request fires automatically
- If a prior scan result for this UPC is in the TanStack Query cache, the cached result is shown immediately while the fresh request runs in background

Prior scan results are cached with `gcTime: 24h` — so a product scanned yesterday is instantly available today without a network request.

---

## Backend — `POST /api/scans/resolve`

The first backend endpoint the mobile client hits. Its job: Zod-parse the input, write the `scan_event` row to Supabase, kick off product resolution, and return the verdict.

```typescript
// shared/routes/scan.routes.ts

export const SCAN_ROUTE_PATTERNS = {
  resolve: '/resolve',
  score:   '/:productId/score',
  getById: '/:scanId',
  history: '/history',
} as const

export const SCAN_ROUTES = {
  base:    '/api/scans',
  resolve: '/api/scans/resolve',
  score:   (productId: string) => `/api/scans/${productId}/score`,
  getById: (scanId: string)    => `/api/scans/${scanId}`,
  history: '/api/scans/history',
} as const
```

```typescript
// backend/src/api/scan/_handlers/resolve.scan.handler.ts

import { CreateScanInputSchema } from '@brioela/shared/validator/scan'
import { supabase } from '@/core/db/supabase.client'
import { resolveProduct }    from '../_helpers/resolve.product.helper'
import { checkConstraints }  from '../_helpers/check.constraints.helper'
import { buildVerdict }      from '../_helpers/build.verdict.helper'
import { buildResolvedProductFactSnapshot } from '../_helpers/product-fact-snapshot.helper'
import { getProductCommunityHealthSummary } from '../_helpers/community-health-summary.helper'
import type { AppContext } from '@/index'

export async function resolveScan(c: AppContext) {
  const userId = c.get('userId')
  const body   = await c.req.json()

  // Validate at the boundary
  const input = CreateScanInputSchema.parse(body)

  // Write scan_event to Supabase immediately — before product resolution
  // This ensures the event is recorded even if resolution fails
  const scanEventId = crypto.randomUUID()
  await supabase.from('scan_events').insert({
    id:            scanEventId,
    user_id:       userId,
    upc:           input.upc,
    raw_scan_type: input.rawScanType,
    geo_hash:      input.geoHash,
    captured_at:   new Date(input.capturedAt).toISOString(),
    ingested_at:   new Date().toISOString(),
    status:        'pending',
  })

  // Resolve product (see 02-product-resolution.md)
  const product = await resolveProduct(input.upc, userId, c.env)

  if (!product) {
    // No product found — mark scan_event as unresolved, return pending state
    await supabase.from('scan_events')
      .update({ status: 'unresolved' })
      .eq('id', scanEventId)

    return {
      scanEventId,
      verdict: null,
      status:  'unresolved',
      message: 'Product not found in our database yet.',
    }
  }

  // Build scanner-ready product facts with evidence/confidence before any safety decision.
  const productFactSnapshot = await buildResolvedProductFactSnapshot(product, c.env)

  // Cached/materialized community overlay. This is never a live full-table association query.
  const communityHealth = await getProductCommunityHealthSummary(product.id, c.env)

  // Check constraints against Brain DO (see 03-constraint-check.md)
  const constraintResult = await checkConstraints(productFactSnapshot, userId, c.env)

  // Build final verdict (see 04-scan-result-ui.md)
  const verdict = buildVerdict(productFactSnapshot, constraintResult, communityHealth)

  // Update scan_event with resolved product
  await supabase.from('scan_events')
    .update({
      product_id:    product.id,
      verdict:       verdict.level,
      status:        'resolved',
    })
    .eq('id', scanEventId)

  // Also write to Brain DO memory (scan history for illness detective + recall alerts)
  const brainId = c.env.BRAIN.idFromName(userId)
  const brain   = c.env.BRAIN.get(brainId)
  await brain.fetch(new Request('https://internal/log-scan', {
    method: 'POST',
    body: JSON.stringify({
      scanEventId,
      productId:  product.id,
      productName: product.name,
      verdict:    verdict.level,
      geoHash:    input.geoHash,
      capturedAt: input.capturedAt,
    }),
  }))

  return { scanEventId, product, productFactSnapshot, verdict, constraintResult, communityHealth }
}
```

---

## Supabase Schema — `scan_events` Table

Lives in `shared/drizzle/schema/` — Supabase Postgres, not DO SQLite. This is shared data: recall matching needs to cross-reference all users' scan histories.

```typescript
// shared/drizzle/schema/scan.schema.ts

import { pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { brioela } from './brioela'

export const scanEvents = brioela.table('scan_events', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull(),
  upc:         text('upc').notNull(),
  productId:   text('product_id'),           -- NULL until product is resolved
  rawScanType: text('raw_scan_type').notNull(),
  verdict:     text('verdict'),              -- 'green' | 'yellow' | 'red' | NULL until resolved
  geoHash:     text('geo_hash'),
  status:      text('status').notNull().default('pending'),  -- 'pending' | 'resolved' | 'unresolved'
  capturedAt:  timestamp('captured_at', { withTimezone: true }).notNull(),
  ingestedAt:  timestamp('ingested_at', { withTimezone: true }).notNull().defaultNow(),
})
```

**Why Supabase, not DO SQLite only:**
Recall alerts (spec 26) must match a single product recall against all users who scanned that product. That cross-user query is impossible if scan history is siloed in per-user DO SQLite. Supabase is the shared cross-user store — scan_events lands there so recall matching can run globally.

The Brain DO also logs scan events to its own `memory_event` table — that copy is for per-user illness detective and behavioral pattern detection, which only need the individual user's history.
