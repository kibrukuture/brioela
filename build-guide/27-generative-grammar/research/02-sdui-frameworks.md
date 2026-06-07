# Research — Server-Driven UI / JSON-to-Native Frameworks (Full Text)

> Research agent report, verbatim. Scope: 2025–2026, maintained only. Topic: SDUI and
> JSON-to-native rendering frameworks usable in React Native / Expo.

---

I now have well-sourced, verified findings across all four areas, with a critical, directly-relevant discovery (Vercel json-render). The Rise Tools status is important: it's explicitly "do not use this yet" / WIP — that's the honest maintained-but-not-production status. I have enough to synthesize. Compiling the report.

---

# Server-Driven UI / JSON-to-Native Landscape (2025–2026)

Scope note: dates verified against current date June 2026. Where a GitHub release showed "01 Jun" with no year, that is GitHub's convention for the current year (2026). Findings flagged with maintenance status.

## 1. Yandex DivKit

- **Production-grade and actively maintained in 2026** — latest release v32.52.0, June 1, 2026; ~188–192 releases, ~4,900 commits, 2.6k stars, releases shipping every 1–2 weeks. — https://github.com/divkit/divkit/releases (Jun 1, 2026; v32.52.0)
- **Renders natively on Android, iOS, and Web** from a single JSON layout; positioned as embeddable "as a simple view" inside an existing app, not a full app framework. — https://github.com/divkit/divkit ; https://divkit.tech/en/ (accessed Jun 2026)
- **No official React Native support.** The RN question (issue #1, opened Aug 26 2022) has no official resolution; no RN renderer or wrapper exists. RN teams would have to embed the native iOS/Android views or reimplement the spec. — https://github.com/divkit/divkit/issues/1 (issue open since Aug 2022, unresolved)
- **Expressive beyond a generic JSON renderer:** has a real expression language (functions like `alphaBlend`, dictionary serialization, operator precedence), variables + triggers (toggle many elements' state at once, e.g. dark theme), timers/timed actions, and stored values scoped by `cardId`. — https://github.com/divkit/divkit/releases (2025–2026 release notes)
- **Component set:** text, image, input, button, gallery (incl. infinite gallery via "patches"), tabs, pager, plus container layout and customizable per-element properties. — https://divkit.tech/en/ (accessed Jun 2026)
- **Animation support:** click/move/appear/disappear animations, transition animations on `wrap_content` views, Lottie integration (with corrected `repeat_count` semantics), gradient rendering fixes. — https://github.com/divkit/divkit/releases (2025–2026)
- Flag / gap: official docs are thin on the precise container model (linear/grid/overlap/wrap sizing) in English; verify container semantics directly in the schema before relying on it.

## 2. Airbnb Ghost Platform (SDUI)

- **Core model: "Sections" (reusable, self-contained data+UI primitives) arranged by "Screens" via an `ILayout` interface** — decouples business logic from layout. — https://medium.com/airbnb-engineering/a-deep-dive-into-airbnbs-server-driven-ui-system (Jun 29, 2021)
- **Safety mechanism: one shared, strongly-typed GraphQL schema generates native models for Web (TS), iOS (Swift), Android (Kotlin)** — same contract, native rendering per platform, no data-format divergence. — same source (2021)
- **Flexibility mechanism: `SectionComponentType`** lets one data model render as multiple visual variants (e.g. `TITLE` vs `PLUS_TITLE`) without new data models. Actions routed through an `IAction` interface to feature-scoped handlers. — same source (2021)
- **Scaling learnings (later, 2025 summary): operation registries + deferred responses + UI pagination** to fight payload bloat (load above-the-fold first). — https://medium.com/@aubreyhaskett/...-airbnb-netflix-and-lyft... (Dec 8, 2025)
- Flag: the canonical deep-dive is 2021. Treat architecture as proven but not "latest"; the 2025 secondary article is the freshest synthesis of their scaling patterns.

## 3. Other companies' learnings (Netflix, Lyft, Yelp, Shopify, Meta)

- **Netflix deliberately limited SDUI scope** — used it only for notifications/interstitials (UMA: Universal Messaging Alerts) via JSON, NOT for core browsing; some screens are better as dedicated native. — https://medium.com/@aubreyhaskett/... (Dec 8, 2025)
- **Lyft Canvas chose Protocol Buffers over GraphQL** for ~40–60% payload reduction and stronger versioning; clients send a version header, server returns a version-appropriate response. Cut build-to-rollout to 1–2 days. — same source (Dec 8, 2025)
- **Yelp (CHAOS) went hybrid: GraphQL as the outer "envelope" for high-level structure, REST-like JSON blobs for individual components/actions** — because "maintaining explicit GraphQL types for hundreds of components was impractical." Uses versioned type strings like `"chaos.button.v1"`. — https://www.weweb.io/blog/server-driven-ui-guide-architecture-examples (Mar 20, 2026); corroborated by https://www.apollographql.com/docs/technotes/TN0033-sdui-schema-design/
- **Shopify** uses SDUI for dynamic merchant store layouts; **Meta/Instagram** for instant experiment rollout. — https://www.weweb.io/blog/... (Mar 20, 2026)

## 4. Maintained React Native SDUI / JSON-to-native libraries

- **Vercel json-render — the most directly relevant and clearly current option.** Open-sourced by vercel-labs, Apache 2.0, launched Jan 2026, ~13k stars, ~200 releases. **Has a first-class React Native renderer** (also React, Vue, Svelte, Solid, plus PDF/email/Remotion/OG/R3F). — https://github.com/vercel-labs/json-render ; https://www.infoq.com/news/2026/03/vercel-json-render/ (Mar 26, 2026)
  - Design: developer defines a **catalog of allowed components/actions as Zod schemas**; an LLM emits JSON **constrained to that catalog**; the `Renderer` maps JSON → native components and **renders progressively as the model streams**. Ships 36 shadcn/ui components for web. Same catalog/spec format across React and React Native. — same sources + https://json-render.dev/
  - Stated limitation: "tightly coupled to a specific application's component set" (a deliberate safety choice, vs an open protocol like Google's A2UI). — InfoQ (Mar 26, 2026)
- **Rise Tools (rise.tools, by Eric Vicenti) — maintained but explicitly NOT production-ready.** README states: "This repo is a WORK IN PROGRESS. Please, do not use this yet!" 269 stars, ~306 commits, not archived. Model: components authored server-side in TS/TSX, synced to client over WebSocket, rendered via `@rise-tools/react` + registered local component libraries; supports hot updates without rebuilds. — https://github.com/rise-tools/rise-tools (accessed Jun 2026)
- **`react-native-sdui` (npm) — ABANDONED.** Latest 1.0.7, last published ~6 years ago; no dependents. — npm/libraries.io (accessed Jun 2026)
- **`@rn-sdui` and `react-native-server-driven-ui` — no real maintained package found** under those exact names. The named packages from your prompt do not exist as live RN libraries. — npm search (accessed Jun 2026)
- **Apollo "SDUI Schema Design" technote — maintained reference (not a library)** for GraphQL-based SDUI: polymorphic `UIComponent`/`UILayout` interfaces, recursive `content: [UIComponent]` composition, `@tag`+contracts to strip platform-irrelevant components, enum-driven device routing. — https://www.apollographql.com/docs/technotes/TN0033-sdui-schema-design/ (accessed 2025/2026)
- Note: **DivKit is the strongest mature engine but not RN-native; Vercel json-render is the strongest RN-native + AI-emitting-JSON match.**

## Expressiveness vs safety — how the good ones avoid generic/ugly while staying constrained

- **Two-model spectrum, and the mature players pick hybrid:** explicit typed model (safe, but a schema change per component — Yelp found this impractical at hundreds of components) vs generic descriptor with versioned type strings (`chaos.button.v1`). Hybrid = typed envelope + JSON component blobs. — weweb (Mar 20, 2026); Apollo technote
- **Styling/typography is deferred to the client, keyed by semantic names** (`label`, `icon`, `title`), and **variant enums** (`SectionComponentType`, DivKit theme variables) drive "render the same data three ways" — this is how they get rich, on-brand UI from constrained JSON instead of inline CSS. — Airbnb (2021); Apollo technote
- **Recursive layout primitives** (`UILayout.content: [UIComponent]`, DivKit containers) let the server compose arbitrary trees from a small fixed vocabulary the client must support — expressiveness without unbounded schema. — Apollo technote; DivKit
- **Versioning is a first-class safety lever:** Lyft's client-version header → version-appropriate response; Yelp's versioned type strings; forward/backward compatibility as a hard requirement. — aubreyhaskett (Dec 2025); weweb (Mar 2026)
- **Heavy animation / deep client logic / pixel-perfect / perf-sensitive surfaces (camera, maps, AR, editors) are explicitly OUT of scope** for SDUI in every serious account — Netflix even excludes core browsing. Plan native escape hatches. — aubreyhaskett (Dec 2025); multiple

## What a custom typed UI-grammar system should steal

1. **Catalog-constrained generation, Zod-typed (steal from Vercel json-render).** AI/server emits JSON that can ONLY reference components you registered; the renderer maps JSON → compiled native components. This is the exact pattern for your use case, already proven at 13k-star scale with an RN renderer — study it before building from scratch.
2. **Variant enums + client-owned styling, not inline styles (steal from Airbnb + DivKit).** Ship semantic data + a `componentType`/theme-variable variant, let the native client own typography/spacing/animation. This is how you avoid the generic/ugly look while keeping the JSON tiny and safe.
3. **A real expression + variable/trigger layer, not static JSON (steal from DivKit).** Variables, triggers, timers and an expression language let one payload drive interactive state (toggles, conditional reveal) without a round-trip — the difference between an "expressive grammar" and a dumb template.
4. **Hybrid envelope: typed structure outside, flexible component blobs inside, with versioned type tags (steal from Yelp/Lyft).** Don't make every new component a breaking schema change; version component types (`x.button.v1`) and gate by a client version header for forward/backward compatibility.
5. **Define explicit escape hatches and out-of-scope surfaces up front (steal from Netflix/Airbnb).** Heavy animation, maps/camera/AR, editors, and pixel-perfect one-offs should render via native components your grammar can *reference but not describe* — decide the boundary deliberately instead of stretching the grammar until it's ugly and slow.

Two flags on freshness: Airbnb's primary deep-dive is 2021 (architecture still cited as canonical in 2025–2026, but verify any specifics against newer talks); and DivKit's English docs are vague on the exact container/sizing model — confirm against the JSON schema before depending on it.
