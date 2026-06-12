# Gap snapshot: find-submission.sheet.tsx

Target: `mobile/features/ground/components/find-submission.sheet.tsx`

**Status:** Not in repo. From `brioela-specs/35` voice-to-find flow, `03-find-submission-flow.md`.

```typescript
import { useCallback, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import type { FindSignalType } from '@brioela/shared/validator/find'
import { useFindSubmit } from '../hooks/use.find.submit.hook'
import { useLocalSpeechRecognition } from '@/hooks/use-local-speech-recognition'
import { GateRejectionBanner } from './gate-rejection.banner'

type FindSubmissionSheetProps = {
  locationId: string
  locationName?: string
  prefilledProductName?: string
  defaultSignalType?: FindSignalType
  onClose: () => void
  onSubmitted: () => void
}

export function FindSubmissionSheet({
  locationId,
  locationName,
  prefilledProductName,
  defaultSignalType = 'general',
  onClose,
  onSubmitted,
}: FindSubmissionSheetProps) {
  const [content, setContent] = useState('')
  const [signalType, setSignalType] = useState<FindSignalType>(defaultSignalType)
  const { submitFind, isPending, gateError, clearGateError } = useFindSubmit()
  const { transcript, isListening, startListening, stopListening, resetTranscript } =
    useLocalSpeechRecognition()

  useIsomorphicLayoutEffect(() => {
    if (transcript && !isListening) {
      setContent(transcript)
      resetTranscript()
    }
  }, [transcript, isListening, resetTranscript])

  const handleDictation = useCallback(async () => {
    if (isListening) {
      await stopListening()
    } else {
      await startListening()
    }
  }, [isListening, startListening, stopListening])

  const handleSubmit = async () => {
    clearGateError()
    const result = await submitFind({
      locationId,
      signalType,
      content,
      capturedAt: new Date().toISOString(),
      source: isListening ? 'voice' : 'manual',
    })
    if (result.ok) {
      onSubmitted()
    }
  }

  return (
    <View>
      {locationName && <Text>{locationName}</Text>}
      {prefilledProductName && <Text>{prefilledProductName}</Text>}

      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="What did you notice, specifically?"
        maxLength={280}
        multiline
      />

      <SignalTypePicker value={signalType} onChange={setSignalType} />

      <Pressable onPress={handleDictation}>
        <Text>{isListening ? 'Stop dictation' : 'Dictate'}</Text>
      </Pressable>

      {gateError && (
        <GateRejectionBanner
          rejectionReason={gateError.rejectionReason}
          onEdit={() => clearGateError()}
        />
      )}

      <Pressable onPress={handleSubmit} disabled={isPending || content.length < 10}>
        <Text>Submit Find</Text>
      </Pressable>
      <Pressable onPress={onClose}>
        <Text>Cancel</Text>
      </Pressable>
    </View>
  )
}
```

**Privacy:** voice audio processed locally; only transcript sent to formatting/gate layer. Audio discarded immediately (`spec 35`).
