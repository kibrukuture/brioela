# Gap snapshot: compute-voice-activity.helper.ts

Target: `backend/src/agents/mira/_helpers/compute-voice-activity.helper.ts`

**Status:** Not in repo. Authoritative: `implementable-specs/cooking-session/mira-speech-decision-engine/01-silence-tracker.md` §Voice Activity Signal.

The Cloudflare Realtime SFU adapter delivers audio as PCM inside protobuf packets. Current public docs do not guarantee VAD metadata from the adapter, so Brioela computes voice activity locally from PCM energy. The Mira session runtime calls `speechEngine.onVoiceActivity(hasVoiceActivity)` after this helper evaluates each audio payload.

```typescript
/** Minimum RMS energy level to classify a PCM frame as voice activity. */
const VOICE_ACTIVITY_THRESHOLD = 0.02

/**
 * Computes whether a raw PCM audio buffer contains voice activity.
 *
 * Input: 16-bit signed PCM samples as ArrayBuffer (little-endian).
 * Output: true if RMS energy exceeds threshold — user is likely speaking.
 *
 * Not a full VAD model. Energy-threshold approach is sufficient for
 * detecting speaking vs. silence in a cooking environment where ambient
 * kitchen noise is low-to-moderate.
 */
export function computeVoiceActivity(pcmBuffer: ArrayBuffer): boolean {
	const samples = new Int16Array(pcmBuffer)
	if (samples.length === 0) return false

	let sumOfSquares = 0
	for (let i = 0; i < samples.length; i++) {
		const normalized = (samples[i]! / 32768)
		sumOfSquares += normalized * normalized
	}

	const rms = Math.sqrt(sumOfSquares / samples.length)
	return rms > VOICE_ACTIVITY_THRESHOLD
}
```
