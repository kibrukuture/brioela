# Brioela Generative Grammar — How The AI Selects

## What This File Covers

The mechanism by which the backend AI chooses what UI to produce: tool/function calling vs
structured output, how a discriminated union turns "designing a layout" into "picking an enum
and filling slots," and the gate that keeps silence the default. This is the bridge between the
orchestrator (`05-orchestrator`) and the Stage document (`10`).

---

## Two Mechanisms, Explained Plainly

### Mechanism A — Tool / function calling

The model is given a list of **tools**. Each tool = a `name`, a `description`, and a **JSON
Schema** for its arguments. Instead of replying with prose, the model replies *"call this tool
with these arguments,"* and the provider enforces that the arguments match the schema
(constrained decoding; with Anthropic tool use the `input_schema` is enforced).

The model decides *which* tool and *what* arguments by matching the situation against the tool
**descriptions**. The descriptions are the steering. The backend receives the structured call
and renders it. The model can only emit values the schema allows — it cannot invent a
component, a color, or a layout. That is the safety boundary, for free.

### Mechanism B — Structured output

Same idea, but instead of N tools the model is forced to emit **one** JSON object matching one
schema. Best when there is exactly one thing to produce.

---

## What Brioela Uses

| Surface kind | Mechanism | Why |
|---|---|---|
| Compose one moment (scan, Mesa, summary, memory) | **Structured output of one Stage** | One call, one object, cheapest, most reliable |
| Interactive agentic surface (cooking, chat) | **Tool calling** | UI is one of many things the agent does over time, alongside `set_timer`, `write_memory` |

Both are implemented through the same single tool so there is one code path:

```
tool: present_moment
description: "Compose ONE emotional food moment as a Stage. Choose the composition
              whose family matches the emotional weight of the situation. Prefer the
              lowest tier that fits. Never enhance a safety surface."
input_schema: <the Stage schema, with composition as a discriminated union>
```

In the one-shot case the orchestrator forces a `present_moment` call (effectively structured
output). In the agentic case `present_moment` sits in the agent's toolbox next to its other
tools. One tool, two modes.

---

## The Discriminated Union Is The Selection Act

`composition` is a discriminated union keyed on `type`. The model "designing a layout" is
literally:

1. Pick one `composition.type` from the allowed set (e.g. `memory_recall_reverent`).
2. Fill that type's required `slots` with content.
3. Set `mood`, `atmosphere`, `beats`, `voice` from their enums.

There is no free canvas at any step. Every choice is a closed set the schema enforces. This is
the same pattern the industry converged on (json-render, tambo, CopilotKit — research `02`,
`03`), expressed in our vocabulary.

---

## Why One Tool With A Union, Not One Tool Per Scene

Two viable shapes; we choose the first:

- **One `present_moment`, composition is a union (chosen).** Single call path, supports
  multi-scene stages later, keeps the toolbox tiny. The model selects the scene via the
  discriminator, steered by each union member's description.
- One tool per composition (rejected as default). Makes selection explicit but explodes the
  toolbox to dozens of tools and makes composing a multi-part Stage awkward.

The union members each carry a rich `description` (per `12-naming-law.md`), so selection is just
as well-steered as separate tools would be, without the tool sprawl.

---

## What Makes Selection Reliable

1. **Discriminated unions** — pick one tag, fill one shape.
2. **Enums over free strings** — `mood`, `tone`, `voice`, `atmosphere`, `beats` are closed sets; the model cannot hallucinate off-brand values.
3. **Names that carry intent** — `12-naming-law.md` removes gross mis-selection.
4. **Descriptions that say *when*** — removes fine mis-selection.
5. **Few required slots, strong defaults** — the minimum the model must produce is the minimum it can get wrong.
6. **Few-shot gold examples per surface** — 3–4 exemplar Stages in the prompt; models imitate examples far better than they obey rules.
7. **Per-surface allowlists** — a surface only exposes the composition types it permits, shrinking the choice to the relevant set.

---

## The Gate: Silence Is The Default

Per `brioela-specs/00-product-philosophy-and-ux.md`, Brioela speaks only when it has something
genuinely worth surfacing. So before composing anything, the orchestrator runs a gate:

```
decide_if_worth_enhancing(payload, context) → boolean
```

If the moment is mild, already-surfaced recently, or low-confidence, **no Stage is produced at
all** and the static Tier-0 UI simply stands. Generation is the exception, not the reflex. This
gate is a separate, cheap decision *before* `present_moment` is ever offered.

---

## The Full Selection Pipeline

```
1. Feature renders Tier-0 static UI.
2. Orchestrator gathers approved payload + context.
3. decide_if_worth_enhancing → false? stop, static stands.
4. true → call model with system prompt + per-surface catalog schema + few-shot + payload.
5. Model emits a Stage (structured output / present_moment call).
6. Validate (Zod) → safety/privacy filter → stamp grammarVersion → stream to client. (see 15)
7. Client validates again → renders within 400ms, or static stands.
```

---

## What This File Depends On

- `10-the-stage-document.md` — the Stage is what the model emits.
- `12-naming-law.md` — names + descriptions are what the model selects against.
- `05-orchestrator` (feature) — owns the gate and the model call.

## What Depends On This File

- `15-validation-and-repair.md` — what happens to the model's output after it is emitted.
