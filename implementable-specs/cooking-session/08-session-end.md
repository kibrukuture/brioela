# Cooking Session — Session End

## How a Session Ends

A cooking session ends in one of four ways:

| End Type | Trigger | `session_end_reason` |
|---|---|---|
| User ended | User says "we're done" / taps end button | `'user_ended'` |
| Mobile disconnected | Mobile WebSocket closed, no reconnect within 5 minutes | `'mobile_disconnected'` |
| Session timeout | Session exceeded 90 minutes with no activity | `'timeout'` |
| Error | Gemini session failed and could not reconnect | `'error'` |

All end types follow the same cleanup sequence. The depth of recipe reconstruction depends on how much transcript was captured before the end.

---

## End Sequence

```typescript
async endSession(reason: SessionEndReason): Promise<void> {
  if (this.sessionState.status === 'ending' || this.sessionState.status === 'ended') return

  this.sessionState.status = 'ending'

  // 1. Write system event to transcript
  await this.writeSystemEvent(`Cooking session ended: ${reason}`)

  // 2. Close Gemini WebSocket gracefully
  if (this.sessionState.geminiWs) {
    this.sessionState.geminiWs.close(1000, 'session_ended')
    this.sessionState.geminiWs = null
  }

  // 3. Cancel any pending Gemini reconnect timer
  if (this.sessionState.geminiReconnectTimer) {
    clearTimeout(this.sessionState.geminiReconnectTimer)
    this.sessionState.geminiReconnectTimer = null
  }

  // 4. Cancel all pending cooking timers
  await this.cancelAllTimers()

  // 5. Close RealtimeKit room
  await this.closeRealtimeRoom()

  // 6. Close mobile WebSocket
  if (this.sessionState.mobileWs) {
    this.sessionState.mobileWs.close(1000, 'session_ended')
    this.sessionState.mobileWs = null
  }

  // 7. Run end-of-session processing (recipe, outcome_summary)
  await this.runSessionEndProcessing(reason)

  // 8. Update session row in SQLite
  await this.finalizeSessionRow(reason)

  // 9. Clear turn counter from agent_state
  await this.deleteAgentState(`turn_counter.${this.sessionState.sessionId}`)

  // 10. Clear active_session_id from agent_state (via Brain)
  await this.forwardToolToBrain('clear_active_session', {})

  this.sessionState.status = 'ended'
}
```

---

## Cancelling All Active Timers

```typescript
private async cancelAllTimers(): Promise<void> {
  for (const [label] of this.activeTimers) {
    try {
      await this.cancelTimer(label)
    } catch {
      // Best effort — session is ending regardless
    }
  }
  this.activeTimers.clear()
  await this.state.storage.deleteAlarm()
}
```

---

## End-of-Session Processing

This is where the cooking session becomes a permanent record. Three steps: recipe decision, outcome_summary construction, memory consolidation.

```typescript
private async runSessionEndProcessing(reason: SessionEndReason): Promise<void> {
  if (reason === 'error' && this.sessionState.turnCounter < 3) {
    // Session failed almost immediately — nothing to reconstruct
    await this.writeOutcomeSummary({ type: 'aborted', reason })
    return
  }

  // Load full transcript from session_turns
  const transcript = await this.loadSessionTranscript()

  // Run recipe decision tree (see below)
  const recipeDecision = await this.runRecipeDecision(transcript)

  // Build outcome_summary
  await this.writeOutcomeSummary({
    type:           reason === 'user_ended' ? 'completed' : reason,
    recipe_action:  recipeDecision.action,
    recipe_id:      recipeDecision.recipeId,
    session_notes:  recipeDecision.notes,
    duration_turns: this.sessionState.turnCounter,
  })
}
```

---

## Recipe Decision Tree

Implemented via an LLM call to the Brain (the Brain runs a lightweight completion with the transcript). The CookingAgent DO calls the Brain with the full transcript and gets back a structured decision.

```typescript
private async runRecipeDecision(transcript: SessionTurn[]): Promise<RecipeDecision> {
  const resp = await this.forwardToolToBrain('run_recipe_decision', {
    session_id:  this.sessionState.sessionId,
    transcript:  transcript.map(t => `[${t.role}] ${t.content}`).join('\n'),
  })

  return resp as RecipeDecision
}
```

The `run_recipe_decision` tool on the Brain runs the decision tree from `09-recipes.md`:

```
1. Did the session involve cooking something specific?
   → No → no recipe action. Note in outcome_summary.

2. Does a recipe for this dish already exist?
   → Yes + minor variation → increment cook_count, update last_cooked
   → Yes + meaningful variation → propose update or variant creation

3. Was the session complete enough to reconstruct?
   → No (session ended early, dish unfinished) → flag as incomplete

4. Is this a new recipe with enough signal?
   → Yes → run recipe-reconstruction skill → insert new recipe row
```

The decision is never automatic. The Brain LLM reasons from the transcript. The result is:

```typescript
interface RecipeDecision {
  action:    'new_recipe' | 'update_existing' | 'increment_count' | 'no_action' | 'incomplete'
  recipeId?: string      // for update_existing / increment_count
  notes?:    string      // what the LLM noted about the session's cooking
}
```

---

## outcome_summary Construction

`outcome_summary` is a human-readable JSON object written to the `sessions` table. It is what the next session's `load_session_context` loads to give the AI context about what happened last time.

```typescript
private async writeOutcomeSummary(data: OutcomeSummaryData): Promise<void> {
  const summary = {
    completed:      data.type === 'completed',
    end_reason:     data.reason ?? data.type,
    recipe_action:  data.recipe_action ?? 'none',
    recipe_id:      data.recipe_id,
    session_notes:  data.session_notes,
    duration_turns: data.duration_turns,
    timers_used:    this.timerHistory,   // labels of all timers set during session
    tools_called:   this.toolCallHistory, // names of all tool calls during session
  }

  await this.forwardToolToBrain('finalize_session', {
    session_id:      this.sessionState.sessionId,
    outcome_summary: JSON.stringify(summary),
    end_reason:      data.type,
  })
}
```

Example `outcome_summary` for a completed doro wat session:
```json
{
  "completed": true,
  "end_reason": "user_ended",
  "recipe_action": "new_recipe",
  "recipe_id": "uuid-of-new-recipe",
  "session_notes": "First time making grandma's doro wat. Reduced berbere by half. Used niter kibbeh instead of butter. Extra onion caramelization time noted.",
  "duration_turns": 47,
  "timers_used": ["onions", "chicken", "eggs"],
  "tools_called": ["schedule_timer", "schedule_timer", "schedule_timer", "write_session_note", "write_memory"]
}
```

---

## Finalizing the Session Row

```typescript
private async finalizeSessionRow(reason: SessionEndReason): Promise<void> {
  await this.forwardToolToBrain('update_session_status', {
    session_id: this.sessionState.sessionId,
    status:     'completed',
    end_reason: reason,
    ended_at:   Date.now(),
  })
}
```

After this, the session row has `status: 'completed'`, `ended_at` timestamp, `end_reason`, and the full `outcome_summary`. The next session's `load_session_context` call will find this row.

---

## Error End — Partial Session

If the session ends due to error (repeated Gemini reconnect failures, DO eviction without recovery), the end sequence still runs — it just produces a partial record:

```typescript
if (reason === 'error') {
  // Write whatever transcript exists
  // Run recipe decision on partial transcript
  // outcome_summary.completed = false
  // session row status = 'incomplete'
}
```

A partial session still has value: the turns that were captured, any timers that ran, any tool calls that succeeded. The incomplete record is better than nothing — it prevents the next session from having no context.
