# Gap snapshot: cooking.tool.declarations.ts

Target: `backend/src/agents/mira/_constants/cooking.tool.declarations.ts`

**Status:** Not in repo. From `implementable-specs/cooking-session/04-tool-protocol.md`.

```typescript
export type GeminiFunctionDeclaration = {
	name: string
	description: string
	parameters: {
		type: 'OBJECT'
		properties: Record<string, { type: string; description?: string; enum?: string[] }>
		required: string[]
	}
}

export const COOKING_TOOL_DECLARATIONS: GeminiFunctionDeclaration[] = [
	{
		name: 'schedule_timer',
		description:
			'Set a cooking timer for a specified duration. Call when the user asks to time something. Do not ask for confirmation.',
		parameters: {
			type: 'OBJECT',
			properties: {
				label: { type: 'STRING', description: 'What the timer is for. E.g. "eggs", "onions".' },
				seconds: { type: 'INTEGER', description: 'Duration in seconds.' },
			},
			required: ['label', 'seconds'],
		},
	},
	{
		name: 'cancel_timer',
		description: 'Cancel a previously set cooking timer by label.',
		parameters: {
			type: 'OBJECT',
			properties: {
				label: { type: 'STRING', description: 'The timer label to cancel.' },
			},
			required: ['label'],
		},
	},
	{
		name: 'write_session_note',
		description:
			'Write a note about something notable in this cooking session. Not for routine steps.',
		parameters: {
			type: 'OBJECT',
			properties: {
				note: { type: 'STRING', description: 'Plain text, 10–300 characters.' },
			},
			required: ['note'],
		},
	},
	{
		name: 'write_memory',
		description: 'Write a persistent fact about the user. Not for session-only observations.',
		parameters: {
			type: 'OBJECT',
			properties: {
				namespace: { type: 'STRING', description: 'Memory namespace.' },
				key: { type: 'STRING', description: 'Fact identifier.' },
				value: { type: 'OBJECT', description: 'JSON object with fact content.' },
				importance: { type: 'INTEGER', description: '1–10 importance.' },
			},
			required: ['namespace', 'key', 'value', 'importance'],
		},
	},
	{
		name: 'propose_constraint',
		description: 'Propose a new dietary constraint. Unconfirmed until user confirms.',
		parameters: {
			type: 'OBJECT',
			properties: {
				constraint_type: {
					type: 'STRING',
					enum: ['allergy', 'intolerance', 'dislike', 'religious', 'boycott'],
				},
				ingredient: { type: 'STRING', description: 'Ingredient or food.' },
				reason: { type: 'STRING', description: 'Why (optional).' },
			},
			required: ['constraint_type', 'ingredient'],
		},
	},
	{
		name: 'view_recipe',
		description: "Load a recipe from the user's saved recipes by title.",
		parameters: {
			type: 'OBJECT',
			properties: {
				title: { type: 'STRING', description: 'Recipe title to look up.' },
			},
			required: ['title'],
		},
	},
]

export const DIRECT_COOKING_TOOLS = new Set(['schedule_timer', 'cancel_timer'])

export const FORWARD_COOKING_TOOLS = new Set([
	'write_memory',
	'propose_constraint',
	'view_recipe',
	'write_session_note',
])

export const COOKING_TO_BRAIN_TOOL_MAP: Record<string, string> = {
	write_memory: 'write_user_memory',
	propose_constraint: 'propose_user_constraint',
	view_recipe: 'view_user_recipe',
	write_session_note: 'log_memory_event',
}
