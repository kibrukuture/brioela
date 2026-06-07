# Brioela Generative Grammar — ts-rest Full-Stack Standard

## What This File Covers

The final preferred HTTP API standard for new Brioela code: ts-rest contracts in `shared`,
ts-rest React Query hooks in mobile, Hono remaining as the backend router, feature wrappers for
Brioela-specific behavior, Stage delivery through feature contracts, and query keys derived from
contract identity instead of a manually maintained global key file.

This file builds on `20-contracts-and-stage-delivery.md` and `21-contract-spine-hardening.md`.

---

## Final Direction

Use ts-rest for normal HTTP APIs.

```text
shared/contracts/      -> ts-rest contract truth
backend/Hono           -> route + handler, obeying shared contract
mobile/network/tsr.ts  -> tiny ts-rest React Query client setup
mobile/features/*      -> feature hooks wrapping generated ts-rest hooks
```

Hono stays. ts-rest does not replace Hono.

ts-rest replaces the hand-written HTTP client layer for normal request/response endpoints.

---

## Package Ownership

Match the existing shared Zod pattern.

```text
shared  -> @ts-rest/core
backend -> @ts-rest/serverless for Hono-mounted fetch runtime routes
mobile  -> @ts-rest/react-query for generated TanStack hooks
```

`shared/contracts/index.ts` re-exports what backend/mobile need from `@ts-rest/core`:

```typescript
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

Backend and mobile import from:

```typescript
import { API_CONTRACT } from "@brioela/shared/contracts"
```

not from:

```typescript
import { initContract } from "@ts-rest/core"
```

Backend may import `@ts-rest/serverless/fetch` in the Hono route-mounting layer because that is a
backend-only runtime adapter. Backend should still not import `@ts-rest/core` directly for normal
app code.

---

## Contract File Shape

One feature owns one contract file.

```text
shared/contracts/
  index.ts
  api-error.schema.ts
  contract-key.ts
  scan.contract.ts
  menu.contract.ts
  mesa.contract.ts
  cooking.contract.ts
  passport.contract.ts
```

Routine endpoint schemas stay in the feature contract file.

```typescript
// shared/contracts/scan.contract.ts
import { initContract } from "@brioela/shared/contracts"
import { z } from "@brioela/shared/zod"
import { stageSchema } from "@brioela/shared/grammar"
import { apiErrorSchema } from "@brioela/shared/contracts/api-error.schema"

const c = initContract()

const scanProductBodySchema = z.object({
  barcode: z.string().min(1),
})

const scanVerdictSchema = z.object({
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

const scanProductResponseSchema = z.object({
  scan: scanVerdictSchema,
  stage: stageSchema.nullable().optional(),
})

export const scanContract = c.router(
  {
    scanProduct: {
      method: "POST",
      path: "/v1/scan/product",
      body: scanProductBodySchema,
      responses: {
        200: scanProductResponseSchema,
        400: apiErrorSchema,
        401: apiErrorSchema,
        500: apiErrorSchema,
      },
      strictStatusCodes: true,
      metadata: {
        id: "scan.product",
        stage: {
          allowed: true,
          mode: "http_optional",
          surfaces: ["scan_explanation_brioela_generative_ui"],
          safetyLock: "required_when_hard_blocks",
        },
      } as const,
    },
  },
  {
    strictStatusCodes: true,
  },
)
```

The root contract combines feature contracts:

```typescript
// shared/contracts/index.ts
export const API_CONTRACT = c.router({
  scan: scanContract,
  menu: menuContract,
  mesa: mesaContract,
  passport: passportContract,
})
```

---

## Mobile Client Setup

`mobile/network/tsr.ts` is a tiny initializer only. It must not become a giant endpoint file.

```typescript
import { initTsrReactQuery } from "@ts-rest/react-query/v5"
import { API_CONTRACT } from "@brioela/shared/contracts"
import { PUBLIC_URLS } from "@brioela/shared/constants"
import { useAuthStore } from "@/stores/account/use-auth-store"

export const tsr = initTsrReactQuery(API_CONTRACT, {
  baseUrl: PUBLIC_URLS.PUBLIC_API_BASE_URL,
  baseHeaders: {
    Authorization: () => {
      const token = useAuthStore.getState().session?.access_token
      return token ? `Bearer ${token}` : ""
    },
  },
  validateResponse: true,
  throwOnUnknownStatus: true,
})
```

No endpoint logic lives here. Endpoint truth lives in `shared/contracts/*`.

---

## Feature Hooks Wrap Generated Hooks

Do not scatter direct `tsr.*` calls across screens.

Use feature hooks.

```typescript
// mobile/features/scan/hooks/use-scan-product.ts
import { tsr } from "@/network/tsr"
import { contractKey } from "@brioela/shared/contracts/contract-key"
import { API_CONTRACT } from "@brioela/shared/contracts"

export function useScanProduct() {
  return tsr.scan.scanProduct.useMutation({
    mutationKey: contractKey(API_CONTRACT.scan.scanProduct),
    onSuccess: (response) => {
      if (response.status !== 200) return

      // Brioela-specific cache, haptics, telemetry, or feature behavior goes here.
      // Screen components should not duplicate this logic.
    },
  })
}
```

Screen:

```tsx
const scanProduct = useScanProduct()
```

not:

```tsx
const scanProduct = tsr.scan.scanProduct.useMutation()
```

Feature hooks are the Brioela behavior boundary.

---

## Query Keys

ts-rest React Query still accepts a TanStack `queryKey`. Brioela should not maintain one global
manual `QUERY_KEYS` object for new code.

Use contract-derived keys.

```typescript
contractKey(API_CONTRACT.menu.getMenu, { params: { id } })
contractKey(API_CONTRACT.scan.scanProduct, { body: { barcode } })
```

Suggested helper:

```typescript
// shared/contracts/contract-key.ts
export function contractKey(endpoint: { metadata?: { id?: string } }, input?: unknown) {
  const id = endpoint.metadata?.id

  if (!id) {
    throw new Error("Contract endpoint is missing metadata.id")
  }

  return input ? [id, stableContractInputHash(input)] as const : [id] as const
}
```

For queries:

```typescript
export function useMenu(id: string) {
  return tsr.menu.getMenu.useQuery({
    queryKey: contractKey(API_CONTRACT.menu.getMenu, { params: { id } }),
    queryData: {
      params: { id },
    },
    enabled: id.length > 0,
    staleTime: 60_000,
  })
}
```

For mutations, use endpoint identity as the base mutation key:

```typescript
mutationKey: contractKey(API_CONTRACT.scan.scanProduct)
```

Feature-local key wrappers are allowed only when they call `contractKey` internally. No separate
manual truth.

---

## `.api.ts` Files

For normal ts-rest endpoints, do not create `.api.ts` files.

Old shape:

```text
mobile/network/scan/scan.api.ts
mobile/network/scan/use-scan-product.ts
```

New shape:

```text
mobile/network/tsr.ts
mobile/features/scan/hooks/use-scan-product.ts
```

`.api.ts` files are allowed only for non-standard boundaries:

- WebSocket/realtime setup
- native upload progress if ts-rest is not enough
- file/blob download edge cases
- third-party SDK calls
- local native APIs that are not HTTP contracts

Normal app API calls use ts-rest generated hooks through feature wrappers.

---

## Backend Hono Shape

Hono remains the app/router.

```typescript
app.route("/v1/scan", scanRouter)
```

For contract-backed HTTP routes, prefer mounting the ts-rest fetch runtime under Hono. This keeps
Hono as the outer app while letting ts-rest handle request parsing, status responses, and response
validation.

```typescript
import { Hono } from "hono"
import { fetchRequestHandler, tsr } from "@ts-rest/serverless/fetch"
import { API_CONTRACT } from "@brioela/shared/contracts"

const scanRouter = new Hono()

const scanTsRestRouter = tsr.router(API_CONTRACT.scan, {
  scanProduct: async ({ body }, context) => {
    const user = getUserFromContext(context)

    const scan = await buildScanVerdict({
      userId: user.id,
      barcode: body.barcode,
    })

    const stage = await composeStageForContract(API_CONTRACT.scan.scanProduct, {
      surface: "scan_explanation_brioela_generative_ui",
      payload: buildScanStagePayload({ scan }),
      safetyLock: scan.hardBlocks.length > 0,
    })

    return {
      status: 200,
      body: {
        scan,
        stage,
      },
    }
  },
})

scanRouter.all("/*", (ctx) => {
  return fetchRequestHandler({
    request: ctx.req.raw,
    contract: API_CONTRACT.scan,
    router: scanTsRestRouter,
    options: {
      responseValidation: true,
    },
  })
})
```

This replaces most custom `parseBody` / `sendContract` helper work for normal HTTP routes.

Brioela still needs small policy helpers around Stage generation:

- `composeStageForContract(...)`
- `assertStageAllowedByContract(...)`
- feature auth/context extraction, depending on route setup

Manual Hono handlers remain acceptable for non-standard boundaries, but normal contract-backed
HTTP should use the ts-rest fetch runtime under Hono.

Fallback manual shape if a route cannot use the fetch runtime:

```typescript
export async function onScanProduct(c: AppContext) {
  const body = await parseBody(c, API_CONTRACT.scan.scanProduct)

  const scan = await buildScanVerdict({
    userId: c.get("user").id,
    barcode: body.barcode,
  })

  const stage = await composeStageForContract(API_CONTRACT.scan.scanProduct, {
    surface: "scan_explanation_brioela_generative_ui",
    payload: buildScanStagePayload({ scan }),
    safetyLock: scan.hardBlocks.length > 0,
  })

  return sendContract(c, API_CONTRACT.scan.scanProduct, 200, {
    scan,
    stage,
  })
}
```

Backend helpers must:

- parse request data from the contract
- validate response body by status code
- enforce `metadata.stage`
- wrap the API response consistently
- log with `metadata.id`

The smoke test confirmed `@ts-rest/serverless/fetch` works inside Hono with request validation,
response validation, status responses, and Stage metadata preserved.

---

## Stage Delivery

HTTP feature responses include optional Stage in the response body.

```typescript
const scanProductResponseSchema = z.object({
  scan: scanVerdictSchema,
  stage: stageSchema.nullable().optional(),
})
```

Mobile render:

```tsx
<GrammarRenderer
  stage={data.body.stage}
  fallback={<StaticScanSecondary scan={data.body.scan} />}
/>
```

Realtime features still use custom stream contracts. ts-rest is the HTTP standard, not the
WebSocket protocol.

---

## What TanStack Still Provides

`@ts-rest/react-query` does not replace TanStack Query. It wraps it.

Still available:

- `enabled`
- `staleTime`
- `gcTime`
- `retry`
- `select`
- `onSuccess`
- `onError`
- `onSettled`
- `placeholderData`
- `initialData`
- query client cache updates
- invalidation
- optimistic updates

If a rare feature needs TanStack behavior the ts-rest wrapper cannot express, use plain TanStack
for that feature only and document why.

---

## Enforcement Rules

For new Brioela HTTP code:

- No raw `axios` for product API calls.
- No `api.get<T>()` / `api.post<T>()` style blind generics.
- No route string outside `shared/contracts` and backend route mounting.
- No `.api.ts` for normal ts-rest endpoints.
- No direct `tsr.*` usage scattered through screens.
- No global manual `QUERY_KEYS` for contract-backed endpoints.
- No HTTP feature Stage unless endpoint metadata allows it.

---

## Build Order

1. `shared/contracts/index.ts` re-exports `@ts-rest/core` and combines feature contracts.
2. `shared/contracts/contract-key.ts` implements stable contract keys.
3. `shared/contracts/scan.contract.ts` defines one scan endpoint with Stage metadata.
4. `backend/src/api/scan/scan.route.ts` mounts ts-rest fetch runtime under Hono for the scan contract.
5. `mobile/network/tsr.ts` initializes `@ts-rest/react-query/v5`.
6. `mobile/features/scan/hooks/use-scan-product.ts` wraps generated mutation.
7. `GrammarRenderer` renders `data.body.stage` with static fallback.

Prove this vertical slice before adding more endpoints.

---

## One-Line Law

ts-rest owns HTTP shape; Brioela feature hooks own product behavior.
