# Draft: evaluate.creator.video.firewall.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/verified/evaluate.creator.video.firewall.helper.ts`

Source: `build-guide/23-verified-profiles/07-creator-video-firewall.md`

---

```typescript
import type { VerifiedCreatorVideoRow } from '@/shared/drizzle/schema/verified.creator.video.schema'

export type CreatorVideoSurface =
  | 'recipe_suggestion'
  | 'cooking_step'
  | 'recipe_detail'
  | 'search_results'
  | 'verified_profile_page'

const SURFACE_LIMITS: Record<CreatorVideoSurface, number> = {
  recipe_suggestion: 3,
  cooking_step: 1,
  recipe_detail: 3,
  search_results: 10,
  verified_profile_page: 10,
}

export type CreatorVideoFirewallContext = {
  surface: CreatorVideoSurface
  recipeId?: string
  dishQuery?: string
  userHardConstraints: string[]
  dismissedVideoIds: string[]
  recentlyShownVideoIds: string[]
}

export function evaluateCreatorVideoFirewall(
  candidates: VerifiedCreatorVideoRow[],
  context: CreatorVideoFirewallContext,
): VerifiedCreatorVideoRow[] {
  const limit = SURFACE_LIMITS[context.surface]

  const filtered = candidates.filter((video) => {
    if (video.verificationStatus !== 'approved') return false
    if (context.dismissedVideoIds.includes(video.videoId)) return false
    if (context.recentlyShownVideoIds.includes(video.videoId)) return false
    if (context.recipeId && video.recipeId && video.recipeId !== context.recipeId) return false
    return true
  })

  const ranked = filtered.sort((a, b) => {
    const aRecipeFit = context.recipeId && a.recipeId === context.recipeId ? 1 : 0
    const bRecipeFit = context.recipeId && b.recipeId === context.recipeId ? 1 : 0
    return bRecipeFit - aRecipeFit
  })

  return ranked.slice(0, limit)
}
```

**Blocked surfaces:** infinite feed, home autoplay, follower-based discovery — no API routes for those.
