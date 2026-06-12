# Draft: mesa.compatibility.row.tsx (gap — file does not exist)

Target: `mobile/features/mesa/components/mesa.compatibility.row.tsx`

**Gap:** No mobile surface for per-scan Mesa verdict strip.

**Source:** `build-guide/26-mesa/06-feature-integration.md`

---

```tsx
import { View, Text } from 'react-native'
import type { MesaCompatibilityResult } from '@shared/validator/mesa/mesa.compatibility.result.schema'

type MesaCompatibilityRowProps = {
	result: MesaCompatibilityResult
}

export function MesaCompatibilityRow({ result }: MesaCompatibilityRowProps) {
	if (result.overall === 'works_for_all') {
		return (
			<View>
				<Text>Mesa: works for everyone.</Text>
			</View>
		)
	}

	const avoidMember = result.memberResults.find((m) => m.verdict === 'red')
	if (avoidMember) {
		return (
			<View>
				<Text>
					Mesa: avoid for {avoidMember.label} — {avoidMember.reason}
				</Text>
			</View>
		)
	}

	return (
		<View>
			<Text>{result.summary}</Text>
		</View>
	)
}
```
