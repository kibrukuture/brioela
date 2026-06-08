# Brioela Generative Grammar — Validation And Repair

## What This File Covers

What happens to a Brioela Generative UI document after the model emits it: the validation pipeline, where it runs, the
fail-closed rule on the live path, the size caps, the safety/privacy filter, and how "repair"
actually works (offline, not as a live retry). This is the runtime gate between
`13-how-ai-selects.md` and `05-renderer-and-fallback.md`.

---

## Two Places Validation Runs (defense in depth)

A Brioela Generative UI document is validated **twice**, by the same shared schema (`shared/grammar`), on purpose:

1. **Backend, before streaming** — the brain validates the model's output, runs the
   safety/privacy filter, stamps `grammarVersion`, and only then streams. A bad document never
   leaves the server.
2. **Client, before rendering** — the renderer re-validates the received document against the same
   schema. A document that somehow arrives malformed (version skew, transport corruption) is
   discarded and the static UI stays.

Same schema, two consumers — they cannot disagree (`13`, single source of truth).

---

## The Validation Pipeline (ordered)

Validation runs in this order; the first failure discards the grammar layer:

1. **Document schema** — the Brioela Generative UI document is a well-formed object.
2. **`grammarVersion`** — the client supports this version; older/newer is handled by the
   version policy, not rendered blindly.
3. **Surface allowlist** — the `layoutTemplate.type` is permitted on this `surface`.
4. **Recursive node schema** — every node (layout template, content, primitives) matches its Zod
   shape (discriminated union by `type`).
5. **Token allowlist** — every `emotionalTone`, `tone`, `typographyStyle`, `backgroundEffect`, `motion`, `entranceMotion`,
   `space_*` value is a known enum member. No free strings.
6. **Pairing rules** — emotionalTone ↔ backgroundEffect ↔ entranceMotion ↔ typographyStyle combinations are legal (`04`).
7. **Size caps** — depth, child count, total nodes, and per-node text length within limits.
8. **Safety / privacy filter** — no disallowed content, no PII leak, no safety-surface overlap.
9. **`safetyLock`** — if true, the document is confirmed to touch only non-safety regions.

Two distinct kinds of invalidity matter here:

- **Structural** (steps 1–5) — usually prevented *before* it happens by constrained decoding /
  tool-use enforcement (`13`): the provider only lets the model emit schema-valid arguments. We
  still re-check, because enforcement is not a guarantee across providers/versions.
- **Semantic** (steps 6–9) — pairing, size, safety, and privacy cannot be expressed in the
  emit-time schema alone, so they are *only* caught here. This is the validation that earns its
  keep.

---

## Fail Closed — The Live Rule

> On the live path there is **no repair retry.** An invalid document is discarded instantly and the
> static Tier-0 UI stays.

Why no live retry: a re-prompt is a full model round-trip, and the budget is **400ms** before
the static UI wins (`05`). Spending that budget on a second attempt would blow the deadline and
risk a visible flash. So the live behavior is binary: valid in time → enhance; anything else →
static stays. No spinner, no blank state, no visible failure (`05`).

Fail-closed triggers (any one):

- unknown node type or invalid props
- unknown token or illegal pairing
- size cap exceeded
- privacy/safety violation
- response arrives after 400ms
- renderer error boundary hit

---

## Size Caps

Hard caps (from `05-renderer-and-fallback.md`), enforced at step 7:

- max depth: 5
- max child nodes per parent: 8
- max total nodes: 40
- max text length per node: surface-specific

These bound generation cost, render cost, and the blast radius of a bad document.

---

## The Safety / Privacy Filter

Step 8 is non-negotiable and specific to a food-safety app:

- **No safety-surface content** — verdict levels, allergy blocks, medical flags, recall alerts,
  payment, and consent are Tier-0 and never appear in a Brioela Generative UI document (`06`, `09`).
- **No PII / member privacy leak** — Mesa member names beyond approved labels, medical
  redactions, and any field not explicitly passed in the approved payload are stripped or the
   document is rejected (`13` data-binding: nodes reference only approved payload fields).
- **`safetyLock` honored** — a locked document that references a safety region is rejected, not
  trimmed. Fail closed, never partially render.

---

## Repair — Offline, Not Live

"Repair" is real, but it happens **off the live path**:

1. Every fail-closed event is logged to observability with the failure mode, surface, and the
   offending document (scrubbed of PII).
2. Aggregated failures drive improvement: better few-shot gold examples, sharper catalog
   descriptions, tightened schemas, or a new pairing rule.
3. The fix ships through prompt/catalog updates — the model gets better at emitting valid documents
   over time, instead of the user paying latency for a live correction.

The one acceptable in-call correction is **provider-level constrained decoding** (`13`): because
tool-use enforcement already constrains emit-time structure, most structural invalidity never
occurs. There is no second model call on the live path.

---

## Observability

Every failure mode is logged in dev and production telemetry; none is ever shown to the user.
The metrics that matter: fail-closed rate per surface, dominant failure mode, and 400ms-miss
rate. A rising fail-closed rate on a surface is a signal to fix its prompt/catalog, not to
loosen validation.

---

## What This File Depends On

- `02-grammar-document.md` — the base validation order this expands.
- `05-renderer-and-fallback.md` — the 400ms rule, size caps, and fallback behavior.
- `06-surface-integration.md` — which surfaces are safety Tier-0.
- `13-how-ai-selects.md` — constrained decoding prevents most structural invalidity upstream.

## What Depends On This File

- `05-renderer-and-fallback.md` — renders only a validated Brioela Generative UI document.
- `19-code-package-structure.md` — `validate` / `safety-filter` live in `backend/src` and the
  shared schema in `shared/grammar`.
