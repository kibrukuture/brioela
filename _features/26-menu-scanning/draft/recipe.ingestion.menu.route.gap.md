# Gap snapshot: 25 → 26 menu_scan handoff

Target: `backend/src/api/recipes/_helpers/route.shared.content.helper.ts` (consumer) + **26** internal entry

**Status:** **25** draft stub only. From `build-guide/19-recipe-ingestion/08-shared-content-classifier.md`.

```typescript
import type { RecipeShareInput, SharedContentClassification } from '@brioela/shared/validator/recipe.import'
import type { Env } from '@/types/env'

/**
 * Called by 25 route dispatcher when recommendedRoute === 'menu_scan'.
 * Must NOT invoke recipe normalizer.
 */
export async function enqueueMenuScanFromSharedImport(
  env: Env,
  userId: string,
  jobId: string,
  input: RecipeShareInput,
): Promise<{ menuScanId: string }> {
  const hasImages = Boolean(input.localImageBase64)
  const hasUrl = Boolean(input.sourceUrl)

  if (hasImages) {
    const response = await fetch(`${env.API_BASE_URL}/api/menu-scans/photos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await getUserTokenForJob(env, userId)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imagesBase64: [input.localImageBase64],
        capturedAt: input.sharedAt ?? Date.now(),
      }),
    })
    const result = await response.json()
    return { menuScanId: result.scanId }
  }

  if (hasUrl) {
    const response = await fetch(`${env.API_BASE_URL}/api/menu-scans/url`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await getUserTokenForJob(env, userId)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: input.sourceUrl,
        capturedAt: input.sharedAt ?? Date.now(),
      }),
    })
    const result = await response.json()
    return { menuScanId: result.scanId }
  }

  throw new Error('menu_scan_route_requires_url_or_image')
}

async function getUserTokenForJob(env: Env, userId: string): Promise<string> {
  void env
  void userId
  return 'internal-job-token'
}
```

**Classifier examples:**

- Restaurant QR/menu URL → `primaryKind: restaurant_menu`, `recommendedRoute: menu_scan`
- TikTok recipe video → `recipe_import` — not **26**

**Low confidence:** `needs_user_choice` includes "Scan as menu" option.
