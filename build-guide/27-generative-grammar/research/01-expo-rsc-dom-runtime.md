# Research — Expo RSC + DOM Components Runtime (Full Text)

> Research agent report, verbatim. Scope: 2025–2026 only. Topic: runtime / server-driven UI
> rendering in Expo / React Native — RSC, DOM components, store compliance.

---

Verification complete. Confirmed: DOM components were introduced in **SDK 52 (Nov 12, 2024)** — the "SDK 55" figure from one fetch was likely a prerequisite-table artifact, the authoritative announcement is SDK 52. Confirmed: DOM components bundle web code at **build time as SPAs (no SSR/SSG)**; loading **remote/runtime web UI requires plain `react-native-webview` with a remote URI**, not the `'use dom'` mechanism — that's the real sandboxed-iframe-like path. I have enough verified facts to synthesize.

---

# Runtime / Server-Driven UI in Expo / React Native — State as of mid-2026

Scope: only 2025–2026 sources retained as current. Older items flagged.

## 1. Expo Router + React Server Components (RSC)

**Claim:** RSC in Expo is **beta/experimental, not stable** — explicitly "experimentally available in SDK 52 and later... a beta release subject to breaking changes."
Source: https://docs.expo.dev/guides/server-components/ — doc modified Apr 28, 2026. Requires SDK 52+ and New Architecture (default since SDK 52).

**Claim:** The original public unveiling was a "developer preview / beta."
Source: https://expo.dev/blog/universal-react-server-components-developer-preview (Expo blog; page body didn't render cleanly on fetch, but title + corroborating sources confirm "Beta / developer preview" wording).

**Claim:** Yes — a server **can render React components and stream an RSC payload to the client, rendered as native views at runtime.** Server Functions "render React components on the server and stream back an RSC payload for rendering on the client." Expo bundles platform-specific server renderers, so `*.ios.js` / `*.native.ts` extensions resolve; the render stream can be streamed incrementally (ChatGPT-style).
Source: https://docs.expo.dev/guides/server-components/ ; https://expo.dev/changelog/sdk-53 (SDK 53 released Apr 30, 2025; RN 0.79, React 19; "React Server Functions support is now in beta... deploy to production with EAS Hosting via `EXPO_UNSTABLE_DEPLOY_SERVER`").

**Claim — constraints/gotchas (RISKY, all from the official guide, Apr 2026):**
- Server-rendering RSC payloads to HTML **not yet supported** → static/SSR output incomplete.
- **EAS Update does not work with Server Components yet.**
- `StyleSheet.create` and `Platform.OS` **unsupported on native** inside RSC.
- Server Functions invoking other Server Functions **not supported on Hermes.**
- No HTML form integration with Server Functions in production.
- "Production deployment is limited and **not recommended yet.**"
- Expo Snack can't bundle Server Components.
Source: https://docs.expo.dev/guides/server-components/

**Claim — SECURITY (CRITICAL, recent):** Four CVEs hit React Server Components in Dec 2025, including **CVE-2025-55182 — unauthenticated remote code execution** (Dec 3, 2025), plus CVE-2025-55183/55184/67779 (DoS + source-code exposure, Dec 11). Affects only apps using experimental RSC/Server Functions; client-only iOS/Android/web apps unaffected.
Patched: SDK 54 → `react-server-dom-webpack@19.1.4`, `expo-router@6.0.19`; SDK 53 → `react-server-dom-webpack@19.0.3`, `expo-router@5.1.10`.
Source: https://expo.dev/changelog/mitigating-critical-security-vulnerability-in-react-server-components (Dec 5, 2025, updated Jan 26, 2026); https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components

**App Store implication:** RSC streams a *data/serialized-tree payload* rendered by pre-shipped native components, not executable native code — the same legal footing as SDUI (see §3). The Expo docs do not call out App Store specifics.

## 2. Expo DOM Components (`'use dom'`)

**Claim:** Introduced in **Expo SDK 52 (Nov 12, 2024)**; minimum SDK 52. (One fetched prereq table said "SDK 55" — that is not the introduction version; the SDK 52 changelog is authoritative.)
Source: https://expo.dev/changelog/2024-11-12-sdk-52 ; https://docs.expo.dev/guides/dom-components/

**Claim — how they work:** Add `'use dom'` to the top of a web-component file; the bundler replaces the module with a runtime proxy and renders it inside a **WKWebView (iOS) / WebView (Android)**; on web it renders as-is. Lets you use web-only libs (recharts, rich text editors, etc.) unmodified.
Source: https://docs.expo.dev/guides/dom-components/ ; SDK 52 changelog.

**Claim — the key answer for your use case (IMPORTANT):** DOM components **bundle web code at build time and render only as single-page apps — "no SSR or SSG."** They are **not** designed to render server- or AI-generated web UI fetched at runtime, and there is **no iframe-style sandbox isolation** ("embedded JS code" without iframe isolation).
Source: https://docs.expo.dev/guides/dom-components/ (fetched Jun 2026)
→ For runtime/remote web UI you instead use plain **`react-native-webview` with a remote `uri`** (an actual WebView, which IS process-isolated like a browser tab). That is the real "sandboxed iframe" path — separate from `'use dom'`.
Source: https://docs.expo.dev/versions/latest/sdk/webview/

**Claim — limits (RISKY):**
- Props/args must be **serializable only** (number, string, boolean, null, undefined, Array, Object); functions only as top-level async "native actions."
- Props cross an **async bridge → not updated synchronously**; native actions always async.
- **Perf:** "DOM components only support standard JavaScript, which is slower to parse and start up than optimized Hermes bytecode." No shared global state across JS engines; deep-linking constraints. Docs explicitly: "use truly native views whenever possible."
- **RSC inside DOM:** "DOM components cannot use React Server Functions in production yet" / Server Functions can't be used inside DOM components.
- **Gestures/accessibility:** no special limits documented beyond standard WebView a11y.
- EAS Update support for DOM components is **experimental** (added in SDK 53).
Source: https://docs.expo.dev/guides/dom-components/ ; https://expo.dev/changelog/sdk-53

## 3. Shipping server-generated UI at runtime without resubmission — store compliance

**Claim:** Pure **Server-Driven UI is allowed** under Apple 2.5.2 because it ships **data describing UI, not executable code** — pre-installed native components render it. This requires no resubmission.
Source: https://kanopylabs.com/blog/backend-driven-ui-mobile-apps ; https://medium.com/@vectoreman67/server-driven-ui-with-react-native-a-comprehensive-guide-45f7d1ae5943

**Claim — exact Apple text (2.5.2):** "Apps should be self-contained in their bundles... nor may they download, install, or execute code which introduces or changes features or functionality of the app." Only carve-out in 2.5.2 itself is **educational coding apps**.
Source: https://developer.apple.com/app-store/review/guidelines/ (live, current)

**Claim — JS bundle OTA (Expo Updates / CodePush) IS permitted, but under the DPLA, not 2.5.2.** Allowance comes from **DPLA §3.3(b)**: interpreted code may be downloaded if it (1) doesn't change the app's primary purpose, (2) doesn't create a store/storefront, (3) doesn't bypass signing/sandbox/security. JS is interpreted code covered by this; the native layer stays audited.
Allowed via OTA: bug fixes, perf, copy/text, assets, UI polish, content. Banned: changing payment/subscription flows, changing core purpose (also trips 2.3.1), native code.
Source: https://bitrise.io/blog/post/what-app-stores-allow-with-ota-updates-apple-and-google-policy-explained (Apr 23, 2026, upd. Apr 28, 2026)

**Claim — Google Play is more explicitly permissive:** Device & Network Abuse policy exempts "code that runs in a virtual machine or an interpreter... such as JavaScript in a webview." RN's sandboxed JS qualifies.
Source: same Bitrise article (Apr 2026).

**Outdated-flag:** Historical CodePush-rejection anecdotes (facebook/react-native#12778; Apple forum threads) are **2017–2021 — treat as outdated**; the current DPLA 3.3(b) position supersedes them.

---

## Bottom line for an Expo app that wants SAFE runtime generative UI

- **Don't build runtime generative UI on Expo RSC yet.** It's beta, "not recommended for production," EAS Update doesn't support it, and it shipped a Dec 2025 *unauthenticated RCE* (CVE-2025-55182). If you touch it, you must be on the patched `expo-router`/`react-server-dom-webpack` (SDK 54: 6.0.19 / 19.1.4).
- **The safe, store-compliant pattern is true Server-Driven UI: server sends a JSON/data tree, your pre-shipped native components render it.** This is allowed under Apple 2.5.2 and needs no resubmission — because no code is executed, only data interpreted.
- **`'use dom'` is the wrong tool for AI/server-generated UI** — it bundles web components at build time as SPAs (no SSR/SSG, no iframe sandbox) and is slower than Hermes. It's for embedding web libraries, not runtime remote UI.
- **For genuinely sandboxed runtime web UI, use `react-native-webview` with a remote URL** (real WebView process isolation). This is the closest to your "iframe" model and is store-legal as long as it doesn't become a code store or change the app's primary purpose (DPLA §3.3(b)).
- **For shipping JS logic/layout changes without resubmission, use EAS Update (OTA).** Permitted under DPLA §3.3(b) and Google's webview/VM carve-out — but keep updates to fixes, content, and UI; never alter purpose, payments, or native code (2.5.2 / 2.3.1).
