# Gap snapshot: rank.places.helper.ts

Target: `backend/src/api/map/_helpers/rank.places.helper.ts`

**Status:** Not in repo. From `build-guide/10-map/03-nearby-ranking-api.md`, `17-menu-scanning/07-personalized-restaurant-discovery.md`.

```typescript
import { scorePlaceRelevance } from './score.place.relevance.helper'
import { scoreMenuFit } from './score.menu.fit.helper'
import { readGroundDensityByPlace } from './read.ground.density.helper'

const BASE_DOT_SIZE = 10
const FIT_SIZE_MULTIPLIER = 0.8

type PlaceCandidate = {
  placeId: string
  kind: string
  name: string
  lat: number
  lng: number
  geohash: string
  verificationStatus: string
  addressJson: Record<string, unknown> | null
  signal: {
    healthyScore: number
    communityScore: number
    affordabilityScore: number
    recencyScore: number
    updatedAt: string
  }
}

type ConstraintProfile = {
  hardAllergens: string[]
  dietaryIdentity: string | null
  boycotts: string[]
}

type RankPlacesInput = {
  candidates: PlaceCandidate[]
  userId: string
  constraintProfile: ConstraintProfile
  userLocation: { lat: number; lng: number } | null
  showAll: boolean
  env: Env
}

export async function rankPlaces(input: RankPlacesInput) {
  const groundDensity = await readGroundDensityByPlace(
    input.candidates.map((c) => c.placeId),
    input.env,
  )

  const scored = await Promise.all(
    input.candidates.map(async (candidate) => {
      const hardExcluded = evaluateHardExclusion(candidate, input.constraintProfile)
      const relevance = await scorePlaceRelevance({
        userId: input.userId,
        placeId: candidate.placeId,
        env: input.env,
      })

      const menuFit = await scoreMenuFit({
        placeId: candidate.placeId,
        userId: input.userId,
        env: input.env,
      })

      const groundDensityScore = groundDensity.get(candidate.placeId) ?? 0
      const distanceMeters = input.userLocation
        ? haversineMeters(input.userLocation, { lat: candidate.lat, lng: candidate.lng })
        : null

      const distanceScore =
        distanceMeters === null ? 0.5 : Math.max(0, 1 - distanceMeters / 5000)

      const fitScore =
        candidate.signal.healthyScore * 0.25 +
        (menuFit?.fitScore ?? 0.5) * 0.25 +
        groundDensityScore * 0.1 +
        distanceScore * 0.2 +
        candidate.signal.affordabilityScore * 0.1 +
        relevance * 0.1

      const personalizedScore = hardExcluded ? 0 : fitScore
      const renderedDotSize =
        BASE_DOT_SIZE * (1 + personalizedScore * FIT_SIZE_MULTIPLIER)

      const explanation = buildExplanation({
        hardExcluded,
        menuFit,
        groundDensityScore,
        healthyScore: candidate.signal.healthyScore,
      })

      return {
        ...candidate,
        personalizedScore,
        hardExcluded,
        renderedDotSize,
        explanation,
        menuFitScore: menuFit?.fitScore ?? null,
        groundDensityScore,
        distanceMeters,
      }
    }),
  )

  const filtered = input.showAll
    ? scored
    : scored.filter((p) => !p.hardExcluded)

  return filtered.sort((a, b) => b.personalizedScore - a.personalizedScore)
}

function evaluateHardExclusion(
  _candidate: PlaceCandidate,
  _profile: ConstraintProfile,
): boolean {
  // Brain RPC + place metadata — stub until **07** wired
  return false
}

function buildExplanation(args: {
  hardExcluded: boolean
  menuFit: { fitScore: number; greenCount: number } | null
  groundDensityScore: number
  healthyScore: number
}): string {
  if (args.hardExcluded) return 'Excluded by your hard constraints.'
  if (args.menuFit && args.menuFit.greenCount >= 3) {
    return `Best nearby for you: ${args.menuFit.greenCount} likely OK dishes.`
  }
  if (args.healthyScore >= 0.7) return 'Strong healthy place signal.'
  if (args.groundDensityScore > 0.5) return 'Active community signals nearby.'
  return 'Moderate fit for your profile.'
}

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
```

**Conflict resolution:** personalized restaurant discovery doc (**26** `07`) defines scoring shape — **28** owns map-scale implementation.
