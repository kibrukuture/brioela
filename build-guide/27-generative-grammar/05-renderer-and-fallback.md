# Brioela Generative Grammar — Renderer And Fallback

## What This File Covers

The runtime renderer, recursive node rendering, validation failure behavior, static fallback, and the 400ms rule.

---

## Render Flow

1. Feature renders static UI immediately.
2. Feature asks server for a `GenerativeUIDocument` or receives it with response.
3. Client validates document.
4. If valid and under 400ms, renderer enhances the static UI.
5. If invalid or late, static UI remains.

No spinner. No blank state. No visible failure.

---

## Renderer Shape

```typescript
type GrammarRendererProps = {
  document: GenerativeUIDocument
  fallback: React.ReactNode
}
```

Renderer responsibilities:

- validate version
- validate surface allowlist
- recursively render nodes
- apply motion/haptic/skia tokens
- preserve safety-locked regions
- fail closed to fallback

---

## Recursive Rendering

Each node type maps to a compiled component:

```typescript
const NODE_RENDERERS = {
  stack: StackNode,
  cluster: ClusterNode,
  headline: HeadlineNode,
  metric_single: MetricSingleNode,
  swap_suggestion: SwapSuggestionNode,
  mesa_member_row: MesaMemberRowNode,
} as const
```

The AI cannot name anything outside `NODE_RENDERERS`.

---

## Failure Modes

Fallback for:

- unknown node type
- invalid props
- invalid token pairing
- privacy/safety violation
- document too large
- response after 400ms
- renderer error boundary hit

All failures should be logged in dev/observability, never shown to the user.

---

## Size Limits

Set hard caps:

- max depth: 5
- max child nodes per parent: 8
- max total nodes: 40
- max text length per node: surface-specific

This prevents runaway generated layouts.

---

## Static Fallback Is Complete

Every generative surface must have a full static UI.

If grammar never arrives, the product still works perfectly.
