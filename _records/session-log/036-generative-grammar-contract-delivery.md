# Session 036 — Generative Grammar Contract And Stage Delivery

## Date

2026-06-07

## Completed This Session

Written:
- `build-guide/27-generative-grammar/20-contracts-and-stage-delivery.md`
- `build-guide/27-generative-grammar/21-contract-spine-hardening.md`
- `build-guide/27-generative-grammar/22-ts-rest-full-stack-standard.md`

Updated:
- `build-guide/27-generative-grammar/00-overview.md`
- `_records/connections/24-generative-grammar-connections.md`
- `_records/session-log/036-generative-grammar-contract-delivery.md`

## Decisions Captured

- Generative UI is not static-only. HTTP and realtime features can both carry AI-selected Stages.
- Delivery differs by transport:
  - HTTP features return optional `stage` inside the feature response.
  - Realtime features send `{ type: "stage", stage }` inside the feature stream.
- Normal product flows do not use a standalone grammar route.
- Standalone grammar routes are allowed only for internal preview, catalog QA, fixtures, or design review.
- Feature screens use the preferred render shape:
  `<GrammarRenderer stage={data.stage} fallback={<StaticScanSecondary scan={data.scan} />} />`
- Backend shape for new Brioela features should avoid pass-through controllers.
- Do not add a `services/` layer by default if the project standard is route + handler + helper.
- Axios can stay as transport, but new code should use contract-aware request helpers instead of blind `api.get<T>()`/`api.post<T>()` generics.
- TanStack Query stays as the query/mutation layer.
- The stricter standard is the Contract Spine: if it crosses a process boundary, it crosses through a contract.
- Routine endpoint schemas stay co-located in the feature contract file by default.
- Separate schema files are allowed only for true cross-feature/domain primitives such as `stageSchema`, API error envelope, or shared food audience.
- Query keys should be contract-derived with `contractKey(contract, input)`, not manually maintained global constants.
- New code should eventually ban raw Axios, blind generic API calls, raw route strings, loose stream event parsers, and direct backend success responses outside contract helpers.
- `@ts-rest/core` follows the shared dependency pattern: it lives in `shared` and is re-exported through `@brioela/shared/contracts`, like Zod is re-exported through `@brioela/shared/zod`.
- Backend and mobile should not import `@ts-rest/core` directly for normal app code.
- New normal HTTP API code should use ts-rest contracts plus `@ts-rest/react-query` feature wrappers.
- Smoke test confirmed `@ts-rest/serverless/fetch` can run inside Hono while preserving request validation, response validation, status responses, and contract metadata.
- Normal contract-backed backend routes should prefer Hono-mounted ts-rest fetch runtime over custom parse/send helper code.
- `mobile/network/tsr.ts` is a tiny initializer only; it must not become an endpoint logic file.
- Normal HTTP endpoints should not need `.api.ts` files; feature hooks wrap generated ts-rest hooks instead.
- Query keys are contract-derived with `contractKey(endpoint, input)`, not manually maintained in a global `QUERY_KEYS` object.

## Evidence From Repo Audit

- Current repo has shared route constants and shared validators, but method/path/body/query/response are split across files.
- Backend validation is real and common, but response validation is not consistent across every handler.
- Mobile currently trusts generic `api.get<T>()`/`api.post<T>()` responses without runtime response parsing.
- Some copied legacy mobile network files still use raw Axios or `unknown`/`any`; new Brioela code should not follow those.

## What Is Next

Before coding, reconcile the older docs that still mention `GenerativeDecision`, `src/design-system`, and `use-stage` inside `mobile/grammar/`. Then implement one vertical slice: `shared/grammar` Stage schema, `shared/contracts/index.ts` re-exporting `@ts-rest/core`, `shared/contracts/contract-key.ts`, one scan contract with co-located endpoint schemas and Stage metadata, a Hono route mounted with `@ts-rest/serverless/fetch`, `mobile/network/tsr.ts`, a feature hook wrapping `tsr.scan.scanProduct.useMutation`, and one mobile render path.
