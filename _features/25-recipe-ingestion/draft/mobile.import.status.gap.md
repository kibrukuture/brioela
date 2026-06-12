# Gap snapshot: mobile import status UI

Target: `mobile/features/recipe-import/`

**Status:** Not in repo. `07-import-status-and-growth-loop.md`.

```tsx
// mobile/features/recipe-import/hooks/use.import.status.hook.ts
import { useQuery } from '@tanstack/react-query'
import { getImportStatus } from '@/network/recipes/get-import-status.api'

export function useImportStatus(jobId: string | null) {
	return useQuery({
		queryKey: ['recipe-import', jobId],
		queryFn: () => getImportStatus(jobId!),
		enabled: Boolean(jobId),
		refetchInterval: (query) => {
			const status = query.state.data?.status
			if (!status || status === 'completed' || status === 'failed' || status === 'partial') {
				return false
			}
			return 2000
		},
	})
}

// mobile/features/recipe-import/components/import-status-tray.tsx
import { Text, Pressable, View } from 'react-native'
import { useImportStatus } from '../hooks/use.import.status.hook'

export function ImportStatusTray({ jobId, onOpenRecipe }: { jobId: string; onOpenRecipe: (id: string) => void }) {
	const { data } = useImportStatus(jobId)
	if (!data) return null

	const copy =
		data.status === 'completed'
			? 'Recipe imported.'
			: data.status === 'needs_review'
				? 'Recipe imported, but a few details need review.'
				: data.status === 'partial'
					? 'Source saved, but I could not fully extract the recipe.'
					: 'Turning this into a recipe...'

	return (
		<View>
			<Text>{copy}</Text>
			{data.warnings.map((warning) => (
				<Text key={warning}>{warning}</Text>
			))}
			{data.recipeId && data.status !== 'partial' ? (
				<Pressable onPress={() => onOpenRecipe(data.recipeId!)}>
					<Text>Open recipe</Text>
				</Pressable>
			) : null}
		</View>
	)
}
```
