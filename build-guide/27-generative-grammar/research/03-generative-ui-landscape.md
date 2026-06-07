# Research — Generative UI Framework Landscape (Full Text)

> Research agent report, verbatim. Scope: 2025–2026 only. Topic: generative UI
> frameworks/protocols where an AI generates UI at runtime — rendering substrate, RN support,
> and safety.

---

Both contested claims are now resolved with authoritative sources. CopilotKit does support sandboxed-iframe raw-HTML generation (via `widgetRenderer`/`useComponent`), as one of a spectrum of patterns. MCP Apps is confirmed as Nov 21, 2025, sandboxed iframe, HTML-only, proposal stage. I have enough verified facts to synthesize.

---

# Generative UI Landscape (2025–2026): Rendering Substrates, React Native, and Safety

Each finding: claim — source URL — date — version/status. "Rendering mechanism" is called out explicitly per tool.

## 1. CopilotKit

- CopilotKit supports a **spectrum of rendering mechanisms**, not one: (a) registered React components bound to tool lifecycles, (b) declarative JSON specs (A2UI / Open-JSON-UI), and (c) open-ended raw HTML/SVG run in a sandboxed iframe. — https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026 — Jan 29, 2026 — current.
- **Registered-component path** (the default/safe one): `useFrontendTool` / `useComponent` registers a React component with a Zod schema; CopilotKit exposes it to the agent as a tool, validates the LLM's args with Zod, then renders *your* component inline with typed props. The agent cannot invent UI. — https://docs.copilotkit.ai/strands/generative-ui/tool-based — current.
- **Sandboxed-iframe path exists and is real**: a `widgetRenderer` component "Renders interactive HTML/SVG visualizations in a sandboxed iframe… agent generates HTML/SVG visuals rendered in sandboxed iframes, no MCP server needed." This is the open-ended end of the spectrum. — https://github.com/CopilotKit/generative-ui — current. (Note: the Jan 2026 blog downplays iframes; the official examples repo confirms `widgetRenderer` does use a sandboxed iframe. Reconciled: iframe is one supported pattern, positioned as the "fully open-ended" extreme.)
- CopilotKit are the **makers of the AG-UI protocol**; their examples repo covers AG-UI (controlled React components), A2UI/Open-JSON-UI (declarative JSON), MCP Apps (server-driven), and custom HTML-in-iframe. — https://github.com/CopilotKit/CopilotKit and https://github.com/CopilotKit/generative-ui — current.
- **React Native: headless.** `@copilotkit/react-native` "is headless — it provides hooks, not UI components." Re-exports `useAgent`, `useFrontendTool`, `useHumanInTheLoop`, `useCopilotKit` from react-core; you build the chat UI with RN components. Requires RN 0.70+, Node 20+, polyfills (Hermes lacks Web APIs). — https://docs.copilotkit.ai/react-native — current.
- **RN gained v2 component suite (May 2026):** `@copilotkit/react-native` reached "full v2 API parity" and now ships a v2 chat-component suite (headless `CopilotChat`, `CopilotPopup` FAB, `CopilotModal`, `CopilotSidebar`) plus a `useAttachments` hook (expo-document-picker/expo-file-system). — https://github.com/CopilotKit/CopilotKit/releases — May 2026 — v2.
- Native RN support was a community feature request (Issue #3125), indicating it matured over 2025→2026 rather than being original. — https://github.com/CopilotKit/CopilotKit/issues/3125 — 2025–2026.

## 2. Vercel AI SDK

- **AI SDK RSC (`streamUI`) is experimental and development is paused; Vercel recommends AI SDK UI for production.** Exact doc text: "AI SDK RSC is currently experimental. We recommend using AI SDK UI for production." A migration guide (RSC → UI) is provided. — https://ai-sdk.dev/docs/ai-sdk-rsc — current, AI SDK v6 (latest).
- **Rendering mechanism — RSC path:** `streamUI` streams actual React Server Components from a server action to the client. This is the streamed-RSC substrate. Marked experimental, not for production. — https://ai-sdk.dev/docs/reference/ai-sdk-rsc/stream-ui — current.
- **Rendering mechanism — recommended path ("AI SDK UI"):** client hooks (`useChat` + tool calls, or `streamObject`/`useObject`) where the model emits tool calls / structured objects and *you* render registered React components client-side. This is the registered-component substrate Vercel endorses for prod. — https://github.com/vercel/ai/discussions/2162 — current.
- The generative-UI capability was introduced in **AI SDK 3.0** (the original `streamUI` launch); RSC helpers were later deprecated through 4.x in favor of `useChat`. — https://vercel.com/blog/ai-sdk-3-generative-ui — 2024 launch; deprecation/pause is the 2025–2026 status.

## 3. "AI generates a UI spec, SDK renders it" products (Thesys C1, tambo)

- **Thesys C1 — JSON/DSL-spec → React components (constrained library).** The API returns a structured UI specification ("C1 DSL"), an XML-like string with `<thinking>`, `<content>`, `<artifact>` tags; the React SDK's `<C1Component>` / `<C1Chat>` renders it into interactive components matching your design system, streaming partial output. Renders to a **defined component library**, not arbitrary code. — https://docs.thesys.dev/guides/how-c1-works and https://www.thesys.dev/blogs/generative-ui-architecture — current (no version stated in docs).
- C1 markets itself as "the first Generative UI API," sitting on top of any LLM and returning "live, adaptive interfaces instead of raw text… across form factors." — https://www.thesys.dev/ — current.
- **tambo — registered React components + Zod schemas → streamed props (constrained).** You register components with Zod schemas; the schemas become LLM tool definitions; the model picks one, tambo validates the structured output against the schema and streams props into your React component. Two kinds: Generative (render-once) and Interactable (stateful). Same substrate as CopilotKit's safe path: registered components, never arbitrary UI. — https://docs.tambo.co/concepts/generative-interfaces/generative-components and https://github.com/tambo-ai/tambo — current.
- **tambo reached 1.0** after ~a year of development; React-only SDK. — https://news.ycombinator.com/item?id=46966182 — 2026 — v1.0.

## 4. Declarative agent-to-UI protocols (AG-UI, Google A2UI, MCP-UI / MCP Apps)

- **AG-UI = transport, not a UI spec.** Event-based, bi-directional runtime that streams agent state (messages, tool calls, state patches, lifecycle signals) between backend and frontend. It carries UI instructions (from A2UI, Open-JSON-UI, MCP-UI, or custom) but does not define them. Maintained by CopilotKit. — https://docs.ag-ui.com/introduction and https://www.copilotkit.ai/blog/ag-ui-and-a2ui-explained-how-the-emerging-agentic-stack-fits-together — Dec 15, 2025 — operational.
- **Google A2UI = declarative generative-UI spec, streaming JSON, platform-agnostic.** Message types: `createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`; references a `catalogId` (e.g. `basic_catalog.json`). Renders via **platform-specific native renderers**: Lit and Angular for web, Flutter (GenUI SDK) for mobile/desktop/web — i.e., **JSON → native components, not a webview.** — https://medium.com/google-cloud/agent-to-ui-protocol-a2ui-with-agent-development-kit-adk-de52e67f800d — Mar 30, 2026 — **v0.9 (still evolving)**.
- A2UI integrates with Google's Agent Development Kit (ADK) and is transport-agnostic ("any mechanism that can deliver JSON messages works"). — https://atamel.dev/posts/2026/03-30_a2ui_with_adk/ — Mar 30, 2026 — v0.9.
- **MCP-UI = sandboxed-iframe / remote-DOM rendering.** Three content types: `text/html` (inline HTML in a sandboxed iframe via `srcDoc`), `text/uri-list` (URL rendered in an iframe), and `application/vnd.mcp-ui.remote-dom` (a script runs in a Web Worker inside an iframe; DOM mutations are sent as JSON messages that `<RemoteDOMResourceRenderer>` translates into a host React tree). **Remote code always runs in a sandboxed iframe.** — https://mcpui.dev/guide/client/remote-dom-resource.html and https://workos.com/blog/mcp-ui-a-technical-deep-dive-into-interactive-agent-interfaces — current.
- **MCP Apps (SEP-1865) = the official MCP standardization of this.** Co-authored by Anthropic, OpenAI, and the MCP-UI maintainers (Ido Salomon, Liad Yosef). Starts with `text/html` only, rendered in **sandboxed iframes**; UI↔host comms over MCP JSON-RPC; defense-in-depth: iframe sandboxing, predeclared templates, auditable JSON-RPC messages, user consent for UI-initiated tool calls. — https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/ and https://modelcontextprotocol.io/community/seps/1865-mcp-apps-interactive-user-interfaces-for-mcp — Nov 21, 2025 — **proposal stage**, early-access SDK.
- **Stack layering** (consensus framing): A2A (agent↔agent) → MCP (tools) → AG-UI (runtime/transport) → A2UI/MCP-UI (the UI spec). — https://www.copilotkit.ai/blog/ag-ui-and-a2ui-explained-how-the-emerging-agentic-stack-fits-together — Dec 15, 2025.

## 5. AI generates HTML/CSS/JS → sandboxed iframe (Artifacts, Canvas, v0)

- **Claude Artifacts = full-site-isolated sandboxed iframe + strict CSP.** Anthropic uses "iFrame sandboxes with full-site process isolation" to protect the main Claude.ai session; CSP enforces limited/controlled network access. Artifacts cannot call external APIs, hit databases, access local files, or persist between sessions — "Nothing Claude generates in the Artifacts panel can reach outside of it." — https://www.mindstudio.ai/blog/what-is-claude-interactive-visualization-generative-ui — 2026.
- **Live Artifacts (May 2026)** extended Artifacts with MCP connectors so they can pull real-time data from Notion/Slack/Google Sheets/Gmail — narrowing the "no external data" limitation under controlled connectors. — https://simonwillison.net/tags/claude-artifacts/ — May 2026.
- **ChatGPT Canvas is NOT this pattern**: it is a collaborative document/code editor; it does **not render live HTML previews, React, or SVG**, and has no embed. So Canvas is not a generative-UI/iframe substrate. — https://xsoneconsultants.com/blog/chatgpt-canvas-vs-claude-artifacts/ — 2026.
- **No React Native equivalent of the browser sandboxed-iframe exists.** The entire "AI generates HTML/JS run in a sandbox" pattern (Artifacts, Canvas, v0, MCP-UI, MCP Apps, CopilotKit `widgetRenderer`) is **browser/iframe-bound**. On RN, the only comparable substrate is a WebView (not a true full-site-isolation iframe), and all the native-targeting generative-UI products (CopilotKit RN, A2UI/Flutter, tambo, C1) take the **JSON-spec → native-component** route instead. — synthesized from https://docs.copilotkit.ai/react-native (headless, no iframe), https://mcpui.dev/guide/client/resource-renderer (iframe-based), https://medium.com/google-cloud/agent-to-ui-protocol-a2ui-with-agent-development-kit-adk-de52e67f800d (native renderers).

---

## Rendering-mechanism cheat sheet

| Product/Protocol | Substrate | Arbitrary UI? | Native/RN? |
|---|---|---|---|
| CopilotKit (default) | Registered React components from tool calls (Zod-validated) | No | RN headless; v2 components May 2026 |
| CopilotKit `widgetRenderer` | Sandboxed iframe (raw HTML/SVG) | Yes | Browser only |
| Vercel AI SDK UI (recommended) | Registered components via tool calls / `useObject` | No | Works in RN via hooks |
| Vercel `streamUI` (RSC) | Streamed React Server Components | Within registered comps | No (server/web only); paused/experimental |
| Thesys C1 | JSON/XML-like DSL → fixed React component library | No (constrained) | "across form factors," React SDK |
| tambo | Registered React components + Zod → streamed props | No (constrained) | React (web-first) |
| AG-UI | Event transport (carries any UI spec) | n/a | Platform-agnostic |
| Google A2UI | Streaming JSON → native renderers (Lit/Angular/Flutter) | Constrained by catalog | **Yes — Flutter mobile**, v0.9 |
| MCP-UI / MCP Apps | Sandboxed iframe (HTML / remote-DOM) | Yes (HTML) | Browser/iframe only; MCP Apps = proposal Nov 2025 |
| Claude Artifacts | Sandboxed iframe + full-site isolation + CSP | Yes | Browser only |

---

## What this teaches a mobile-first app that wants BOTH a safe grammar AND occasional full generative mini-app moments

- **Make "safe grammar" the default substrate: registered native components selected via Zod-validated tool calls.** This is the convergent industry pattern (CopilotKit default, tambo, Vercel AI SDK UI, Thesys C1's fixed library). The model picks from a constrained catalog and streams typed props — it can never invent unvalidated UI, which is exactly what you want on a phone where you control the design system. Source basis: tambo/CopilotKit/Thesys above.

- **Use a JSON UI-spec → native renderer for richer-but-still-safe layouts, and copy A2UI's `catalogId` idea.** A2UI proves a phone can render agent-driven UI as real native widgets (Flutter) from streaming JSON, with a versioned component catalog bounding what's allowed (v0.9). A bounded catalog is the security boundary; native rendering keeps it fast and on-brand. Caveat: A2UI is v0.9 and still evolving — adopt the *pattern*, don't bet production on the spec yet.

- **For the rare full generative mini-app moment, the only safe substrate is a sandboxed container — and on mobile that means a WebView, not a native render.** Every "arbitrary HTML/JS" system (Artifacts, MCP-UI, MCP Apps, CopilotKit `widgetRenderer`) relies on iframe sandboxing + CSP + no-network isolation. There is no native-RN equivalent of full-site-isolated iframes, so quarantine these moments inside a locked-down WebView with no API/storage/network access, mirroring Artifacts' "nothing can reach outside it."

- **Separate transport from UI spec the way the agent stack already does (AG-UI vs A2UI/MCP-UI).** Stream agent state/events over one channel; let the UI description ride on top in whichever format the moment needs — constrained JSON for everyday surfaces, sandboxed HTML for the mini-app. This lets you mix safe-grammar and generative moments over a single connection instead of two architectures.

- **Don't build on paused/experimental rendering substrates.** Vercel explicitly pauses RSC `streamUI` and points production to registered-component hooks; MCP Apps is a Nov 2025 proposal; A2UI is v0.9. The production-safe, mobile-viable choice today is registered native components + Zod validation, with sandboxed-WebView mini-apps as a deliberately fenced-off escape hatch — not RSC streaming or any spec still pre-1.0.
