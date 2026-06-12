# Draft: search.session.history.prompt.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/_prompts/search.session.history.prompt.ts`

**Gap (feature 16):** Tool description for agent SDK.

---

## Intended production file (full snapshot — not yet created)

```typescript
export const searchSessionHistoryPrompt = [
	'Search past session outcome summaries by keyword or phrase using FTS5.',
	'Use when the user asks about a past event not in the recent session context from load_session_context.',
	'Do not call if the answer is already in loaded context, or if the question is about user_memory facts or a specific recipe — use read_user_memory or view_user_recipe instead.',
	'Latin queries use word tokenizer; non-Latin (Arabic, Amharic, CJK) use trigram tokenizer automatically.',
	'Returns completed sessions only, ordered by ended_at descending. Empty results are not an error — simplify the query and retry.',
	'For meaning-based semantic search without keywords, use Vectorize (separate path — not this tool).',
].join(' ')
```

Add to `_tools/_prompts/index.ts`:

```typescript
export * from './search.session.history.prompt'
```
