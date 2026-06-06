# Ambient Intelligence — Pre-Trip Food Intelligence

## What This File Covers

Travel intent detection, destination preload jobs, user-scoped destination caches, local scan/map context, and arrival activation.

---

## User Outcome

The user mentions or implies travel, and Brioela prepares quietly before they arrive.

When they land, Brioela already knows:

- useful nearby food places
- local products and brands
- local labeling norms
- community signals from the destination
- menu/restaurant fit when shared menu intelligence exists
- OCR language adjustments for food labels and menus

No setup. No dashboard. No generic travel guide.

---

## Travel Intent Sources

Travel intent can come from:

- explicit voice mention: "I'm going to Tokyo next week"
- optional calendar integration with user permission
- repeated map search for a distant city
- future explicit save: "I'm going here later"

Detection output:

```typescript
type TravelIntentCandidate = {
  userId: string
  destinationCity: string
  destinationCountry: string | null
  departureDate: number | null
  returnDate: number | null
  source: "voice" | "calendar" | "map_search" | "manual"
  confidence: number
  status: "pending" | "confirmed" | "active" | "expired" | "dismissed"
}
```

High-confidence sources, such as explicit voice or calendar events, can confirm automatically. Low-confidence map search should ask once: "Are you heading to [city]?"

---

## Scheduling Preload

Once travel intent is confirmed, schedule `travel_preload` in the Orchestrator alarm queue.

Timing:

- If departure is more than 48 hours away: schedule 48 hours before departure.
- If departure is within 48 hours: schedule as soon as idle.
- If no departure date exists: create a candidate but do not preload until confirmed or repeated.

The Orchestrator can use Upstash QStash for worker-to-worker destination preload jobs because destination data may come from shared map/product/community sources outside the user's DO. User-scoped state remains in the Orchestrator and travel cache.

---

## What Gets Preloaded

Preload packages are user-specific and destination-specific.

```typescript
type TravelPreloadPackage = {
  intentId: string
  geoRegion: string
  mapPlaces: unknown[]
  communitySignals: unknown[]
  localProductHints: unknown[]
  localLabelingNotes: unknown[]
  menuFitSummaries: unknown[]
  ocrLanguageHints: string[]
  createdAt: number
  expiresAt: number
}
```

Contents:

- high-trust community notes for the destination region
- common local products and brands
- government food database priority for that country
- nearby healthy food places and markets
- local certification bodies if relevant to the user's dietary identity
- OCR language hints for labels and menus
- shared menu intelligence for restaurants near likely destination areas, if available

Menu intelligence is public/shared, but final dish verdicts are not precomputed globally. They are recomputed against the user's private profile.

---

## User-Scoped Cache

`travel_local_cache` is user-scoped and time-bounded.

```typescript
type TravelLocalCache = {
  userId: string
  geoRegion: string
  cacheType: "map" | "products" | "community" | "labeling" | "menus"
  payloadJson: string
  expiresAt: number
}
```

Rules:

- Cache expires 30 days after estimated return or intent expiry.
- Do not use travel intent for ads or shared targeting.
- Do not make destination a permanent user profile fact unless the user says it is recurring.
- Keep destination context separate from home context.

---

## Arrival Activation

On app open, if device location is in the destination region:

1. Mark travel intent `active`.
2. Switch scan resolution priority to local data sources.
3. Apply local food labeling notes to scan and OCR interpretation.
4. Load destination map cache.
5. Surface one quiet in-app/push moment if allowed by notification rules.

Example copy:

```text
You're in Tokyo. I've loaded local food intel: labels, nearby healthy spots, and things to watch for.
```

This is one piece of information and one implicit action: open the prepared map/scan context.

---

## Return Home

When the user leaves the destination or the intent expires:

- deactivate travel context
- revert scan database priority
- stop showing destination map by default
- expire travel cache on schedule
- keep only minimal memory if the user explicitly discussed the trip as meaningful

Travel context is a temporary layer, not a permanent override.

---

## Failure Behavior

If preload fails:

- mark `travel_preload_job` failed
- retry only if departure has not passed
- do not notify the user about backend failure
- fall back to normal map and scan behavior at destination

The user should never see "preload failed." They should only experience a less-prepared app.
