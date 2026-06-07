# Research — Runtime Code Execution on React Native (Full Text)

> Research agent report, verbatim. Scope: 2025–2026 only. Topic: executing AI/server-generated
> code (JSX, JS, or a UI bundle) at runtime inside React Native / Expo — what's possible,
> performant, and what Apple/Google allow.

---

I now have all primary sources verified with exact wording. I have enough to synthesize a confident, well-cited report. Let me compile.

---

# Runtime Code Execution in React Native / Expo — 2025-2026 Reality

Scope note: All findings below are dated 2025-2026 or pulled from current (still-live) primary docs. Outdated items are flagged explicitly.

---

## 1. Can Hermes (or JSC) eval / interpret runtime-generated JS/JSX?

**Hermes ships with `eval()` effectively disabled — "local mode eval" (the useful kind) is officially excluded from support.** Verbatim from Hermes' own feature matrix, under "Excluded From Support": *"Local mode `eval()` (use and introduce local variables)."* So a string of generated JS cannot be compiled into the running scope.
Source: https://github.com/facebook/hermes/blob/main/doc/Features.md (live, main branch) — Hermes default engine.

**Hermes is the default and bundled engine in React Native 0.85 (2026); no eval config exists.** Verbatim: *"Hermes is used by default by React Native and no additional configuration is required."*
Source: https://reactnative.dev/docs/hermes (RN 0.85, 2026).

**The Hermes Function() constructor / dynamic compilation path is similarly not a supported runtime-codegen mechanism** — community confirmed engines like Hermes (and QuickJS) cannot access local variables from eval; HostFunctions support `[[Call]]` not `[[Construct]]`.
Sources: https://github.com/facebook/hermes/issues/957 ; https://github.com/facebook/hermes/issues/524 (open issues, still unresolved).

**Escape hatch: JavaScriptCore.** You can opt out of Hermes back to JSC (community package), and JSC *does* support `eval`. But this is a technical capability, not a compliance one (see §3) — and it's slower/heavier, the reason Hermes exists.
Source: https://reactnative.dev/docs/hermes (RN 0.85) → react-native-community/javascriptcore.

> **Verdict (technical):** Generating raw JS/JSX strings and `eval`-ing them at runtime on the default engine (Hermes) is **effectively not possible**. The realistic interpret-a-tree path is JSON/AST → your own renderer (see §5), not string eval.

---

## 2. Runtime component/code delivery: Re.Pack / Module Federation & Expo EAS Update

**Re.Pack v5 (current) can split bundles into chunks and download JS / Hermes-bytecode on-demand via Module Federation v2 — but ONLY JavaScript, never native.** Verbatim limits: *"You must use the same React, React Native and native dependencies versions across all MFEs"*; *"All native modules need to be available in the host application (the one that is released to app stores)"*; *"You can only dynamically load JavaScript code from a microfrontend."*
Source: https://re-pack.dev/docs/getting-started/microfrontends (Re.Pack v5, current).

**Re.Pack's docs explicitly acknowledge store risk** — *"platform constraints and app store rules that typically prevent loading any compiled code"* and direct you to check store T&Cs (same caveats as code splitting). It does NOT claim compliance for shipping arbitrary new feature code.
Source: https://re-pack.dev/docs/getting-started/microfrontends (current).

**EAS Update / OTA can ship the non-native layer only: JS, styling, image assets. Neither Apple nor Google permits native code OTA.**
Source: https://docs.expo.dev/eas-update/introduction/ + https://bitrise.io/blog/post/what-app-stores-allow-with-ota-updates-apple-and-google-policy-explained (updated Apr 28, 2026).

**Shipping new JS components OTA is allowed only if it does not change the app's primary purpose.** Apple's functional test (DPLA §3.3(b)): interpreted-code OTA is allowed when it *"does not change the primary purpose of the Application,"* *"does not create a store or storefront for other code,"* and *"does not bypass signing, sandbox, or other security features."* Allowed: bug fixes, asset/content updates, minor UI. Disallowed: new core features, payment-flow changes, native changes.
Source: https://bitrise.io/blog/.../ota-... (Apr 28, 2026).

**Why CodePush/EAS-style JS OTA survives where native hot-patching died:** RN JS *"only calls into a set of native calls that have been audited and reviewed"*; Apple killed Rollout.io (2017) for patching compiled Obj-C runtime, but JS OTA was unaffected.
Source: https://bitrise.io/blog/.../ota-... (Apr 28, 2026). *(2017 enforcement event, cited as precedent — still the governing precedent.)*

> **Verdict:** Re.Pack/Module Federation and EAS Update are **possible & compliant for JS-only delivery that stays within the app's existing primary purpose**; **store-risky → effectively banned** the moment OTA-delivered code introduces genuinely new features or a storefront for other code.

---

## 3. Apple Guideline 2.5.2 & Google Play — exact current wording (2026)

**Apple App Store Review Guideline 2.5.2 (verbatim, current live page):** *"Apps should be self-contained in their bundles, and may not read or write data outside the designated container area, nor may they download, install, or execute code which introduces or changes features or functionality of the app, including other apps. Educational apps designed to teach, develop, or allow students to test executable code may, in limited circumstances, download code provided that such code is not used for other purposes. Such apps must make the source code provided by the app completely viewable and editable by the user."*
Source: https://developer.apple.com/app-store/review/guidelines/ (current).

**Apple interpreted-code rule (the bundled-interpreter principle):** interpreted code is allowed *only* if all scripts, code, and interpreters are **packaged in the app and not downloaded** — except the narrow educational/scripting exception above.
Source: https://saagarjha.com/blog/2020/11/08/fixing-section-2-5-2/ (2020 analysis — *flagged as older*, but the bundled-interpreter principle still matches current 2.5.2 wording above).

**Google Play — Device and Network Abuse policy (effective Jan 28, 2026), verbatim carve-out:** an app *"may not download executable code (such as dex, JAR, .so files) from a source other than Google Play. **However, this restriction does not apply to code that runs in a virtual machine or an interpreter where either provides indirect access to Android APIs (such as JavaScript in a webview or browser).**"* Plus: interpreted languages (JS/Python/Lua) loaded at runtime *"must not allow potential violations of Google Play policies."*
Source: https://support.google.com/googleplay/android-developer/answer/9888379 (effective Jan 28, 2026).

> **Verdict:** Apple = **stricter**: downloaded executable code that changes features is **banned**; bundled interpreters and primary-purpose-preserving interpreted content are allowed. Google = **more permissive**: downloaded native binaries banned, but **interpreted code in a VM/interpreter (esp. JS in a WebView) is explicitly carved out as allowed**.

---

## 4. WebView-based execution (react-native-webview) of generated HTML/JS

**react-native-webview (current v13.x) is the cleanest compliant path to run generated UI/mini-apps, because Google explicitly names "JavaScript in a webview" as the allowed carve-out and Apple permits web content.**
Sources: https://github.com/react-native-webview/react-native-webview (current) ; Google carve-out above (Jan 28, 2026).

**Security model is the catch — WebViews are a real attack surface.** Snyk/community guidance: a single insecure iframe → cookie theft/phishing/XSS; `onMessage`/`postMessage` *do not let you specify an origin*, enabling XSS if an unexpected document loads. Mitigations: sanitize generated HTML (e.g. safe-html) before injecting, set `javaScriptEnabled={false}` for static content, never load untrusted pages in the embedded WebView, restrict `originWhitelist`.
Sources: https://security.snyk.io/package/npm/react-native-webview ; RN official security doc https://reactnative.dev/docs/security (current).

**Native bridge:** the only channel between generated WebView JS and native is the explicit, app-audited `postMessage`/`injectedJavaScript` bridge — generated code cannot reach native APIs except through what you expose. This is exactly why it's compliant (matches the "indirect access via interpreter" carve-out).

> **Verdict:** Running generated HTML/JS in a sandboxed WebView is **possible & compliant on both stores** — the single best-supported "run AI-generated UI/mini-apps at runtime" path on RN — provided you sanitize input, lock down the bridge, and the content stays within the app's stated purpose.

---

## 5. 2025-2026 RN runtime UI interpreters (JSON/AST → views, restricted DSL)

These take **data (JSON/AST), not executable code**, and map it onto pre-bundled native components — the compliant pattern, since the interpreter and all components ship in the binary.

- **Rise Tools** (`rise-tools/rise-tools`) — "Server Defined Rendering for React Native"; server sends a JSON UI spec, client interprets it into real native RN components; updates live without rebuild. Works with Expo.
Source: https://github.com/rise-tools/rise-tools ; https://rise.tools/docs/getting-started (active 2025).
- **json-render** (`vercel-labs/json-render`) — generative-UI framework; data-driven props, `$cond/$then/$else`, template interpolation, computed props from JSON.
Source: https://github.com/vercel-labs/json-render ; https://json-render.dev/ (2025-2026).
- **Server-Driven UI pattern generally** — server emits JSON, client maps to bundled components; production precedent (e.g. Swiggy) for layout/campaign changes with no app update.
Source: https://github.com/topics/server-driven-ui ; https://revopush.org/react-native-ota-and-server-driven-ui (2025).
- **react-native-reanimated worklets** — relevant boundary case: worklets are **workletized at build time by a Babel plugin** into serializable objects, NOT compiled from strings at runtime. So this is not a runtime-eval mechanism.
Source: https://docs.swmansion.com/react-native-reanimated/docs/guides/worklets/ (current).

> **Verdict:** JSON/AST-driven UI interpreters are **possible & compliant** — they ship code in the binary and stream *data*, not executable code. This is the sanctioned way to do "AI/server-generated UI at runtime" natively (vs WebView).

---

## What is actually safe to do at runtime on RN in 2026 (5 bullets)

- **Stream JSON/AST UI specs into pre-bundled native components** (Rise Tools, json-render, generic SDUI). The interpreter + all components live in the binary; you send *data*, not code. Fully compliant both stores.
- **Run AI-generated HTML/JS inside a sandboxed react-native-webview**, sanitized, JS-bridge locked down (`originWhitelist`, explicit `postMessage`). Google explicitly carves this out; Apple permits web content. This is the only realistic way to run truly generated *code* at runtime.
- **OTA-update your JS bundle (EAS Update / CodePush / Re.Pack MF) only for fixes, content, assets, and features within the app's existing primary purpose.** Allowed; the moment it introduces a new core feature or a storefront-for-code, it crosses into banned territory.
- **Do NOT `eval`/`new Function` generated JS strings on Hermes** — local eval is excluded from Hermes support and it's the default engine; switching to JSC to regain eval is a compliance footgun (2.5.2 still bans downloaded code that changes functionality), not a real fix.
- **Treat Apple as the binding constraint, not Google.** Google's interpreter/WebView carve-out is generous; Apple's 2.5.2 "may not download/execute code which introduces or changes features" is the wall. Keep generated content interpreted, sandboxed, and within primary purpose, and you stay on the safe side of both.

**Sources flagged as older (corroborating, not load-bearing):** saagarjha 2.5.2 analysis (2020) — bundled-interpreter principle still matches current wording; Rollout.io removal (2017) — still the governing enforcement precedent for why JS OTA survives.
