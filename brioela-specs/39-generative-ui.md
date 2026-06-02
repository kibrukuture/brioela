# 39. Generative UI

## Goal

Make parts of the Brioela interface emotionally alive — dynamically rendered by AI based on context, personal state, and the emotional weight of the moment. Not all UI is generative. The right surfaces are.

## The Core Idea

Most food apps show the same scan card every time. The same verdict layout, the same colors, the same typography, regardless of whether you just discovered you're holding something dangerous for your health or something perfectly aligned with your body.

Brioela's generative UI layer lets the AI decide — given who you are, what you just scanned, and what the result means for you specifically — how the interface should *feel* in this moment. Same information. Different emotional register.

The AI does not write code at runtime. It selects from a predefined component library and fills in typed props. The component library is entirely developer-controlled. The AI only decides which variant fits and what to pass in.

## Technology

**React Native: `react-native-gen-ui`**

A React Native generative UI library built for mobile. The LLM acts as a decision engine — returning a JSON tool call describing which component to render and what props to pass. The client maps this to the actual React Native component.

**Web/PWA: Vercel AI SDK `streamUI`**

For the PWA surface, Vercel AI SDK's `streamUI` streams React components directly from the LLM response. Same pattern, web-native implementation.

**The Pattern (both platforms):**

```typescript
// The AI returns this — never JSX, always typed JSON
{
  "component": "ScanVerdictCard",
  "variant": "celebratory",
  "props": {
    "verdict": "perfect",
    "headline": "Made for you",
    "tone": "delightful",
    "animation": "warm_pulse",
    "accentColor": "sage_green"
  }
}

// The client maps to the actual component
const componentMap = {
  ScanVerdictCard: ScanVerdictCard,
  WeeklySummaryLayout: WeeklySummaryLayout,
  RecipeCard: RecipeCard,
  IllnessResultCard: IllnessResultCard,
  CookingSessionOpener: CookingSessionOpener,
}

function renderGenerativeComponent(decision: AIComponentDecision) {
  const Component = componentMap[decision.component]
  return <Component variant={decision.variant} {...decision.props} />
}
```

The AI cannot reference a component that isn't in `componentMap`. It cannot pass props that aren't in the component's typed schema. It cannot write layout logic. It selects and populates — nothing else.

## Generative Surfaces

### 1. Scan Verdict Card (Primary Surface)

The most important generative surface in the app. The scan verdict is Brioela's core moment — the product must feel different across emotionally distinct outcomes.

**Variants the AI chooses from:**

| Variant | When | Feel |
|---|---|---|
| `celebratory` | Perfect match for your profile, no flags, aligns with active meal plan | Warm, bright, subtle breathing animation. Playful headline. |
| `informational` | Clean verdict, minor soft flags, no constraints violated | Clear, calm, structured. Neutral tone. |
| `cautionary` | Soft concern — ingredient worth noting, not a hard block | Amber warmth, measured pacing, gentle explanation. |
| `urgent` | Hard allergy or medical condition conflict | Heavy, immediate, no decoration. Urgency without panic. |
| `discovery` | First time scanning this product category | Curious, exploratory. "This is new for you." |
| `familiar` | Product scanned 10+ times, long-term staple | Warm, comfortable, brief. No need to explain again. |
| `medication_flag` | Drug-food interaction detected | Clinical but calm. Factual, not alarming. |

The props the AI fills: headline copy, the one-sentence reason shown to the user, animation variant, accent color family, whether to show an expandable detail section. The actual allergen warning block, the product name, and the core verdict are hardcoded — never generated (see What Is Never Generative below).

### 2. Weekly Summary

The weekly food summary (spec 16) never looks the same twice. The AI decides the layout structure based on what happened that week.

A week of clean eating and home cooking → rich, narrative layout with ingredient highlights.
A week of mostly eating out → leaner layout, receipt-focused, no cooking highlights.
A week where a recall alert fired → the summary leads with that, serious and clear.
A week with a big dietary win (maintained a restriction 7 days straight) → celebratory structure.

The AI selects from layout templates (story, grid, timeline, achievement) and decides the emphasis. The underlying data is always the same — what changes is how it is framed and weighted.

### 3. Recipe Cards

The recipe card renders differently based on context at the moment of opening:

- Weeknight, user has under 30 minutes based on prior patterns → card renders in fast mode: big step numbers, big times, stripped of narrative
- Weekend, exploratory scan history this week → full card with technique notes and ingredient story
- Cooking for guests (Guest Mode active, spec 37) → card highlights which steps or ingredients need attention for guest constraints
- Recipe made 8+ times → familiar mode: compact, no intro, jumps straight to steps

The AI reads the session context and picks the variant. Not a user setting. Not a toggle. The AI reads the room.

### 4. Cooking Session Opener

The moment before a cooking session starts — the "stage is set" screen that shows what you're about to make. This is where whimsy lives most naturally.

A fast weeknight stir-fry → energetic, kinetic feel, warm kitchen colors
A slow weekend braise → patient, low-key, deep warm tones, unhurried
Baking → precise, clean, measured
A generational recipe (spec 13) → reverential, warm, intimate

The AI writes the one opening line that sets the tone for the session. The rest of the UI structure is from the selected template.

### 5. Illness Detective Result (spec 30)

This result must feel empathetic above all. The generative layer ensures it never reads as clinical, alarming, or cold. The AI calibrates tone based on:

- Severity of ranked culprits
- Whether a recall match was found (more serious → more measured, careful)
- Whether this is the user's first illness report or a recurring pattern

The layout is the same. The headline, the framing language, and the visual weight are generated.

## What Is Never Generative

This list is a hard constraint, not a guideline:

- **Allergen and medical condition warnings**: These must be visually identical every time. Users build pattern recognition for "this red card with this icon means danger for me." A generative warning that looks different breaks that recognition. Non-negotiable.
- **Navigation, tabs, and core app chrome**: Predictable always.
- **Settings and account screens**: Functional, not expressive.
- **Form inputs and data entry**: Generative form fields are unpredictable and slow.
- **Any screen where the user is entering health-critical information**: Consistent, standard, no surprises.
- **Ground map and find submission flow**: The community surface must be consistent for trust.

## Performance Rule

Generative UI never blocks interaction. The sequence is:

1. Functional content renders immediately from local/cached data (product name, verdict score, allergen flags) — static, instant, always.
2. Generative layer request fires in parallel.
3. If the generative response arrives within 400ms, it renders on top of the static layer seamlessly.
4. If it takes longer than 400ms, the static layout stays. The generative layer is discarded for this render. No spinner, no waiting, no visible failure.

The user never waits for generative UI. It enhances moments it catches in time. It degrades invisibly when it misses.

## The Component Library

The full component library is defined at build time. Components have strict TypeScript prop schemas enforced by Zod. The AI cannot pass a prop that isn't in the schema — the tool call fails validation and the static fallback renders.

Each generative surface has:
- A base (always-rendered static layer) — correct, functional, fast
- A generative enhancement layer — emotional, contextual, optional

The base layer is fully functional standalone. The generative layer is always additive, never load-bearing.

## Integration With Memory and Personality

The AI's component selection is informed by context injected from the Orchestrator DO:

- Current user constraints (allergies, medical conditions, dietary identity)
- Recent emotional signals from session history (anxious cooking sessions → calmer tone)
- Personality traits (`user_personality` — fitness-focused person gets different framing than casual user)
- Current session state (Guest Mode active, travel context, illness follow-up)

This context is already injected into every session via `buildSystemPrompt()` (spec 09). The generative UI decision uses the same context — no additional fetch required.

## Data Model

No persistent storage for generative UI decisions. They are ephemeral — made at render time, consumed at render time, discarded.

If a specific generative render needs to be reconstructed (e.g., opening the same scan result later), the AI makes the decision again from the same context. The result may differ slightly — that is acceptable and even desirable. The app is alive, not frozen.

One exception: if the user screenshots or saves a moment (like a weekly summary they want to keep), the static snapshot is stored as an image — not as a regeneratable component.

## Success Metrics

- Generative render rate: percentage of eligible surfaces where generative layer loaded within 400ms.
- Variant distribution: are all variants being selected by the AI, or is it always choosing the same ones? (Too uniform = the AI is not reading context; too random = no coherent logic)
- Session depth after generative moments: do users spend more time in the app after a `celebratory` verdict vs a static one?
- Qualitative: does the app feel alive? Survey question at 30-day mark.
