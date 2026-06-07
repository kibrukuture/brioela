# Session 036 — Generative Grammar Contract And Stage Delivery

## Date

2026-06-07

## Completed This Session

Written:
- `build-guide/27-generative-grammar/20-contracts-and-stage-delivery.md`
- `build-guide/27-generative-grammar/21-contract-spine-hardening.md`
- `build-guide/27-generative-grammar/22-ts-rest-full-stack-standard.md`
- `build-guide/05-orchestrator/07-agent-framework-hardening.md`

Updated:
- `build-guide/27-generative-grammar/00-overview.md`
- `build-guide/05-orchestrator/00-overview.md`
- `_records/connections/24-generative-grammar-connections.md`
- `_records/connections/01-orchestrator-connections.md`
- `_records/build-order/03-layer-orchestrator.md`
- `_records/session-log/036-generative-grammar-contract-delivery.md`

## Decisions Captured

- Generative UI is not static-only. HTTP and realtime features can both carry AI-selected Stages.
- Delivery differs by transport:
  - HTTP features return optional `stage` inside the feature response.
  - Realtime features send `{ type: "stage", stage }` inside the feature stream.
- Normal product flows do not use a standalone grammar route.
- Standalone grammar routes are allowed only for internal preview, catalog QA, fixtures, or design review.
- Feature screens use the preferred render shape:
  `<BrioelaGenerativeUiRenderer document={data.brioelaGenerativeUi} fallback={<StaticScanSecondary scan={data.scan} />} />`
- Backend shape for new Brioela features should avoid pass-through controllers.
- Do not add a `services/` layer by default if the project standard is route + handler + helper.
- Axios can stay as transport, but new code should use contract-aware request helpers instead of blind `api.get<T>()`/`api.post<T>()` generics.
- TanStack Query stays as the query/mutation layer.
- The stricter standard is the Contract Spine: if it crosses a process boundary, it crosses through a contract.
- Routine endpoint schemas stay co-located in the feature contract file by default.
- Separate schema files are allowed only for true cross-feature/domain primitives such as `brioelaGenerativeUiSchema`, API error envelope, or shared food audience.
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
- Generative UI surface names must use lowercase snake_case with the explicit `_brioela_generative_ui` suffix. Example: `scan_explanation_brioela_generative_ui`.
- Code-facing Brioela Generative UI naming is explicit, not poetic:
  - response field: `brioelaGenerativeUi`
  - metadata key: `brioela_generative_ui`
  - renderer: `BrioelaGenerativeUiRenderer`
  - document type: `BrioelaGenerativeUiDocument`
  - schema: `brioelaGenerativeUiSchema`
- The old internal/theatrical `Stage` term is historical only and should not appear in API contracts, response fields, renderer props, or new implementation names.
- Document field names were clarified:
  - `mood` → `emotionalTone`
  - `atmosphere` → `backgroundEffect`
  - `composition` → `layoutTemplate`
  - `slots` → `content`
  - `beats` → `entranceMotion`
  - `voice` → `typographyStyle`
- AI-emitted enum values were also clarified:
  - emotional tones use communication-style names such as `neutral_factual`, `caution_explanatory`, `positive_confirming`, `focused_instructional`
  - background effects end in `_background`, e.g. `neutral_texture_background`, `verdict_color_background`, `mesa_group_background`
  - layout templates end in `_layout`, e.g. `scan_explanation_focus_layout`, `scan_detail_insight_layout`, `recipe_steps_horizontal_layout`
  - entrance motion values end in `_entrance`, e.g. `settle_all_entrance`, `slide_primary_then_details_entrance`
  - typography styles use `typography_*`, e.g. `typography_body`
- Design-system spacing now has a two-layer rule:
  - implementation/design code uses numeric 4pt tokens such as `space.1`, `space.4`, `space.12`
  - Brioela Generative UI documents emit only `space_xs`, `space_sm`, `space_md`, `space_lg`, `space_xl`, `space_2xl`
  - renderer maps ordinal AI tokens to numeric design-system tokens
- Orchestrator hardening added:
  - Brioela remains ambient, not chat-first.
  - Cloudflare Agents SDK owns durable runtime concerns.
  - Vercel AI SDK remains the model/tool-calling layer.
  - Prefer `subAgent`, `agentTool`, `runAgentTool`, `schedule`, `queue`, `runFiber`, `startFiber`, `keepAliveWhile`, and Cloudflare Workflows over older manual runtime plumbing where equivalent.
  - Keep custom Brioela memory schema, safety policy, ambient surfacing, and Gemini Live media bridge.
- Additional architecture decisions captured during doc cleanup:
  - Realtime transport is Cloudflare Realtime / RealtimeKit only; old realtime provider references were removed from Markdown.
  - Image/text extraction wording now uses GPT-4o mini vision extraction with Zod-enforced structured output; old extraction terminology was removed from Markdown.
  - Bela payment model is PaymentIntent manual capture + Stripe Connect Express payout + shopper registered Bela card; older payment model references were updated.
  - Notifications use OneSignal only.
  - Auth uses Supabase Auth only, with Supabase anonymous auth for guest scan identity and account linking.
  - Wearables default to Brioela-owned connectors, not a generic aggregator.
  - Scanner product data now has provenance and correction docs with Open Food Facts, USDA FoodData Central, GS1/Verified by GS1, GPT-4o mini label evidence, and safety correction boundaries.

## Evidence From Repo Audit

- Current repo has shared route constants and shared validators, but method/path/body/query/response are split across files.
- Backend validation is real and common, but response validation is not consistent across every handler.
- Mobile currently trusts generic `api.get<T>()`/`api.post<T>()` responses without runtime response parsing.
- Some copied legacy mobile network files still use raw Axios or `unknown`/`any`; new Brioela code should not follow those.

## What Is Next

Before coding, reconcile older generated UI implementation notes inside `mobile/grammar/`. Then implement one vertical slice: `shared/grammar` `BrioelaGenerativeUiDocument` schema, `shared/contracts/index.ts` re-exporting `@ts-rest/core`, `shared/contracts/contract-key.ts`, one scan contract with co-located endpoint schemas and Brioela Generative UI metadata, a Hono route mounted with `@ts-rest/serverless/fetch`, `mobile/network/tsr.ts`, a feature hook wrapping `tsr.scan.scanProduct.useMutation`, and one mobile render path.
