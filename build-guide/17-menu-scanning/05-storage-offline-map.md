# Menu Scanning — Storage, Offline, And Map Integration

## What This File Covers

The data retention boundary, offline partial mode, map/community overlay, and Core tier upgrade surface for menu scanning.

---

## Storage Rule

Menu content is transient by default.

The backend may hold raw OCR text and parsed dish results only for the active request/session. Raw OCR text is discarded after processing unless the user explicitly saves the menu to their profile.

This protects restaurants' menu content and avoids building a hidden menu database from private scans.

---

## Data Model

Use the spec's two-record model only for saved or active-session scans:

```typescript
type MenuScan = {
  scanId: string
  userId: string
  restaurantId: string | null
  photoCount: number
  ocrText: string | null
  createdAt: number
  savedAt: number | null
}

type MenuScanResult = {
  scanId: string
  dishName: string
  verdict: "safe" | "caution" | "avoid"
  reason: string
  waiterQuestion: string | null
  createdAt: number
}
```

Implementation notes:

- `ocrText` is `null` for unsaved scans after processing completes.
- Saved scans require explicit user action.
- Unsaved scan results can remain in client/session memory for navigation within the active screen.
- If persisted server-side for an active session, expire aggressively.

---

## Memory Events

Menu scanning can log a lightweight event to the Orchestrator, but it must not write raw menu content into memory by default.

Allowed event payload:

```typescript
type MenuScanMemoryEvent = {
  kind: "menu_scanned"
  restaurantId: string | null
  placeName: string | null
  dishCount: number
  redCount: number
  yellowCount: number
  greenCount: number
  saved: boolean
}
```

Do not store OCR text, full dish descriptions, or waiter questions in `memory_event` unless the user saves the menu and the save flow makes that clear.

---

## Offline Partial Mode

Restaurants often have weak connectivity. Offline partial mode uses the last-known cached constraint profile on-device.

Offline behavior:

- Use cached constraints only.
- Run local deterministic matching when OCR/text is available locally.
- Show a visible "offline partial result" banner.
- Do not show real-time community notes.
- Do not imply the profile is current.
- Queue a lightweight `menu_scanned` event for later sync if event logging is enabled.

If server OCR is unavailable offline, the first implementation can support offline only for already extracted URL/text or future on-device OCR. The UI must be honest about this boundary.

---

## Map And Community Overlay

If `restaurantId` maps to a place in `10-map`, the menu scan can overlay place-level community context.

Examples:

- "3 people with gluten sensitivity reported this restaurant handles gluten well."
- "Recent notes mention shared fryer uncertainty."
- "No community notes yet for this place."

Boundary:

- `10-map` owns place identity and healthy place data.
- `09-ground` owns community observations.
- Menu scanning reads summarized place context only.
- Community notes can add confidence or caution, but they cannot override visible allergen evidence.

A red dish stays red even if community sentiment about the restaurant is positive.

---

## Core Tier Upgrade Trigger

Menu scanning is a Core tier feature trigger. Entitlement rules and payment mechanics live in `25-pricing-tiers`; this feature only defines where the prompt appears.

Upgrade prompt behavior:

- If the user is not entitled, allow the scan entry point to explain the value before blocking.
- The prompt should mention personal allergy/diet filtering, not generic AI scanning.
- Do not capture/upload menu photos before entitlement is confirmed unless the pricing feature explicitly allows a trial scan.

The scan pipeline should receive an already-authorized request.

---

## Success Metrics

Track aggregate product metrics without retaining raw menu content:

- Menu scan usage among users with confirmed allergies.
- Yellow-question tap or copy rate.
- Repeat menu scanning per month.
- First menu-scan upgrade conversion.

Metric events must not include raw OCR text or full menu descriptions.
