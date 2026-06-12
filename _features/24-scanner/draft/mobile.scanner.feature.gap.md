# Gap snapshot: scanner.feature.tsx

Target: `mobile/features/scanner/components/scanner.feature.tsx`

**Status:** Not in repo. Replace legacy Schnl QR at `mobile/app/profile/scan.tsx`. From `build-guide/07-scanner/01-barcode-decode.md` + `05-gpt4o-mini-vision-fallback.md`.

---

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera'
import type { BarcodeScanningResult } from 'expo-camera'
import { useCallback, useRef } from 'react'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import { useCreateScan } from '@/network/scan/use-create-scan'
import { useVisionExtractScan } from '@/network/scan/use-vision-extract-scan'
import { ScanResultCompact } from './scan-result-compact'
import { HardAllergyInterrupt } from './hard-allergy-interrupt'

const BARCODE_TIMEOUT_MS = 3000

export function ScannerFeature() {
  const [permission, requestPermission] = useCameraPermissions()
  const lastScannedRef = useRef<string | null>(null)
  const cooldownRef = useRef(false)
  const barcodeDetected = useRef(false)

  const { mutateAsync: createScan, data: scanResult, isPending } = useCreateScan()
  const { mutateAsync: visionExtract } = useVisionExtractScan()

  const onBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      const upc = result.data
      barcodeDetected.current = true
      if (cooldownRef.current || lastScannedRef.current === upc) return

      cooldownRef.current = true
      lastScannedRef.current = upc
      setTimeout(() => {
        cooldownRef.current = false
      }, BARCODE_TIMEOUT_MS)

      await createScan({
        upc,
        rawScanType: result.type,
        geoHash: null,
        capturedAt: Date.now(),
      })
    },
    [createScan],
  )

  useIsomorphicLayoutEffect(() => {
    const timeout = setTimeout(() => {
      if (!barcodeDetected.current) {
        // captureFrameForVisionExtraction() → visionExtract({ imageBase64, ... })
      }
    }, BARCODE_TIMEOUT_MS)
    return () => clearTimeout(timeout)
  }, [permission?.granted])

  if (!permission?.granted) {
    return <CameraPermissionPrompt onRequest={requestPermission} />
  }

  const verdict = scanResult?.verdict
  const hardBlock = verdict?.constraint?.level === 'block'

  return (
    <>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
        }}
        onBarcodeScanned={onBarcodeScanned}
      />
      {hardBlock && verdict && <HardAllergyInterrupt verdict={verdict} />}
      {verdict && !hardBlock && <ScanResultCompact verdict={verdict} product={scanResult.product} />}
    </>
  )
}
```

**Rules:** `useIsomorphicLayoutEffect` only — project hook policy. Offline queue via React Query persistence.
