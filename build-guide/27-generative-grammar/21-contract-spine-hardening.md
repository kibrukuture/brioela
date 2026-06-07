# Brioela Generative Grammar — Contract Spine Hardening

## What This File Covers

The stricter version of `20-contracts-and-stage-delivery.md`: how to make the API/stream contract
system hard to disobey, easy for agents to use, and strict enough that runtime data, TypeScript
types, TanStack Query keys, backend responses, and Brioela Generative UI policy all come from one
spine.

This file corrects one loose earlier idea: do **not** scatter routine endpoint schemas into many
generic schema files. Co-locate feature endpoint schemas with the feature contract by default.

---

## Core Standard

Brioela uses a Contract Spine.

```text
Contract owns the boundary.
Backend obeys the contract.
Mobile obeys the contract.
Realtime obeys the contract.
Brioela Generative UI policy is declared in the contract.
```

The contract is executable law, not documentation.

---

## Contracted HTTP, Not Pure RPC

Use HTTP contracts with an RPC-like developer experience.

Do not make the core product API pure RPC.

Reason:

- Brioela needs explicit HTTP semantics for mobile, web, uploads, observability, auth, and future Workers/DO boundaries.
- The shared package should own the contract truth, not backend implementation types.
- Pure server-inferred RPC can couple mobile too tightly to backend route implementation and can become heavy in large apps.
- Contracted HTTP keeps route shape visible while still making calls feel one-line simple.

Developer experience target:

```typescript
request(SCAN_CONTRACTS.scanProduct, { body })
```

not:

```typescript
api.post<ScanProductResponse>("/v1/scan/product", body)
```

Package ownership rule: `@ts-rest/core` lives in `shared`, the same way Zod is centralized behind
`shared/zod/index.ts`. Backend and mobile import contract helpers from `@brioela/shared/contracts`,
not from `@ts-rest/core` directly.

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

Allowed package ownership:

```text
shared  -> @ts-rest/core
backend -> imports contracts from @brioela/shared/contracts
backend -> may use @ts-rest/serverless/fetch for Hono-mounted contract routes
mobile  -> imports contracts from @brioela/shared/contracts
mobile  -> uses @ts-rest/react-query for generated TanStack hooks
```

Smoke result: `@ts-rest/serverless/fetch` works inside a Hono route with request validation,
response validation, status responses, and contract metadata. Prefer that for normal HTTP routes
instead of writing large custom parse/send adapters.

---

## Contract File Rule

Default: one feature contract file owns the endpoint schemas for that feature.

```text
shared/contracts/
  scan.contract.ts
  menu.contract.ts
  cooking.contract.ts
  mesa.contract.ts
  passport.contract.ts
  index.ts
```

Inside `scan.contract.ts`, keep scan endpoint schemas close to the endpoints:

```typescript
const scanProductBodySchema = z.object({ ... })
const scanVerdictSchema = z.object({ ... })
const scanProductResponseSchema = z.object({ ... })

export const SCAN_CONTRACTS = {
  scanProduct: endpoint({ ... }),
} as const
```

This is intentionally different from the copied app pattern where routes and validators are split
across many files by default.

---

## When A Schema May Be Separate

Separate schema files are allowed only when the schema is genuinely a shared domain primitive,
not merely an endpoint request/response.

Allowed separate schemas:

- `shared/grammar/brioela-generative-ui.schema.ts` — used by many feature contracts and renderer/backend grammar.
- `shared/contracts/api-error.schema.ts` — common error envelope.
- `shared/contracts/contract.ts` — endpoint/stream helper definitions.
- `shared/domain/food-audience.schema.ts` if used across scan, Mesa, Bela, cooking, Passport.
- `shared/domain/money.schema.ts` if used across pricing, Bela, receipt, payments.

Not allowed by default:

```text
shared/schemas/scan.schema.ts
shared/schemas/menu.schema.ts
shared/schemas/user.schema.ts
```

unless those files contain domain primitives used by multiple feature contracts.

Rule:

```text
If only one contract file uses it, keep it in that contract file.
If two or more feature contract files use it, promote it to shared/domain or shared/grammar.
```

This prevents schema sprawl while still avoiding duplication for real shared primitives.

---

## Contract Shape

Use status-code-aware contracts.

```typescript
type EndpointContract = {
  id: string
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  path: string
  pattern: string
  auth: "required" | "optional" | "none"
  params?: z.ZodType
  query?: z.ZodType
  body?: z.ZodType
  responses: Record<number, z.ZodType>
  brioela_generative_ui: BrioelaGenerativeUiPolicy
}
```

`id` is required. It powers logs, query keys, telemetry, test names, and agent clarity.

Example IDs:

```text
scan.product
menu.scan
mesa.evaluate
cooking.session.stream
bela.order.create
passport.create
```

---

## Brioela Generative UI Policy In Contract

Every endpoint/stream declares whether it may carry Brioela Generative UI.

```typescript
type BrioelaGenerativeUiPolicy =
  | { allowed: false }
  | {
      allowed: true
      mode: "http_optional" | "stream_event"
      surfaces: GenerativeSurface[]
      safetyLock: "always" | "required_when_hard_blocks" | "feature_decides"
    }
```

Example:

```typescript
brioela_generative_ui: {
  allowed: true,
  mode: "http_optional",
  surfaces: ["scan_explanation_brioela_generative_ui"],
  safetyLock: "required_when_hard_blocks",
}
```

Safety endpoint:

```typescript
brioela_generative_ui: { allowed: false }
```

Backend delivery rejects a response with `brioelaGenerativeUi` if the contract says `allowed: false`.

Backend `composeBrioelaGenerativeUiForContract()` rejects a document whose `surface` is not in the endpoint/stream policy.

---

## Query Keys Are Contract-Derived

Do not manually maintain global query keys like:

```typescript
QUERY_KEYS.CARDS.LIST
QUERY_KEYS.MAPS.LOCATION_SEARCH(params)
```

Use contract-derived keys:

```typescript
contractKey(SCAN_CONTRACTS.scanProduct, { body })
contractKey(MAPS_CONTRACTS.locationSearch, { query })
```

Key shape:

```typescript
[contract.id, stableContractInputHash(input)]
```

Feature wrappers are allowed only for readability:

```typescript
export const SCAN_KEYS = {
  product: (body: ScanProductBody) =>
    contractKey(SCAN_CONTRACTS.scanProduct, { body }),
}
```

But the source is still the contract.

---

## Mobile API Calls

No blind generics for new Brioela code.

Do not write:

```typescript
api.get<T>(url)
api.post<T>(url, body)
axios.post(url, body)
```

Write:

```typescript
request(SCAN_CONTRACTS.scanProduct, { body })
```

The response type is inferred from the contract. Runtime data is parsed with the contract.

Axios stays hidden inside `mobile/network/core/request.ts`.

---

## TanStack Query

TanStack Query stays. The query key and request function become contract-backed.

```typescript
export function useLocationSearch(query: LocationSearchQuery) {
  return useQuery({
    queryKey: contractKey(MAPS_CONTRACTS.locationSearch, { query }),
    queryFn: () => request(MAPS_CONTRACTS.locationSearch, { query }),
    enabled: query.query.length > 0,
  })
}
```

For mutations:

```typescript
export function useScanProduct() {
  return useMutation({
    mutationKey: contractKey(SCAN_CONTRACTS.scanProduct),
    mutationFn: (body: ScanProductBody) =>
      request(SCAN_CONTRACTS.scanProduct, { body }),
  })
}
```

Feature-named hooks stay because they are easy for agents and humans to discover.

---

## Backend Send Path

Backend handlers must not return raw `c.json(apiSuccessResponse(...))` for new code.

Use contract-aware helpers:

```typescript
const body = await parseBody(c, SCAN_CONTRACTS.scanProduct)

const scan = await buildScanVerdict(...)
const brioelaGenerativeUi = await composeBrioelaGenerativeUiForContract(SCAN_CONTRACTS.scanProduct, ...)

return send(c, SCAN_CONTRACTS.scanProduct, 200, {
  scan,
  brioelaGenerativeUi,
})
```

`send()` must:

- verify the status exists in `contract.responses`
- parse payload with that response schema
- enforce Brioela Generative UI policy
- wrap with `apiSuccessResponse`
- emit telemetry with `contract.id`

---

## Realtime Contracts

Realtime streams are contracts too.

```typescript
export const COOKING_STREAM_CONTRACT = stream({
  id: "cooking.session.stream",
  auth: "ticket",
  clientEvents: cookingClientEventSchema,
  serverEvents: cookingServerEventSchema,
  brioela_generative_ui: {
    allowed: true,
    mode: "stream_event",
    surfaces: ["cooking_opener_brioela_generative_ui", "recipe_step_focus_brioela_generative_ui"],
    safetyLock: "feature_decides",
  },
})
```

Mobile parses stream messages with the contract:

```typescript
parseMessage: (raw) => {
  const parsed = COOKING_STREAM_CONTRACT.serverEvents.safeParse(raw)
  return parsed.success ? parsed.data : null
}
```

No new realtime code should use a loose `{ type: string; payload?: unknown }` parser.

---

## Enforcement Rules

These should become lint/CI rules when coding starts.

Ban in new code:

- raw `axios` imports outside `mobile/network/core/`
- direct `@ts-rest/core` imports outside `shared/contracts/`
- direct `@ts-rest/serverless/fetch` imports outside backend route-mounting files
- `api.get<T>()`, `api.post<T>()`, `api.patch<T>()`, `api.put<T>()`, `api.del<T>()`
- route strings like `"/v1/` outside `shared/contracts/`
- backend `c.json(apiSuccessResponse(` inside `backend/src/api/` handlers
- manually maintained global query keys for new contract-backed endpoints
- Brioela Generative UI in a response whose contract has `brioela_generative_ui.allowed: false`

Allow temporary exceptions only for legacy copied code with explicit migration notes.

---

## Contract Tests

Every new feature contract gets a small test fixture set:

- valid client input parses
- invalid client input fails
- valid server response parses
- response with wrong Brioela Generative UI surface fails
- response with Brioela Generative UI when `brioela_generative_ui.allowed: false` fails
- contract key is stable for equivalent input

This makes contracts executable and hardens them before mobile/backend code depends on them.

---

## Build Order

1. Implement `shared/contracts/index.ts` exports for `@ts-rest/core`, plus `shared/contracts/contract.ts` helpers: `endpoint`, `stream`, `contractKey`.
2. Implement shared common schemas: API envelope/error and `brioelaGenerativeUiSchema` import from grammar.
3. Write one contract file: `shared/contracts/scan.contract.ts`.
4. Write contract tests for scan.
5. Mount one scan contract with `@ts-rest/serverless/fetch` inside Hono.
6. Add one mobile hook using `@ts-rest/react-query` and `contractKey`.
7. Render with `BrioelaGenerativeUiRenderer document={data.brioelaGenerativeUi} fallback={...}`.

No wider API migration until the first vertical slice works.

---

## One-Line Law

If it crosses a process boundary, it crosses through a contract.
