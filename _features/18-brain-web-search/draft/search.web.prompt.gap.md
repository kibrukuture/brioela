# Draft: search.web.prompt.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/_prompts/search.web.prompt.ts`

**Gap (feature 18):** Tool description for AI SDK `tool({ description })`.

---

## Intended production file (full snapshot — not yet created)

```typescript
export const searchWebPrompt = [
	'Search the live web for current factual or research information not available in user memory, skills, recipes, or session history.',
	'Use search_type factual for specific single-answer questions (food safety, nutrition facts, ingredient properties).',
	'Use search_type research for open conceptual questions (health benefit overviews, technique comparisons, cultural food history).',
	'Always check read_user_memory, view_user_recipe, and search_session_history before calling this tool.',
	'Cite result URLs in your reply — do not fabricate sources.',
	'Default max_results 5; increase only when comparing multiple sources.',
	'Set include_full_content true only when snippets are insufficient (full recipe text, detailed breakdown).',
].join(' ')
```
