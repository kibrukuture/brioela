# Brioela Generative Grammar — Generativity Tiers

## What This File Covers

The four tiers of generativity, the rendering substrate each one uses, and the rule for
deciding which tier a moment belongs to. This is the strategic frame the rest of the grammar
hangs off. Substrate facts are sourced in `research/`.

---

## The Core Idea

"Generative UI" is not one thing. It is a spectrum from *zero creativity, total safety* to
*total creativity, fully sandboxed*. Brioela maps **how creative a moment needs to be** onto
**which substrate is allowed to carry it.** Each tier has a different ceiling and a different
safety story.

---

## The Four Tiers

| Tier | Name | Substrate | Creativity ceiling | Runtime safety |
|---|---|---|---|---|
| 0 | Static | Hand-coded native | None (intentional) | Authoritative; AI cannot touch |
| 1 | Grammar | Stage document (JSON) → native composition components | High, bounded, beautiful | Data not code; Apple 2.5.2 compliant |
| 2 | Canvas | Skia shaders + Reanimated, driven by tokens in the Stage | Studio-art | Parameterized; AI selects tokens only |
| 3 | Mini-app | Sandboxed `react-native-webview` (generated HTML/JS) | Total — a real mini-experience | Quarantined; no native/data/safety access |

---

## Tier 0 — Static

Hand-coded native UI. Always renders first, always authoritative, never generative.

Owns every life-and-safety surface: hard allergy block, medical condition flag, recall alert,
payment/checkout, consent, account/security, destructive deletes, child safety override,
Ground authenticity gate. See `06-surface-integration.md`.

The AI is structurally forbidden from emitting anything that touches a Tier-0 region. When
`safetyLock = true`, the renderer preserves the static region exactly.

---

## Tier 1 — Grammar (the everyday 90%)

The AI emits a **Stage document** (see `10-the-stage-document.md`): typed JSON constrained to
the catalog. The client renders it with compiled native composition components.

This is the bulk of the system and the bulk of the build. It is store-legal because the
payload is *data describing UI*, not executable code (research `01`, `04`). It is fast because
the renderer and every component already live in the binary.

Used for: scan secondary explanation, Mesa fit, recipe emphasis, cooking opener, weekly
summary, Food Time Machine, menu scan summary, Kids learning, savings story, Discovery Cards.

---

## Tier 2 — Canvas (the emotional peaks)

Skia 2.6.x atmospheres (SkSL runtime shaders) and Reanimated 4 choreography, **driven by
tokens inside the Stage** — never free-form. The AI picks an atmosphere family and nudges a
few uniforms inside safe ranges; the shader itself was authored by a human.

This is where "out of this world" lives. The ceiling is genuinely high (the 2025 Expo
"Most Creative" winner *Callie* is built on exactly Skia + Reanimated — research `05`), and it
stays tasteful because the visual is pre-authored and only parameterized.

Tier 2 is not a separate document — it is the `atmosphere` and `beats` layers of the Stage.

---

## Tier 3 — Mini-app (the rare full experience)

A sandboxed `react-native-webview` running generated HTML/CSS/JS. The only RN-legal way to run
truly generated *code* at runtime (research `04`): Google explicitly carves out "JavaScript in
a webview"; Apple permits sandboxed web content.

Hard boundary: no native bridge beyond an explicit, audited message channel; no app data; no
network egress; can never render or overlap a safety surface. This is the controlled version
of the CopilotKit-iframe / Claude-Artifacts pattern (research `03`).

Used sparingly, for moments that are genuinely a tiny self-contained experience: a playful
animated savings story you flick through, a Kids-Mode learning game. If a moment can be done
in Tier 1+2, it must be — Tier 3 is the exception, not a habit.

---

## The Decision Rule

Walk the tiers top-down and stop at the first that fits:

1. Is it a safety, payment, consent, or destructive surface? → **Tier 0.** Stop.
2. Can the moment be expressed by composing scenes and filling slots? → **Tier 1.**
3. Does it need a generative atmosphere or choreographed reveal? → add **Tier 2** tokens to the Tier-1 Stage.
4. Is it a genuinely self-contained interactive mini-experience that Tier 1+2 cannot express? → **Tier 3**, sandboxed.

Default downward. The lower the tier, the safer and faster. Reach up only when the moment
truly demands it.

---

## What Depends On This File

- `10-the-stage-document.md` — Tiers 1 and 2 are layers of the Stage.
- `18-tier3-webview-miniapp.md` — the Tier 3 sandbox and its boundary.
- `06-surface-integration.md` — which surfaces are pinned to Tier 0.
