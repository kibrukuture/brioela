Hell yes. This is the most important architectural decision in the whole app, and you're right to refuse the shadcn-button-and-card trap. Before I brainstorm, I'm not going to assert anything about what RN/Expo can actually run at runtime from memory — your rules say web-first, latest-only. So I'm spinning up parallel research agents on the current (2025–2026) state of every rendering substrate that could carry this, then I'll go wild on the design synthesis.

Launching 5 research agents in parallel now.

⏺ 5 agents finished
Expo RSC and DOM components runtime · 17 tool uses · 25.1k tokens
⎿  Done
Server-driven UI frameworks RN · 23 tool uses · 32.4k tokens
⎿  Done
Generative UI framework landscape · 18 tool uses · 28.4k tokens
⎿  Done
Runtime JS/JSX execution on RN · 17 tool uses · 25.8k tokens
⎿  Done
Expressive artistic UI on RN · 21 tool uses · 28.5k tokens
⎿  Done

Research is back — all 2025–2026, sourced. I'm going to give you the honest technical verdicts first (because they kill two of your options outright), then go wild on the design, because the design answer is where your real problem lives — and it's not the problem you think it is.

---
Part A — The runtime truth (three verdicts, all sourced)

1. AI-generated JSX cannot run natively on React Native. Dead end. Stop considering it.
Hermes (the default + bundled engine in RN 0.85, 2026) explicitly excludes eval from support — "Local mode eval()" is listed under Excluded From Support in Hermes' own feature matrix (https://github.com/facebook/hermes/blob/main/doc/Features.md). You'd have to swap to JSC to regain eval, which is slower and still illegal under Apple 2.5.2. So "AI writes a .tsx and it renders" is physically impossible on the native side. Your spec's "no runtime JSX" rule isn't caution — it's physics.

2. Expo RSC and 'use dom' are both the wrong tools. Don't build on them.
- Expo RSC is beta, the docs literally say "production deployment is limited and not recommended yet," EAS Update doesn't work with it, and it shipped an unauthenticated RCE (CVE-2025-55182) in Dec 2025 (expo.dev/changelog/mitigating-critical-security-vulnerability... (https://expo.dev/changelog/mitigating-critical-security-vulnerability-in-react-server-components)). For a food-safety app, no.
- Expo DOM components ('use dom') bundle web code at build time as SPAs — no SSR/SSG, no iframe isolation, and slower than Hermes bytecode (docs.expo.dev/guides/dom-components (https://docs.expo.dev/guides/dom-components/)). They're for embedding recharts, not runtime-generated UI.

3. Your CopilotKit-iframe dream IS possible on RN — but as a WebView, and only as a fenced-off escape hatch.
CopilotKit's open-ended mode (widgetRenderer) runs generated HTML/SVG in a sandboxed iframe — confirmed in their examples repo, even though their Jan 2026 blog downplays it (https://github.com/CopilotKit/generative-ui). Claude Artifacts, MCP-UI, MCP Apps (Anthropic+OpenAI, Nov 2025) — every "AI generates a real mini-app" system is iframe-bound. There is no native-RN equivalent of a full-site-isolated iframe. On RN the only equivalent is react-native-webview, and Google explicitly carves out "JavaScript in a webview" as allowed (support.google.com/.../9888379 (https://support.google.com/googleplay/android-developer/answer/9888379), effective Jan 28 2026); Apple permits sandboxed web content. So: yes, you can have real-time AI-generated mini-apps in Brioela — they live inside a locked-down WebView, with zero native/API/storage access.

So the substrate reality is a spectrum, not a single choice. Hold that thought — it's the spine of the framework.

---
Part B — The reframe that actually solves "I don't want ugly"

Here's where I'm going to disagree with the instinct buried in your question.

You said: "I can't provide minimal primitives like button or text and hope they'll be great — probably it won't." You're right that it won't — but not because the primitives are too minimal. It's because you're imagining the AI composing at the wrong altitude.

The fatal mistake in 90% of generative UI is letting the AI stack atoms freely: hero_line + whisper_note + metric_petal in a column. That will look like generic SDUI garbage, every time. Free composition at the atom level is where ugliness is born. Your current spec's primitive list (03-primitive-families.md) is a flat menu of ~50 atoms — and a flat menu freely stacked is exactly the trap.

The beauty is not generated. The beauty is pre-built, by a human, into the system. The AI never improvises a layout — it chooses from layouts that were art-directed to be incapable of being ugly, and fills them with meaning.

Three ways to feel why this works:

- Typeface. You cannot make Helvetica ugly by typing a different sentence. The letterforms carry the quality; you bring the meaning. A great type system + spacing scale is beautiful by construction regardless of content.
- The sonnet. 14 lines, fixed meter, fixed rhyme. The constraint doesn't limit the poet — it guarantees a floor of quality and frees them to pour everything into meaning. Shakespeare wasn't hurt by the form.
- The chef (your app is about food — use it). A great chef doesn't hand you raw ingredients on a tray. They plate a composed dish — the plating technique, the negative space on the plate, the placement, the sauce gesture, all pre-mastered. The diner gets infinite different dishes, none ugly. The AI is the chef plating an emotional food moment. The atoms are ingredients. But the AI works at the level of plates, not ingredients.

That's the whole secret. Let me make it concrete.

---
Part C — The four-tier generativity spectrum

Map how creative a moment needs to be to which substrate carries it. This is the strategic frame the spec is missing:

┌──────┬──────────┬─────────────────────────────────────────┬──────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Tier │   Name   │                Substrate                │        Creativity ceiling        │                                            Used for                                             │
├──────┼──────────┼─────────────────────────────────────────┼──────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 0    │ Static   │ Hand-coded native                       │ None (intentional)               │ Allergy, medical, recall, payment, consent — never generative (already in spec 06)              │
├──────┼──────────┼─────────────────────────────────────────┼──────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1    │ Grammar  │ JSON → art-directed native scenes       │ High, bounded & beautiful        │ The everyday 90% — scan explanations, Mesa, recipes, summaries                                  │
├──────┼──────────┼─────────────────────────────────────────┼──────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 2    │ Canvas   │ Skia shaders + Reanimated, token-driven │ Studio-art / "out of this world" │ The emotional peaks — atmospheres, kinetic type, verdict blooms, memory moments                 │
├──────┼──────────┼─────────────────────────────────────────┼──────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3    │ Mini-app │ Sandboxed WebView (generated HTML/JS)   │ Totally free — a real mini-app   │ Rare "wow, this is a whole tiny experience" moments — a playful savings story, a Kids-Mode game │
└──────┴──────────┴─────────────────────────────────────────┴──────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────┘

Tier 1 + 2 are where 99% of the magic lives, both fully native, fast, store-legal (JSON = data, not code — Apple 2.5.2 compliant). Tier 3 is your CopilotKit-iframe dream, quarantined so it can never touch a safety surface. This spectrum is the answer to "in some areas my app needs that totally different generative confidence" — that's Tier 3, and now it has a safe home.

---
Part D — The mini-framework (let's build it — I'll call it the Brioela Stage)

You invited me to invent a framework for the app. Here it is. It keeps your spec's good bones (mood, tone, motion, haptic, skia) but adds the missing layer that prevents ugly: the AI composes Scenes, not atoms.

A document is a Stage with six layers — think theater/cinema, not web. No div, no card, no button anywhere in the vocabulary:

1. mood — the emotional key (already in spec). Sets lighting, palette, motion defaults, type voice. One choice colors everything.
2. atmosphere — the Tier-2 Skia field behind everything. A hand-tuned SkSL shader family; the AI only nudges a few uniforms inside safe ranges. Infinite atmospheric variety, always tasteful because the shader was authored by a human.
3. composition — the central new unit. An art-directed Scene. Not an atom — a complete, hand-designed layout with soul: asymmetry, dramatic negative space, a real type hierarchy, a focal point. ~20–30 of these, each beautiful with any content you pour in. This is the "plate."
4. slots — the content the AI fills into the composition's named holes (headline, whisper, metric, swap), bounded by length and tone. The AI writes meaning, not layout.
5. beats — choreography. The timed sequence of how the scene reveals (Reanimated 4.4's spring physics + shared-element transitions). Rhythm is a first-class citizen, not an afterthought.
6. voice — typography register (display / editorial / quiet). Maps to a type personality. This is your "big expressive fonts."

The hierarchy of who controls what:

HUMAN designs:  atmosphere shaders, the 20-30 compositions, the type scale,
                the spacing scale, the palette, the motion springs
                → the entire "look" is pre-authored to be gorgeous

AI chooses:     which mood, which composition, which atmosphere,
                the beat sequence, and fills the slots with meaning
                → the AI is art director + poet, never a pixel-pusher

The AI cannot express an ugly result, because it has no vocabulary for one. There's no "spacing: 7px," only spacing.intimate | spacing.breath | spacing.cathedral. No "fontSize: 23," only voice.display | voice.editorial | voice.whisper. Ugliness is not validated-against — it's unspeakable.

---
Part E — How beauty is guaranteed, mechanism by mechanism

Mapping directly to every word in your ask:

- "Big fonts, expressive, studio-art" → voice.display is a first-class register. Compositions are built around a giant focal headline with everything else deferring to it. Render display type inside Skia when you want warping/shader-fills/per-glyph motion that native <Text> can't do (this is how the 2025 Expo "Most Creative" winner Callie did its AI-journaling visuals — Expo + Reanimated + Skia shaders, expo.dev/blog/making-ai-feel-human... (https://expo.dev/blog/making-ai-feel-human-in-a-mobile-app-with-expo-reanimated-and-skia)).
- "Nicely spaced out / spacing" → spacing is a token scale with a generous editorial default. Negative space is designed into each composition, not left to chance. You literally cannot ship a cramped layout.
- "Typography, hierarchy" → one type system, fixed scale, dramatic contrast between display and whisper. Hierarchy is structural, baked into every composition.
- "Artistic, whimsical, out of this world" → the atmosphere layer. SkSL runtime shaders (Skia 2.6.x supports RuntimeEffect.Make, blend modes incl. non-separable Hue/Color/Luminosity — shopify.github.io/react-native-skia/docs/shaders (https://shopify.github.io/react-native-skia/docs/shaders/overview/)) driven by Reanimated shared values with no bridge glue. This is generative art without generative code — the ceiling here is genuinely "out of this world," and it's always tasteful because you authored the shader.
- "Emotive, nice to see" → mood + beats. The same scan verdict feels like plain_truth or warm_caution or soft_celebration — different palette, different atmosphere, different choreography — without ever changing the safety verdict (your spec's rule, preserved).
- "Perfect so it's not ugly" → constraint-as-beauty. No raw values, hand-art-directed scenes, fail-closed to a complete static fallback within 400ms (your spec's rule). The floor is high because the floor was hand-built.

---
Part F — What I'd actually build / steal (so you don't reinvent)

- Study vercel-labs/json-render hard — it's almost exactly your Tier 1, and it's production-grade. Open-sourced Jan 2026, Apache-2.0, ~13k stars, has a first-class React Native renderer, LLM emits JSON constrained to a Zod component catalog, renders progressively as the model streams (https://github.com/vercel-labs/json-render, infoq.com/news/2026/03/vercel-json-render (https://www.infoq.com/news/2026/03/vercel-json-render/)). You may not adopt it wholesale (you want richer art-direction than its 36 shadcn web components), but its catalog+Zod+RN-renderer architecture is your skeleton. Don't build that plumbing from scratch.
- Steal DivKit's expression/variable/trigger layer (https://github.com/divkit/divkit, v32.52.0, June 2026) — variables + triggers + timers turn a static JSON tree into something that can reveal/toggle/animate without a server round-trip. The difference between a "grammar" and a "dumb template." (DivKit itself has no RN support — take the ideas, not the lib.)
- Steal Airbnb's variant-enum + client-owns-styling pattern — server sends semantic data + a variant enum; the client owns all typography/spacing/motion. This is precisely how you keep the payload tiny and the look on-brand.
- The beauty stack is settled: Skia 2.6.x (visual engine, stay on Ganesh — Graphite/WebGPU is still experimental) + Reanimated 4.4+ (motion engine — reworked spring physics = duration+damping, shared-element transitions, iOS Core Animation engine off the JS thread) + Rive for state-machine-driven emotive moments (mascots, reactive characters at 60fps). Ship via EAS dev build, New Arch on, RN ≥0.79/React 19.

---
Part G — One concrete walk-through

Scan result, "this oat milk is great for you," first time you've scanned it:

- Tier 0 renders instantly: the verdict, any allergen flag — static, authoritative, untouched.
- The orchestrator emits a Stage: mood: soft_celebration, atmosphere: discovery_sheen (a slow Skia bloom, AI nudged the hue toward warm), composition: "single-focal-reveal" (a hand-art-directed scene: massive display headline top-left, cathedral negative space, one metric petal drifting in bottom-right), voice: display, beats: [headline rises on warm spring, atmosphere blooms 200ms later, whisper fades in last].
- Slots filled by AI: headline = "A quiet good one." whisper = "First time you've met this — it sits well with how you eat." metric = the one number that matters.
- Validates in <400ms → enhances. Misses → the static Tier-0 verdict just stays. No spinner, no failure (your spec's rule).

Same data, peanut traces detected → Tier 0 hard block fires, safetyLock: true, the Stage is forbidden from touching it. Beauty never overrides safety.

And the rare Tier-3 moment: end-of-month "you saved $80" → a generated little interactive WebView mini-app — a playful animated receipt you can flick through — sandboxed, no native access, no data egress, can't reach any safety surface. That's your CopilotKit moment, and now it has a cage.

---
That's the whole argument: the AI is a chef plating with pre-mastered techniques, not a line cook handed raw ingredients. The spec already has the tokens and the safety model right — what it's missing is the Scene/composition layer (Tier 1 art-direction) and the Canvas/atmosphere layer (Tier 2 Skia) that together make "beautiful" a property of the system, not a hope about the output.

Where do you want to go deeper — the 20-30 compositions (the actual art-direction vocabulary), the Skia atmosphere system, the Tier-3 WebView mini-app boundary, or how the orchestrator decides which Stage to emit?

✻ Crunched for 7m 24s

※ recap: Goal: design a non-ugly, studio-art generative UI system for Brioela that's safe on React Native. I delivered the research and a four-tier framework. Next: pick which layer to detail — the 20-30 art-directed compositions, the Skia atmosphere system, the Tier-3 WebView boundary, or orchestrator logic. (disable recaps in /config)

❯ wiat can you first add thsi into brioela geenraeive grammer/research fodler add all of those study you did okay full texts okay . can you do that dont miss as ingel workd and hten we will disucsss latere how we will design this okay . thanks.