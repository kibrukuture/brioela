# Mira — Scene Contract

## What This File Covers

The pluggable context contract for Mira. Mira is one live presence; a `MiraScene` tells her what world she is inside right now.

A scene is not just a prompt. It is the whole live operating envelope:

- audience
- Brain context slice
- situation context
- stimuli sources
- allowed capabilities
- privacy boundary
- speech policy
- exit policy

## Core Rule

Do not create a new agent for every product surface.

Create a `MiraSession` and inject a `MiraScene`.

```text
Mira + cooking scene
Mira + Bela shopper scene
Mira + menu language bridge scene
Mira + recipe review scene
Mira + kid co-scan scene
```

The scene changes. Mira stays Mira.

## Type Shape

```typescript
type MiraSceneKind =
  | "cooking"
  | "bela_shopper"
  | "menu_language_bridge"
  | "recipe_review"
  | "scan_followup"
  | "kid_explanation"
  | "kid_co_scan"

type MiraAudience = {
  primary: "user" | "shopper" | "staff" | "child" | "group"
  participants: Array<{
    participantId: string
    relationshipToUser: "self" | "shopper" | "staff" | "guest" | "child" | "unknown"
    language: string | null
    canHearMira: boolean
    canSeePrivateUserContext: boolean
  }>
}

type MiraScene<TSituation = unknown> = {
  sceneId: string
  kind: MiraSceneKind
  audience: MiraAudience
  brainContext: BrainContextSlice
  situationContext: TSituation
  stimuli: MiraStimulusConfig
  capabilities: MiraCapability[]
  privacyBoundary: MiraPrivacyBoundary
  speechPolicy: MiraSpeechPolicy
  exitPolicy: MiraExitPolicy
}
```

## Brain Context Slice

A scene must request the smallest useful Brain context.

```typescript
type BrainContextSlice = {
  userId: string
  constraints: "none" | "hard_only" | "food_relevant" | "full_food_profile"
  memory: "none" | "session_relevant" | "recipe_relevant" | "order_relevant"
  skills: "none" | "scene_relevant" | "all_active_index"
  recipes: "none" | "active_recipe" | "candidate_recipe"
  health: "none" | "active_condition_food_rules"
}
```

Examples:

- Menu staff scene uses hard food constraints only, not the full private profile.
- Bela shopper scene uses order constraint snapshot, not open-ended memory.
- Cooking scene can use the active recipe, selected memory, constraints, skills, and active condition food rules.
- Kid scene uses parent-approved explanation context, not private adult history.

## Situation Context

`situationContext` is feature-owned. It is where the scene plugs in its world.

Examples:

```typescript
type CookingSituation = {
  recipeId: string | null
  phase: "prep" | "active_cooking" | "waiting" | "plating" | "done"
  activeStepId: string | null
  timers: Array<{ timerId: string; label: string; firesAt: number }>
}

type BelaShopperSituation = {
  orderId: string
  storeId: string | null
  requiredItems: Array<{ orderItemId: string; name: string; status: string }>
  allowedSubstitutions: Array<{ originalItemId: string; substituteName: string; reason: string }>
}

type MenuLanguageBridgeSituation = {
  menuScanId: string
  userLanguage: string
  staffLanguage: string
  activeDishId: string | null
  waiterQuestions: Array<{ dishId: string; userText: string; staffText: string }>
}
```

The Mira runtime should not invent the shape of `situationContext`. The owning feature builds it and validates it before session start.

## Stimuli Config

`MiraStimulusConfig` tells Mira what inputs can arrive.

```typescript
type MiraStimulusConfig = {
  audio: {
    enabled: boolean
    sources: Array<"user" | "shopper" | "staff" | "participant" | "child">
  }
  video: {
    enabled: boolean
    framePurpose: "cooking" | "shopping" | "menu" | "scan" | null
    defaultFrameIntervalMs: number | null
  }
  events: Array<
    | "scan_result"
    | "timer_fired"
    | "menu_answer"
    | "order_event"
    | "user_action"
    | "brain_context_update"
  >
}
```

Stimuli are not all treated equally. A red scan result can interrupt. A stable video frame usually should not. A waiter answer must be translated and summarized. A timer fire must be spoken immediately.

## Capabilities

A capability is an allowed action. It can be a local session action, a Brain tool, or a feature state-machine action.

```typescript
type MiraCapability = {
  name: string
  owner: "mira_session" | "brain" | "feature_state_machine"
  blocking: boolean
  description: string
}
```

Examples:

| Scene | Capability | Owner |
|---|---|---|
| cooking | `schedule_timer` | mira_session |
| cooking | `write_memory` | brain |
| cooking | `save_recipe_note` | brain |
| bela_shopper | `propose_substitution` | feature_state_machine |
| bela_shopper | `explain_blocked_item` | mira_session |
| menu_language_bridge | `translate_staff_answer` | mira_session |
| menu_language_bridge | `save_menu_session_summary` | feature_state_machine |
| recipe_review | `save_recipe_variant` | brain |
| kid_co_scan | `mute_voice` | feature_state_machine |

Mira may only call capabilities declared by the scene.

## Privacy Boundary

```typescript
type MiraPrivacyBoundary = {
  rawAudioStorage: "never" | "explicit_consent_only"
  rawVideoStorage: "never" | "explicit_consent_only"
  transcriptStorage: "none" | "summary_only" | "turns_allowed"
  canRevealConstraintsToAudience: boolean
  canRevealFullProfile: false
  durableWrites: "none" | "brain_only" | "feature_only" | "brain_and_feature"
}
```

Default stance:

- raw audio/video are transient
- full profile is never revealed
- scenes expose only the context needed for the job
- durable writes use Brain or the owning feature state machine

## Speech Policy

```typescript
type MiraSpeechPolicy = {
  defaultMode: "answer_only" | "proactive_when_useful" | "translator_turns" | "teaching_prompt"
  canInterrupt: boolean
  shouldAskClarifyingQuestions: boolean
  maxUtteranceSeconds: number
  silenceIsAllowed: boolean
}
```

Speech examples:

- Cooking: proactive when useful, can interrupt for safety or timers.
- Bela shopper: brief, practical, shopper-only.
- Menu bridge: translator turns, summarizes safety-critical staff answers before ordering.
- Kid co-scan: teaching prompt, short, parent-safe, no pressure.

## Scene Builder Rule

Every feature that starts Mira must own a scene builder.

```typescript
async function buildCookingMiraScene(input: {
  userId: string
  sessionId: string
  recipeId: string | null
}): Promise<MiraScene<CookingSituation>>
```

Builder responsibilities:

1. Load only the Brain context slice needed.
2. Build and validate feature situation context.
3. Declare allowed stimuli.
4. Declare allowed capabilities.
5. Set privacy and speech policies.
6. Return a complete `MiraScene` before the session opens.

The Mira runtime executes the scene. The feature builder authors the scene.

## Runtime Flow

```text
Feature entry point
  → build MiraScene
  → start MiraSession(scene)
  → stream audio/video/events as MiraStimulus
  → Mira decides: ignore, speak, ask, call capability, or update scene summary
  → scene ends
  → durable writes go to Brain or feature state machine
```

## Why This Matters

Without `MiraScene`, the app drifts into separate agents and duplicate prompts.

With `MiraScene`, Brioela gets one coherent live presence that can be plugged into any surface without losing context, privacy, or product identity.
