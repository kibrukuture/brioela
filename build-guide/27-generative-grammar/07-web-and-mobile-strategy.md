# Brioela Generative Grammar — Web And Mobile Strategy

## What This File Covers

How Brioela uses the grammar across React Native and PWA/web, and what external generative UI tools teach us.

---

## Research Findings

Vercel AI SDK:

- `streamUI` streams React Server Components on web, but AI SDK docs mark RSC APIs experimental and recommend AI SDK UI for production.
- AI SDK UI generative interfaces use tool calls and render tool results as components.

CopilotKit:

- supports React Native, but React Native package is headless.
- provides hooks/agent communication, not automatic arbitrary native UI generation.
- generative UI is still tool/component rendering, not safe runtime JSX.
- A2UI is declarative, JSONL, platform-agnostic, and useful as inspiration.

React Native / Expo:

- JSX is compiled into the bundle.
- EAS Update can ship compatible JS updates, but is not a per-user generated UI compiler.
- runtime native compatibility is governed by runtime versions.

---

## Decision

Use a custom Brioela Generative Grammar as the canonical protocol.

Do not use web-only streamed JSX as the core architecture.

---

## React Native

React Native renders grammar documents into compiled components.

Optional future use:

- AG-UI or CopilotKit ideas for event transport
- headless hooks if they fit without lock-in

But the renderer remains Brioela-owned.

---

## PWA/Web

PWA renders the same grammar documents into web components.

Optional:

- AI SDK UI for chat/tool streaming
- `streamUI` only for controlled web experiments, not core mobile parity

The payload remains grammar JSON.

---

## Why Not Separate Web/Mobile Systems

Two systems would drift.

One grammar means:

- same safety rules
- same emotional language
- same validation
- same test fixtures
- mobile-first constraints preserved
- web can still be richer when safe
