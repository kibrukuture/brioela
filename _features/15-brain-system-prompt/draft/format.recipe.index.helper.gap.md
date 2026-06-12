# Draft: format.recipe.index.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/format.recipe.index.helper.ts`

**Gap (feature 15):** Block 6 formatter. Shape is `id: title` per `09-recipes.md` — not ledger "title + description".

---

## Intended production file (full snapshot — not yet created)

```typescript
type RecipeIndexRow = {
	id: string
	title: string
}

export function formatRecipeIndex(rows: RecipeIndexRow[]): string {
	const lines: string[] = [
		'## Recipe index',
		'Call view_user_recipe(id) to load full content when needed.',
		'',
	]

	for (const row of rows) {
		lines.push(`- ${row.id}: ${row.title}`)
	}

	return lines.join('\n')
}
```

Source: `implementable-specs/09-recipes.md`; `implementable-specs/brioela-tools/13-view-user-recipe.md`.
