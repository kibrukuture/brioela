# Gap snapshot: find-draft.card.tsx

Target: `mobile/features/ground/components/find-draft.card.tsx`

**Status:** Not in repo. From 35b Angle 2, `build-guide/09-ground/03-find-submission-flow.md`.

```typescript
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import type { FindDraftFromScan } from '@brioela/shared/validator/find'
import { useFindSubmit } from '../hooks/use.find.submit.hook'

type FindDraftCardProps = {
  draft: FindDraftFromScan
  scanId: string
  onDismiss: () => void
  onSubmitted: (findId: string) => void
}

export function FindDraftCard({ draft, scanId, onDismiss, onSubmitted }: FindDraftCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedContent, setEditedContent] = useState(draft.content)
  const { submitDraft, isPending, gateError } = useFindSubmit()

  const handleSubmit = async () => {
    const result = await submitDraft({
      scanId,
      draftId: draft.draftId,
      content: editedContent,
      locationId: draft.locationId,
      signalType: draft.signalType,
    })
    if (result.ok && result.findId) {
      onSubmitted(result.findId)
    }
  }

  if (!expanded) {
    return (
      <Pressable onPress={() => setExpanded(true)} accessibilityRole="button">
        <View>
          <Text>Draft Find — tap to review</Text>
          <Text numberOfLines={1}>{draft.content}</Text>
        </View>
      </Pressable>
    )
  }

  return (
    <View>
      <Text>{draft.locationName}</Text>
      {editMode ? (
        <TextInputMultiline value={editedContent} onChangeText={setEditedContent} maxLength={280} />
      ) : (
        <Text>{editedContent}</Text>
      )}
      {gateError && <Text>{gateError.rejectionReason}</Text>}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable onPress={handleSubmit} disabled={isPending}>
          <Text>Submit</Text>
        </Pressable>
        <Pressable onPress={() => setEditMode(true)}>
          <Text>Edit</Text>
        </Pressable>
        <Pressable onPress={onDismiss}>
          <Text>Dismiss</Text>
        </Pressable>
      </View>
    </View>
  )
}
```

Rendered below green/yellow scan result when `locationId` known (**24** integration). Luma entitlement check before Submit.
