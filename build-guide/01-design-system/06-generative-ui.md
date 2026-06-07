# Generative UI

## What It Is

Generative UI is a pattern where the AI — not the developer — selects how a surface should be composed and framed, while the developer controls every renderable primitive. The full architecture now lives in `build-guide/27-generative-grammar/`. This file remains the design-system foundation: registry, Zod validation, static fallback, and the 400ms rule.

The AI cannot write JSX. It cannot create runtime code. It cannot reference primitives outside the grammar registry. It returns typed JSON. The client renders the result.

This is not a gimmick. It is the mechanism that allows a single AI verdict to produce meaningfully different visual presentations based on context, without requiring a developer to hardcode every possible state.

---

## Implementation Approach — Not Yet Determined

**The pattern is decided. The implementation is Brioela Generative Grammar.**

The document object, primitive catalog, Zod validation layer, and 400ms rule are all determined. The runtime architecture is defined in `27-generative-grammar`: AI composes a typed `BrioelaGenerativeUiDocument`, not arbitrary JSX.

**Option A — Build custom.** The full pattern described in this file is straightforward to implement from scratch. A custom build has no external dependencies, no library lock-in, and can be tuned precisely to Brioela's AI infrastructure (Claude/Gemini, not OpenAI).

**Option B — Adopt a library.** The inspiration is CopilotKit's generative UI approach — specifically the pattern where AI tool calls progressively render React components with streaming state. A library that follows this pattern and works in React Native without being OpenAI-specific would be adopted if found. No such library is confirmed yet.

**Decision criteria when the time comes:**
- Must work in React Native (not web-only)
- Must be model-agnostic (not hardcoded to OpenAI)
- Must support the component registry + Zod validation pattern
- Must support the 400ms graceful degradation requirement
- Custom build is the default if no library satisfies all four

This decision is made when `01-design-system` is implemented, not before. Do not block design system implementation on it — the pattern below is what gets built regardless of which delivery method is chosen.

---

## The Document Object

Every AI response that drives a generative surface returns a `BrioelaGenerativeUiDocument` alongside the primary response data:

```ts
type BrioelaGenerativeUiDocument = {
  surface: string
  emotionalTone: string
  backgroundEffect: string | null
  layoutTemplate: string
  content: Record<string, unknown>
  entranceMotion: string | null
  typographyStyle: string
}
```

The document is validated against the Brioela Generative Grammar schema before render. If validation fails, the static fallback renders. The user never sees a blank surface or a crash.

---

## The Component Registry

All registerable components live in `src/generative-ui/registry.ts`. This is the single source of truth for what the AI can select.

Structure:
```ts
import { SomeComponent } from '../components/SomeComponent'
import { AnotherComponent } from '../components/AnotherComponent'

export const COMPONENT_REGISTRY = {
  SomeComponent,
  AnotherComponent,
  // ...
} as const

export type RegistryKey = keyof typeof COMPONENT_REGISTRY
```

**Rules for the registry:**
- Only production-ready, fully typed components are registered
- Every registered component must have a corresponding Zod schema for its props in `src/generative-ui/schemas.ts`
- A component is added to the registry only when it is complete — never as a placeholder
- The registry is append-only during active development. Do not remove components that AI models may have learned to reference. Deprecate by leaving the component in registry but marking it in code.

---

## Prop Validation

Every registered component has a Zod schema in `src/generative-ui/schemas.ts`:

```ts
import { z } from 'zod'

const SomeComponentSchema = z.object({
  title: z.string(),
  value: z.number().optional(),
  variant: z.enum(['default', 'compact', 'expanded']),
})

export const REGISTRY_SCHEMAS: Record<RegistryKey, z.ZodType> = {
  SomeComponent: SomeComponentSchema,
  AnotherComponent: AnotherComponentSchema,
}
```

The AI-returned `props` object is parsed through `REGISTRY_SCHEMAS[decision.component].safeParse(decision.props)` before render. If `success` is false, the static fallback renders.

This validation layer is the boundary between AI output and the React tree. Nothing unparsed ever reaches a component.

---

## The Loading / Progressive Render Pattern

Generative surfaces must never block initial render. The pattern:

1. Static content renders immediately from the primary API response data
2. The generative decision is fetched alongside or immediately after the primary response
3. Within 400ms of the primary render, the generative component replaces or enhances the static layout
4. If 400ms passes with no generative decision: the static layout stays. Permanently. No spinner.

Implementation:
```ts
// The generative slot starts as null — static content renders
const [brioelaGenerativeUi, setBrioelaGenerativeUi] = useState<BrioelaGenerativeUiDocument | null>(null)

// On receiving the decision (via websocket, streaming, or poll):
const result = REGISTRY_SCHEMAS[decision.component].safeParse(decision.props)
if (result.success) {
  setBrioelaGenerativeUi(result.data)
}
// If validation fails: brioelaGenerativeUi stays null, static layout stays

// In JSX:
{brioelaGenerativeUi
  ? <BrioelaGenerativeUiRenderer document={brioelaGenerativeUi} />
  : <StaticFallback data={primaryData} />
}
```

The transition from static to generative uses a `FadeIn` layout animation (Reanimated, spring `landing`). No abrupt swap.

---

## What Is Never Generative

The following surfaces are always static, always visually identical regardless of AI state:

- **Allergen warnings and allergy interrupts** — hard safety blocks. Always the same component, always the same visual treatment. No variant. No AI selection.
- **Medical condition flags** — same rule as allergen warnings.
- **Navigation** — tab bar, back button, header. Always static.
- **Settings and account screens** — always static.
- **Error states for network/auth** — always static.
- **Recall alerts** — always static, always maximum urgency treatment.
- **Onboarding** — always static.

The principle: if being wrong could cause harm or confusion during a critical moment, it is never generative.

---

## Model Integration

The generative decision is generated server-side by the Orchestrator DO / feature-specific Worker. The client receives it as part of an API response or streamed via WebSocket. The model used to generate decisions is determined by each feature spec — it is not defined here.

The generative UI system on the client is model-agnostic. It receives a `BrioelaGenerativeUiDocument` object — it does not know or care which model produced it. The server-side prompt engineering that drives the AI toward valid document values is defined in each feature's AI layer, not here.

---

## Rules

- `BrioelaGenerativeUiDocument` type is defined once in the shared grammar package. All features import from there.
- The 400ms deadline is a hard ceiling — not a target. Design for 200ms, enforce 400ms.
- Never show a loading spinner in a generative slot. Either the static layout or the generative component renders — never a "loading" state.
- Never let a Zod validation failure surface to the user. Always fall back silently to static.
- The `COMPONENT_REGISTRY` is the contract between the AI and the UI. Adding a component to the registry is a deployment event — the AI can immediately start selecting it. Removing a component breaks active AI behavior. Treat registry changes with the same care as API changes.
- Components in the registry must be designed to work standalone — they receive only what the AI passes in `props`. They cannot reach outside their props for data. All data they need must be in the decision object.
