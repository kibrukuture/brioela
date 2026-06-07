# Cooking Session — Session End and Recipe Reconstruction

## What This File Covers

Four ways a session ends, the end sequence step by step, the recipe decision tree, outcome_summary construction, and memory consolidation back to the Orchestrator DO.

---

## Four End Types

| End type | Trigger | `end_reason` |
|---|---|---|
| User ended | User says "we're done" / taps end button | `'user_ended'` |
| Mobile disconnected | Mobile WebSocket closed, no reconnect within 5 minutes | `'mobile_disconnected'` |
| Session timeout | Session exceeded 90 minutes with no activity | `'timeout'` |
| Error | Gemini session failed and could not reconnect | `'error'` |

---

## End Sequence

```typescript
// backend/src/agents/cooking/_handlers/end-session.handler.ts

export async function endSession(
  reason:    SessionEndReason,
  cookingDo: CookingAgent,
): Promise<void> {
  const state = cookingDo.sessionState!
  if (state.status === 'ending' || state.status === 'ended') return

  state.status = 'ending'

  // 1. Write system event to transcript
  await writeTranscriptTurn({
    sessionId:  state.sessionId,
    userId:     state.userId,
    role:       'tool_result',
    content:    `[SESSION ENDED: ${reason}]`,
    toolName:   'session_end',
    cookingDo,
  })

  // 2. Close Gemini WebSocket
  if (state.geminiWs) {
    state.geminiWs.close(1000, 'session_ended')
    state.geminiWs = null
  }

  // 3. Cancel proactive reconnect timer
  if (state.geminiReconnectTimer) {
    clearTimeout(state.geminiReconnectTimer)
    state.geminiReconnectTimer = null
  }

  // 4. Cancel all cooking timers
  await cancelAllTimers(cookingDo)

  // 5. Close SFU adapters and end active RealtimeKit session
  await closeRealtimeAdapters(state.adapterIds, cookingDo.env)
  await endActiveRealtimeKitSession(state.meetingId, cookingDo.env)

  // 6. Close mobile WebSocket
  if (state.mobileWs) {
    state.mobileWs.close(1000, 'session_ended')
    state.mobileWs = null
  }

  // 7. Run end-of-session processing (recipe + outcome_summary + memory) as recoverable Agent work
  await cookingDo.runFiber(`cooking-session-end:${state.sessionId}`, async () => {
    await runSessionEndProcessing(reason, cookingDo)
  })

  // 8. Finalize session row via Orchestrator
  await forwardToolToOrchestrator('finalize_session', {
    sessionId:  state.sessionId,
    endReason:  reason,
    endedAt:    Date.now(),
  }, state, cookingDo.env)

  // 9. Clear turn counter and active_session_id from agent_state
  await forwardToolToOrchestrator('clear_session_state', {
    sessionId: state.sessionId,
  }, state, cookingDo.env)

  state.status = 'ended'
}
```

---

## Recipe Decision Tree

The agent does NOT blindly create a recipe row at session end. It runs a decision tree first.

```typescript
async function runSessionEndProcessing(
  reason:    SessionEndReason,
  cookingDo: CookingAgent,
): Promise<void> {
  const state = cookingDo.sessionState!

  // Aborted immediately — nothing to reconstruct
  if (reason === 'error' && state.turnCounter < 3) {
    await writeOutcomeSummary({
      sessionId: state.sessionId,
      type:      'aborted',
      reason,
      cookingDo,
    })
    return
  }

  // Load full transcript
  const turns = await loadSessionTranscript(state.sessionId, cookingDo.env)
  const sessionNotes = extractSessionNotes(turns)  // notes written via write_session_note tool

  // Decision tree — run as a quick Gemini inference (not Live — standard generateContent)
  const decision = await runRecipeDecision(turns, sessionNotes, cookingDo.env)

  switch (decision.action) {
    case 'create_new_recipe': {
      const recipe = await reconstructRecipe(turns, sessionNotes, cookingDo.env)
      await forwardToolToOrchestrator('create_recipe', {
        title:         recipe.title,
        source:        'cooking_session',
        sourceSession: state.sessionId,
        content:       JSON.stringify(recipe),
      }, state, cookingDo.env)
      break
    }

    case 'update_existing': {
      await forwardToolToOrchestrator('update_recipe', {
        recipeId: decision.existingRecipeId,
        updates:  decision.updates,
        note:     `Updated from cooking session ${state.sessionId}`,
      }, state, cookingDo.env)
      break
    }

    case 'increment_cook_count': {
      await forwardToolToOrchestrator('increment_cook_count', {
        recipeId: decision.existingRecipeId,
      }, state, cookingDo.env)
      break
    }

    case 'skip': {
      // No recipe action — session was conversation, not cooking
      break
    }
  }

  // Always write outcome_summary
  const summary = await buildOutcomeSummary(turns, sessionNotes, decision, cookingDo.env)
  await forwardToolToOrchestrator('write_outcome_summary', {
    sessionId: state.sessionId,
    summary,
  }, state, cookingDo.env)
}
```

---

## Recipe Decision Prompt

```typescript
const RECIPE_DECISION_PROMPT = `
You have a transcript from a cooking session. Decide what to do with it:

1. "create_new_recipe" — a dish was cooked, a new recipe should be saved
2. "update_existing" — a dish was cooked that already exists in the user's recipe collection
3. "increment_cook_count" — same dish, same technique, nothing new — just increment the count
4. "skip" — no cooking happened (pure conversation, recipe advice, no actual cooking)

Decision criteria:
- Was something actually cooked? (timer was set, cooking steps discussed, food described)
- Is it genuinely new (enough technique variation to warrant a new row)?
- Is the transcript complete enough to extract a recipe?

Also extract:
- dish title
- any recipe IDs mentioned if updating an existing recipe
- key new technique details if updating

Return JSON:
{
  "action": "create_new_recipe" | "update_existing" | "increment_cook_count" | "skip",
  "dishTitle": string | null,
  "existingRecipeId": string | null,
  "updates": string | null,
  "reasoning": string
}
`
```

---

## Recipe Reconstruction Prompt

Only runs when `decision.action === 'create_new_recipe'`:

```typescript
const RECIPE_RECONSTRUCTION_PROMPT = `
From this cooking session transcript and session notes, extract a structured recipe.

Be specific. Capture:
- Exact ingredient amounts (as stated or implied)
- Grandma's corrections and technique adjustments
- What the cook said about WHY they do things a certain way
- Timing from timers
- Cultural notes (if this is a traditional dish, preserve that context)

Do NOT invent anything not present in the transcript.
Mark uncertain fields with confidence: 0.7 (low) or 1.0 (high).

Return JSON:
{
  "title": string,
  "servings": number | null,
  "totalTimeMinutes": number | null,
  "ingredients": [{ "name": string, "amount": string, "confidence": number }],
  "steps": [{ "instruction": string, "duration_minutes": number | null, "confidence": number }],
  "culturalNotes": string | null,
  "techniques": string[],
  "source": "cooking_session"
}
`
```

---

## Outcome Summary Construction

Written to `sessions.outcome_summary`. Read by the next session's system instruction for continuity.

```typescript
const OUTCOME_SUMMARY_PROMPT = `
Write a concise summary of this cooking session for future reference. 
This will be read at the start of the next session.

Include:
- What was cooked (if anything)
- Key things learned or discovered
- Constraints proposed or confirmed
- Memories written
- Recipe saved or updated (if any)
- Anything the user said they want to remember

Keep it under 400 words. Be specific to this user and this session.
`
```

---

## Mobile Disconnect — Waiting for Reconnect

When the mobile WebSocket closes unexpectedly, the session does not end immediately. It waits for reconnect:

```typescript
function onMobileDisconnect(cookingDo: CookingAgent): void {
  const state = cookingDo.sessionState!
  if (state.status !== 'active') return

  state.status = 'mobile_reconnecting'

  // Persist a durable reconnect deadline instead of using setTimeout, which is lost on eviction.
  const deadline = Date.now() + 5 * 60 * 1000
  cookingDo.sql.exec(
    `UPDATE cooking_session_runtime SET mobile_disconnect_deadline = ?, status = ? WHERE session_id = ?`,
    deadline,
    'mobile_reconnecting',
    state.sessionId,
  )
  cookingDo.schedule(new Date(deadline), 'handleMobileDisconnectDeadline', { sessionId: state.sessionId }, { idempotent: true })
}
```

Gemini can continue receiving SFU audio while the mobile audio-out socket is disconnected, as long as the Realtime adapter and Gemini socket remain active. Do not reuse a single `reconnecting` status for both mobile and Gemini. `mobile_reconnecting` means only the output socket is missing; `gemini_reconnecting` means the model session itself is being restored. Any Gemini audio output during a mobile-only disconnect is dropped unless a separate app event/local notification path is used.
