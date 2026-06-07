# Brioela Generative Grammar — Contracts And Stage Delivery

## What This File Covers

How Brioela Generative Grammar crosses the backend/client boundary without duct tape: endpoint
contracts, where a Stage is generated, how HTTP and realtime features deliver it, how Axios and
TanStack Query fit, and the exact rule that prevents a separate "grammar API" from competing
with feature APIs.

This file supersedes any earlier suggestion that normal product surfaces should call a standalone
`/grammar/compose` route.

---

## Core Decision

Generative UI is selected by AI, but delivered by the feature that owns the moment.

```text
Feature owns the product route or stream.
Grammar owns the optional Stage.
Renderer owns display only.
```

Do not build a normal product route like:

```text
POST /v1/grammar/compose-scan-ui
POST /v1/grammar/compose-cooking-ui
POST /v1/grammar/compose-mesa-ui
```

That creates two APIs for one user moment and makes the product feel stitched together.

Instead:

```text
POST /v1/scan/product        -> { scan, stage? }
POST /v1/menu/scan           -> { menu, stage? }
POST /v1/mesa/evaluate       -> { mesaFit, stage? }
cooking realtime stream      -> { type: "stage", stage }
```

---

## Static vs AI-Selected

The renderer is static. The Stage is AI-selected.

Static / compiled:

- `GrammarRenderer`
- composition components
- primitive node components
- Skia shaders
- Reanimated beat presets
- Zod schemas
- safety fallbacks

AI-selected:

- whether to produce a Stage at all
- `mood`
- `composition.type`
- `atmosphere.family`
- `beats.preset`
- `voice`
- safe slot copy
- safe slot ordering/emphasis inside the allowed composition

Never AI-selected:

- hard allergy verdict
- medical hard flag
- recall alert
- payment/checkout
- consent
- destructive action
- navigation/account/security UI

---

## HTTP Is Not Static

HTTP features can still use AI-selected generative UI.

Correct mental model:

```text
HTTP      -> AI-selected Stage can arrive as data.stage
Realtime  -> AI-selected Stage can arrive as { type: "stage", stage }
```

Incorrect mental model:

```text
HTTP      -> static only
Realtime  -> generative only
```

The delivery mechanism is different. The AI selection mechanism is allowed in both.

---

## Contract-First API Boundary

New Brioela endpoints should be contract-first.

The current copied app has good pieces: shared route constants, shared Zod validators, Hono, Axios,
and TanStack Query. The weakness is that method, path, params, query, body, and response are split
across multiple files. The contract joins them.

Dependency rule: contract libraries that are used by backend and mobile live in `shared` and are
re-exported from there, matching the existing `shared/zod/index.ts` pattern. Backend and mobile do
not import `@ts-rest/core` directly.

```typescript
// shared/contracts/index.ts
export { initContract, initClient } from "@ts-rest/core"
export type {
  ClientInferRequest,
  ClientInferResponseBody,
  ClientInferResponses,
  ServerInferRequest,
  ServerInferResponseBody,
  ServerInferResponses,
} from "@ts-rest/core"
```

Target shape:

```typescript
type EndpointContract = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  path: (params: Record<string, string>) => string
  pattern: string
  auth: "required" | "optional" | "none"
  params?: z.ZodType
  query?: z.ZodType
  body?: z.ZodType
  response: z.ZodType
}
```

Use helpers in actual code so endpoints stay small. The important rule is one endpoint object owns:

- method
- public client path
- backend route pattern
- auth policy
- params schema
- query schema
- body schema
- response schema

---

## Contract Example — Scan Product

```typescript
import { z } from "@brioela/shared/zod"
import { stageSchema } from "@brioela/shared/grammar"

export const scanProductBodySchema = z.object({
  barcode: z.string().min(1),
})

export const scanVerdictSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  verdict: z.enum(["safe", "caution", "danger"]),
  hardBlocks: z.array(
    z.object({
      type: z.enum(["allergy", "medical_condition", "recall"]),
      message: z.string(),
    }),
  ),
  reasons: z.array(z.string()),
})

export const scanProductResponseSchema = z.object({
  scan: scanVerdictSchema,
  stage: stageSchema.nullable().optional(),
})

export const SCAN_CONTRACTS = {
  scanProduct: {
    method: "POST",
    path: () => "/v1/scan/product",
    pattern: "/product",
    auth: "required",
    body: scanProductBodySchema,
    response: scanProductResponseSchema,
  },
} as const
```

The contract is not the business logic. It is the boundary truth both backend and mobile import.

---

## Backend Shape — No Controller, No Service Layer By Default

For new Brioela features, prefer:

```text
backend/src/api/scan/
  scan.route.ts
  handlers/
    on-scan-product.ts
  helpers/
    build-scan-verdict.ts
    build-scan-stage-payload.ts
```

Avoid pass-through controllers when they only wrap responses. Avoid a `services/` layer by default
if the project standard is handler + helper. Add deeper layers only when they remove real
duplication or isolate external systems.

Route:

```typescript
import { Hono } from "hono"
import { SCAN_CONTRACTS } from "@brioela/shared/contracts/scan.contract"
import { onScanProduct } from "@/api/scan/handlers/on-scan-product"

export const scanRouter = new Hono()

scanRouter.post(SCAN_CONTRACTS.scanProduct.pattern, onScanProduct)
```

---

## Backend Handler — HTTP Stage Delivery

The handler owns the feature result and calls the grammar composer as an internal capability.

```typescript
import type { AppContext } from "@/index"
import { HTTPException } from "hono/http-exception"
import { ErrorCode } from "@brioela/shared/types/api"
import { apiSuccessResponse } from "@/lib/response"
import { SCAN_CONTRACTS } from "@brioela/shared/contracts/scan.contract"
import { composeStage } from "@/core/generative-grammar/compose-stage"
import { buildScanVerdict } from "@/api/scan/helpers/build-scan-verdict"
import { buildScanStagePayload } from "@/api/scan/helpers/build-scan-stage-payload"

export async function onScanProduct(c: AppContext) {
  const rawBody = await c.req.json()
  const parsedBody = SCAN_CONTRACTS.scanProduct.body.safeParse(rawBody)

  if (!parsedBody.success) {
    throw new HTTPException(ErrorCode.INVALID_INPUT, {
      message: parsedBody.error.issues[0]?.message ?? "Invalid scan input",
    })
  }

  const user = c.get("user")
  if (!user?.id) {
    throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: "Unauthorized" })
  }

  const scan = await buildScanVerdict({
    userId: user.id,
    barcode: parsedBody.data.barcode,
  })

  const stage = await composeStage({
    surface: "scan_secondary",
    payload: buildScanStagePayload({ userId: user.id, scan }),
    safetyLock: scan.hardBlocks.length > 0,
  })

  const response = SCAN_CONTRACTS.scanProduct.response.parse({
    scan,
    stage,
  })

  return c.json(apiSuccessResponse(response))
}
```

This is the exact backend handoff:

```typescript
return c.json(apiSuccessResponse({ scan, stage }))
```

The Stage is part of the scan response. It is not fetched from a second grammar endpoint.

---

## AI Selection — Structured Output For HTTP

For a one-shot HTTP surface, the backend can ask the model for one Stage directly.

```typescript
export async function composeStage(input: ComposeStageInput): Promise<Stage | null> {
  const worthEnhancing = await decideIfWorthEnhancing(input)

  if (!worthEnhancing) {
    return null
  }

  const modelOutput = await presentMomentStructuredOutput({
    surface: input.surface,
    payload: input.payload,
    safetyLock: input.safetyLock,
  })

  const parsed = stageSchema.safeParse(modelOutput)
  if (!parsed.success) {
    return null
  }

  const safe = runStageSafetyFilter(parsed.data)
  if (!safe.ok) {
    return null
  }

  return safe.stage
}
```

The model chooses from the Stage schema:

```json
{
  "grammarVersion": "1",
  "surface": "scan_secondary",
  "safetyLock": true,
  "mood": "warm_caution",
  "atmosphere": {
    "family": "verdict_bloom_field",
    "intensity": "low",
    "tone": "caution"
  },
  "composition": {
    "type": "scan_verdict_focus"
  },
  "slots": {
    "headline": "This one needs care",
    "caption": "The safety warning above is the source of truth. Here is the plain reason.",
    "reasons": [
      "Peanuts appear directly in the ingredient list.",
      "Avoid this product for your profile."
    ]
  },
  "beats": {
    "preset": "settle_calm_beats",
    "stagger": "none"
  },
  "voice": "voice_body",
  "expiresAt": null
}
```

If the model chooses badly, validation fails and `stage` becomes `null`. Static fallback renders.

---

## AI Selection — Tool Calling For Agentic/Realtimes

For agentic flows, `present_moment` is one tool in the feature agent's toolbox.

Example cooking agent tools:

```typescript
const tools = {
  set_timer: {
    description: "Start or update a cooking timer.",
    input_schema: setTimerSchema,
  },
  adjust_recipe_steps: {
    description: "Adapt recipe steps to the user's constraints.",
    input_schema: adjustRecipeStepsSchema,
  },
  present_moment: {
    description:
      "Render one optional Brioela Stage for the current cooking moment. Use only when visual framing helps. Never render safety, timer controls, consent, or destructive actions.",
    input_schema: stageSchema,
  },
}
```

Tool call emitted by the model:

```json
{
  "tool": "present_moment",
  "arguments": {
    "grammarVersion": "1",
    "surface": "cooking_opener",
    "safetyLock": false,
    "mood": "focused_cooking",
    "atmosphere": {
      "family": "ambient_grain_field",
      "intensity": "low",
      "tone": "neutral"
    },
    "composition": {
      "type": "recipe_steps_rail"
    },
    "slots": {
      "headline": "Twenty minutes, no drama",
      "caption": "I’ll keep this tight and skip anything fussy."
    },
    "beats": {
      "preset": "lift_soft_beats",
      "stagger": "small"
    },
    "voice": "voice_body",
    "expiresAt": null
  }
}
```

Backend validates `tool.arguments` with `stageSchema`. If valid and safe, it sends a stage event.

---

## Realtime Stage Delivery

Realtime features use one feature stream. Do not create a second grammar stream.

```typescript
const cookingSessionEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("assistant_text"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("timer_started"),
    timer: timerSchema,
  }),
  z.object({
    type: z.literal("stage"),
    stage: stageSchema,
  }),
  z.object({
    type: z.literal("safety_interrupt"),
    interrupt: safetyInterruptSchema,
  }),
])
```

Wire event:

```json
{
  "type": "stage",
  "stage": {
    "grammarVersion": "1",
    "surface": "cooking_opener",
    "composition": {
      "type": "recipe_steps_rail"
    },
    "mood": "focused_cooking"
  }
}
```

This applies to any realtime feature, not only cooking. Bela live order, live menu discussion,
Mesa co-planning, and future room/session features all follow the same rule: one feature stream,
with Stage as one event type.

---

## Mobile Network — Axios Stays, Contract Parsing Replaces Blind Generics

Axios is transport. It does not need to be replaced.

Current risky pattern:

```typescript
api.post<ScanProductResponse>(API_ROUTES.scan.product(), body)
```

Better pattern:

```typescript
api.request(SCAN_CONTRACTS.scanProduct, { body })
```

The request helper still uses Axios internally, but validates response data before returning it:

```typescript
export async function request<TContract extends EndpointContract>(
  contract: TContract,
  input: ContractInput<TContract>,
): Promise<ContractResponse<TContract>> {
  const response = await apiClient.request({
    method: contract.method,
    url: contract.path(input.params ?? {}),
    params: input.query,
    data: input.body,
  })

  if ("error" in response.data) {
    throw new ApiError(response.data)
  }

  const parsed = contract.response.safeParse(response.data.data)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid API response")
  }

  return parsed.data
}
```

This prevents the client from trusting `T` when the server returns the wrong shape.

---

## TanStack Query Stays

TanStack Query does not need a redesign. The API function underneath gets stricter.

```typescript
import { useMutation } from "@tanstack/react-query"
import { scanProduct } from "@/network/scan/scan.api"

export function useScanProduct() {
  return useMutation({
    mutationFn: scanProduct,
  })
}
```

The UI does not care whether `scanProduct` uses raw Axios or contract-aware Axios internally.

---

## Mobile Render

Feature screen owns the experience. Grammar renderer owns only the Stage.

```tsx
export function ScanResultScreen({ data }: { data: ScanProductResponse }) {
  return (
    <>
      <StaticScanSafetyBlock
        verdict={data.scan.verdict}
        hardBlocks={data.scan.hardBlocks}
      />

      <GrammarRenderer
        stage={data.stage}
        fallback={<StaticScanSecondary scan={data.scan} />}
      />
    </>
  )
}
```

The preferred renderer call is:

```tsx
<GrammarRenderer
  stage={data.stage}
  fallback={<StaticScanSecondary scan={data.scan} />}
/>
```

If `stage` is missing, invalid, late, or rejected, fallback stays.

---

## What Normal Features Must Not Do

- Do not call a separate grammar endpoint after the feature endpoint.
- Do not let `mobile/grammar/` fetch data.
- Do not put TanStack Query hooks inside `mobile/grammar/`.
- Do not let grammar nodes read app state, local DB, or network.
- Do not render Stage over a safety block.
- Do not use `api.get<T>()` / `api.post<T>()` for new Brioela code when a contract exists.

---

## Allowed Exception — Internal Preview Route

A standalone grammar route is allowed only for internal tooling:

- catalog preview
- dev fixture rendering
- QA stage validation
- design review

It is not part of normal product runtime.

---

## Build Order Update

After `19-code-package-structure.md`, implement contracts before feature/backend/mobile wiring:

1. `shared/grammar/` Stage schema and tiny vertical-slice catalog.
2. `shared/contracts/` helper and one feature contract, starting with scan; `@ts-rest/core` lives in `shared` and is re-exported from `@brioela/shared/contracts`.
3. `mobile/network/core/request(contract, input)` using existing Axios client.
4. Backend route + handler without controller for one feature.
5. Backend `composeStage` with structured output or mocked Stage first.
6. Mobile `GrammarRenderer` for one Stage.
7. TanStack hook remains a thin wrapper over the feature API function.

Prove one feature end-to-end before widening the catalog.

---

## One-Line Rule

AI chooses the Stage. The feature delivers the Stage. The renderer renders the Stage.
