# Draft: start.shop.mira.session.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/shop/start.shop.mira.session.handler.ts`

**Gap:** No Brain orchestration to spawn `shop-{userId}-{visitId}` MiraSession (G7).

**Source:** `build-guide/32-in-store-copilot/01-session-lifecycle.md`, **29** startCookingSession pattern

---

```typescript
import type { Env } from '@/types/env'
import type { ShopContextPayload } from '@brioela/shared/validator/shop/shop.context.payload.schema'
import type { ShopVisitListSource } from '@/agents/brain/_schemas/shop.visit.schema'
import { assembleShopSessionContext } from './assemble.shop.session.context.helper'
import { buildInStoreCopilotMiraScene } from '@/agents/mira/_scenes/build.in.store.copilot.mira.scene.helper'
import { getBrainStub } from '@/agents/brain/get.brain.stub'
import { signMobileAudioToken } from '@/api/cooking/_helpers/sign-mobile-audio-token.helper'

export type StartShopMiraSessionInput = {
  userId: string
  placeId: string
  listSource?: ShopVisitListSource
  dictatedListItems?: string[]
  activeMesaAudienceId?: string
}

export type StartShopMiraSessionResult = {
  visitId: string
  miraSessionId: string
  doAudioEndpoint: string
  mobileAudioToken: string
  context: ShopContextPayload
  expiresAt: string
}

export async function startShopMiraSession(
  env: Env,
  input: StartShopMiraSessionInput,
): Promise<StartShopMiraSessionResult> {
  const visitId = crypto.randomUUID()
  const miraSessionId = crypto.randomUUID()
  const doName = `shop-${input.userId}-${visitId}`

  const brain = getBrainStub(env, input.userId)
  const placeLabel = await brain.resolvePlaceLabel(input.placeId)

  const context = await assembleShopSessionContext({
    db: brain.db,
    userId: input.userId,
    visitId,
    placeId: input.placeId,
    placeLabel,
    dictatedItems: input.dictatedListItems,
  })

  const scene = await buildInStoreCopilotMiraScene({
    userId: input.userId,
    sessionId: miraSessionId,
    context,
    situation: {
      visitId,
      placeId: input.placeId,
      runningSpendEstimate: 0,
      pricedItemCount: 0,
      unpromptedInterventionCount: 0,
      baselineMentioned: false,
      groundFindRelayed: false,
      lastScanEventId: null,
    },
  })

  const miraId = env.MIRA_SESSION.idFromName(doName)
  const miraStub = env.MIRA_SESSION.get(miraId)

  await miraStub.fetch('https://mira/init', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      sessionId: miraSessionId,
      userId: input.userId,
      scene,
      mode: 'audio_only',
      thinkingLevel: 'minimal',
    }),
  })

  await brain.insertShopVisit({
    visitId,
    placeId: input.placeId,
    miraSessionId,
    listSource: input.listSource ?? inferListSource(context),
  })

  const mobileAudioToken = await signMobileAudioToken(env, {
    sessionId: miraSessionId,
    userId: input.userId,
    doName,
  })

  return {
    visitId,
    miraSessionId,
    doAudioEndpoint: `${env.WORKER_WS_BASE_URL}/mira/${doName}/audio`,
    mobileAudioToken,
    context,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  }
}

function inferListSource(context: ShopContextPayload): ShopVisitListSource {
  const sources = new Set(context.shoppingList.map((item) => item.source))
  if (sources.size > 1) return 'mixed'
  const only = [...sources][0]
  if (only === 'plan') return 'plan'
  if (only === 'prediction') return 'pantry'
  return 'dictated'
}
```
