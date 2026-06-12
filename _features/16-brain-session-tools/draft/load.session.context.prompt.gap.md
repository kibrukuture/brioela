# Draft: load.session.context.prompt.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/_prompts/load.session.context.prompt.ts`

**Gap (feature 16):** Tool description for agent SDK.

---

## Intended production file (full snapshot — not yet created)

```typescript
export const loadSessionContextPrompt = [
	'Load previous session outcome and carry-over context at session start.',
	'Call ONCE per session before the first user turn is processed — not mid-session.',
	'Returns: last completed session, recent outcome summaries (default 3), pending alarms, active memory namespaces, and last abandoned session warning.',
	'Use search_session_history when the user asks about events older than the recent window.',
	'Does not load turn transcripts, user memory facts, skills, or personality — those are in the system prompt.',
].join(' ')
```

Add to `_tools/_prompts/index.ts`:

```typescript
export * from './load.session.context.prompt'
```
