# Draft: kid.co.scan.shell.tsx (gap — file does not exist)

Target: `mobile/features/kids.mode/_components/kid.co.scan.shell.tsx`

**Gap:** No supervised co-scan mobile shell.

**Source:** `build-guide/21-kids-mode/07-kid-co-scan-mode.md`

---

```tsx
import { Text, View } from 'react-native'
import { ParentControlBar } from './parent.control.bar'
import { AgeRangePicker } from './age.range.picker'
import { useKidCoScanSession } from '../_hooks/use.kid.co.scan.session.hook'

type KidCoScanShellProps = {
	onEnd: () => void
}

export function KidCoScanShell({ onEnd }: KidCoScanShellProps) {
	const {
		session,
		needsAgePick,
		startSession,
		endSession,
		muteVoice,
		showAdultDetails,
		shareLearningCard,
		changeAgeRange,
		voiceMuted,
	} = useKidCoScanSession()

	if (!session && needsAgePick) {
		return (
			<View className="flex-1 gap-4 p-4">
				<Text className="text-lg font-semibold">How old is the child scanning?</Text>
				<AgeRangePicker onSelect={(range) => void startSession({ ageRange: range })} />
			</View>
		)
	}

	if (!session) {
		return (
			<View className="flex-1 items-center justify-center p-4">
				<Text
					className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground"
					onPress={() => void startSession({})}
				>
					Let my kid scan
				</Text>
			</View>
		)
	}

	return (
		<View className="flex-1">
			<View className="border-b border-border px-4 py-3">
				<Text className="text-center text-base font-semibold">Kid Scan Mode</Text>
				<Text className="text-center text-sm text-muted-foreground">
					Scan something together.
				</Text>
			</View>

			<View className="flex-1">{/* Scanner surface from mobile/features/scanner — 24 */}</View>

			<ParentControlBar
				voiceMuted={voiceMuted}
				onEnd={() => {
					void endSession()
					onEnd()
				}}
				onMuteVoice={muteVoice}
				onShowAdultDetails={showAdultDetails}
				onShareLearningCard={shareLearningCard}
				onChangeAgeRange={changeAgeRange}
			/>
		</View>
	)
}
```
