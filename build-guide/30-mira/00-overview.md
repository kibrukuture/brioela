# Mira — Live Presence Runtime

## What Mira Is

Mira is Brioela's live presence in a moment.

Mira is the Brioela intelligence that can hear, see, speak, receive situational stimuli, use approved tools, and act inside the user's current context. When the user is cooking, shopping through Bela, talking to restaurant staff, reviewing an uncertain recipe, scanning with a child, or asking follow-up questions from a live surface, Mira is the one who shows up.

Mira is not a padded name for "voice/video agent." Mira is the product and architecture name for the same live being that appears across Brioela surfaces.

## Mira vs Brain

Brioela has two core AI concepts:

| Concept | Scope | Owns | Does not own |
|---|---|---|---|
| BrioelaBrain | Permanent per-user intelligence | private SQLite memory, constraints, recipes, skills, alarms, durable user truth | live media transport, camera/audio session presence |
| Mira | Temporary live session presence | audio/video session, role prompt, active stimuli, realtime tools, moment-to-moment speech decisions | permanent memory authority, full user profile exposure, shared data ownership |

Brain remembers. Mira shows up.

Mira starts with context from Brain, works inside a specific role, then writes durable outcomes back through Brain or the owning feature state machine. Mira does not become a second source of truth.

## Mira Roles

Mira is generic, but never vague. Every Mira session has a role.

```typescript
type MiraRole =
  | "cooking"
  | "bela_shopper"
  | "menu_language_bridge"
  | "recipe_review"
  | "scan_followup"
  | "kid_explanation"
  | "kid_co_scan"
```

Role examples:

- `cooking`: Mira watches the kitchen, hears the cook, speaks timing and technique guidance, handles timers, and captures recipe knowledge.
- `bela_shopper`: Mira helps the shopper find safe substitutes, interpret labels, and follow order constraints without exposing the user's full private profile.
- `menu_language_bridge`: Mira speaks between the user and restaurant staff using the menu scan, waiter questions, language context, and minimum necessary food constraints.
- `recipe_review`: Mira talks through uncertainty, substitutions, allergies, missing quantities, and imported recipe repair before cooking.
- `scan_followup`: Mira explains or investigates a scan result when text UI is not enough.
- `kid_explanation`: Mira briefly changes tone for one child-facing explanation, then returns to the adult session.
- `kid_co_scan`: Mira speaks to the child in a parent-supervised scanning shell while preserving parent safety control.

## Stimuli

Mira does not run from a single prompt. Mira runs from live stimuli plus injected context.

```typescript
type MiraStimulus =
  | { type: "audio"; source: "user" | "shopper" | "staff" | "participant" }
  | { type: "video_frame"; source: "camera"; purpose: "cooking" | "shopping" | "menu" | "scan" }
  | { type: "scan_result"; productId: string; verdict: "green" | "yellow" | "red" }
  | { type: "timer_fired"; timerId: string; label: string }
  | { type: "menu_answer"; dishId: string; staffLanguage: string }
  | { type: "order_event"; orderId: string; event: string }
  | { type: "user_action"; action: string }
  | { type: "brain_context_update"; reason: string }
```

Stimuli can arrive many times during a session: audio every moment, visual frames every few seconds, timer events, scan results, order updates, waiter replies, or context updates from Brain. Mira's job is to decide what matters now, what should be ignored, what needs a tool call, and when speech is useful.

## Context Injection

Every Mira session is built from these layers, in order:

1. Mira identity and behavior contract.
2. Role-specific instruction.
3. Minimum necessary Brain context.
4. Situation context from the owning feature.
5. Active tools and tool boundaries.
6. Safety, privacy, and consent rules.
7. Recent session turns and active stimuli summary.

Examples:

- Cooking Mira receives recipe, phase, timers, constraints, selected memory, and kitchen frame summaries.
- Bela shopper Mira receives order items, allowed substitutes, blocked ingredients, store context, and the shopper's live scans.
- Menu Mira receives parsed dishes, waiter questions, user language, staff language, and only the constraints needed for ordering.
- Recipe review Mira receives imported recipe uncertainty, conflicts, possible substitutions, and allowed write actions.

## Speech Rule

Mira is present, not noisy.

Mira may listen and watch continuously, but speaks only when useful:

- user asked a question
- safety issue needs immediate attention
- timer or step timing matters
- visual change suggests a mistake or opportunity
- staff/shopper/user answer requires translation or summary
- the current session would fail without a clarification

Silence is valid behavior. Mira should feel like a capable person in the room, not an assistant waiting to fill every gap.

## Privacy Boundary

Mira is live and temporary.

Rules:

- Do not store raw audio by default.
- Do not store raw video by default.
- Store transcripts, summaries, memory events, recipes, substitutions, and order decisions only when the owning feature requires it.
- Expose the minimum user context needed for the role.
- Never reveal a user's full private profile to shoppers, staff, guests, or children.
- Durable writes go through Brain or the owning feature state machine.
- Public/shared data writes must follow that feature's privacy rules.

## Runtime Shape

Mira usually uses:

- Gemini Live for full-duplex voice and vision reasoning.
- Cloudflare Realtime / RealtimeKit for rooms, participants, and media transport when a room is needed.
- An Agent-backed Durable Object for recoverable session state when the session needs timers, reconnection, transcripts, or tool control.
- Brain DO RPC for private memory reads/writes and durable user truth.

Not every Mira role needs video or a room. Voice-only and text-escalation sessions should use the smallest runtime that preserves the behavior and privacy rules.

## Naming Rules

Use Mira when describing the live person-like Brioela presence.

Good names:

- Mira
- Mira session
- Mira role
- Mira runtime
- Mira stimuli
- Mira speech policy

Avoid vague or padded names:

- voice/video agent
- presence agent
- shopper AI
- cooking AI
- common realtime assistant surface

Low-level class names may stay technical while implementation is still being designed, but docs should make clear whether a class is Mira's session runtime, a feature state machine, or Brain-owned durable memory.
