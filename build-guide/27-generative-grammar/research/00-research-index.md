# Brioela Generative Grammar — Research Index

## What This Folder Is

Full-text research reports gathered while deciding how to design Brioela's generative UI
system. All research is 2025–2026, sourced with URLs, dates, and version numbers. Nothing
is summarized away — each file holds the complete report verbatim.

This research answers three questions:

1. Can AI-generated UI actually run on React Native / Expo at runtime, and what is legal?
2. What existing frameworks already do server-driven / generative UI, and what to steal?
3. How do you build genuinely beautiful, studio-art-grade expressive UI on Expo?

## Files In This Folder

| File | Contents |
|---|---|
| `01-expo-rsc-dom-runtime.md` | Expo RSC + DOM components runtime state, store compliance, security (CVE-2025-55182) |
| `02-sdui-frameworks.md` | Server-driven UI landscape: DivKit, Airbnb Ghost, Vercel json-render, Rise Tools |
| `03-generative-ui-landscape.md` | Generative UI frameworks: CopilotKit, Vercel AI SDK, Thesys C1, tambo, AG-UI, A2UI, MCP-UI |
| `04-runtime-code-execution.md` | Can AI/server code run at runtime on RN: Hermes eval, Re.Pack, EAS Update, WebView, store rules |
| `05-expressive-artistic-ui.md` | Beautiful expressive UI: Skia 2.6.x, Reanimated 4, Rive/Lottie, kinetic typography, Callie |

## Headline Findings (Cross-File)

- **AI-generated JSX cannot run natively on RN** — Hermes excludes `eval` from support. Physics, not caution.
- **Don't build on Expo RSC** — beta, "not recommended for production," EAS Update incompatible, Dec 2025 unauthenticated RCE.
- **`'use dom'` is the wrong tool** — build-time SPAs, no SSR/SSG, no iframe isolation, slower than Hermes.
- **The safe path is Server-Driven UI** — JSON/data tree → pre-shipped native components. Apple 2.5.2 compliant (data, not code).
- **The CopilotKit-iframe dream works on RN only as a sandboxed WebView** — Google explicitly carves out "JS in a webview."
- **`vercel-labs/json-render`** (Jan 2026, ~13k stars, Apache-2.0) has a first-class RN renderer and is almost exactly the Tier-1 grammar pattern.
- **Beauty stack** — Skia 2.6.x + Reanimated 4.4+ + Rive; reference architecture is *Callie* (2025 Expo "Most Creative").

## Status

[x] complete — five full-text reports saved verbatim.
