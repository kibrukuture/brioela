# Gap snapshot: response-filter.ts

Target: `backend/src/agents/mira/mira-speech-decision/response-filter.ts`

**Status:** Not in repo. Authoritative: `implementable-specs/cooking-session/mira-speech-decision-engine/05-response-filter.md`.

```typescript
import type { ObservationResponse } from './types'

const SILENCE_PHRASES = [
	'ok',
	'okay',
	'everything looks fine',
	'looks good',
	'all good',
	'nothing to report',
	"i don't see anything",
	'nothing urgent',
	'looks normal',
	'carry on',
] as const

const URGENT_PATTERNS = [
	'smoke',
	'smoking',
	'burning',
	'burnt',
	'fire',
	'flame',
	'overflow',
	'overflowing',
	'boiling over',
	'too hot',
	'immediately',
	'right now',
	'quickly',
	'careful',
] as const

const TOPIC_KEYWORDS = [
	'onion',
	'garlic',
	'oil',
	'meat',
	'chicken',
	'berbere',
	'injera',
	'dough',
	'heat',
	'flame',
	'stir',
	'salt',
	'water',
	'sauce',
] as const

type TopicEntry = {
	topic: string
	saidAt: number
	response: string
}

export class NoRepeatMemory {
	private entries: TopicEntry[] = []
	private readonly maxEntries = 20
	private readonly repeatWindowMs = 3 * 60 * 1000

	add(response: string): void {
		const topic = this.extractTopic(response)
		this.entries.push({ topic, saidAt: Date.now(), response: response.slice(0, 100) })
		if (this.entries.length > this.maxEntries) {
			this.entries.shift()
		}
	}

	isRepeat(response: string): boolean {
		const topic = this.extractTopic(response)
		const cutoff = Date.now() - this.repeatWindowMs
		return this.entries.some((e) => e.topic === topic && e.saidAt > cutoff)
	}

	getRecentTopics(): string[] {
		const cutoff = Date.now() - this.repeatWindowMs
		return this.entries.filter((e) => e.saidAt > cutoff).map((e) => e.topic)
	}

	extractTopic(response: string): string {
		const lower = response.toLowerCase()
		const match = TOPIC_KEYWORDS.find((k) => lower.includes(k))
		return match ?? 'general'
	}
}

export class ResponseFilter {
	private readonly noRepeat = new NoRepeatMemory()

	getRecentTopics(): string[] {
		return this.noRepeat.getRecentTopics()
	}

	onObservationResponse(rawResponse: string): ObservationResponse {
		if (isSilent(rawResponse)) {
			return { forward: false, urgency: 'silent' }
		}

		const urgency = classifyUrgency(rawResponse)

		if (urgency === 'urgent') {
			this.noRepeat.add(rawResponse)
			return {
				forward: true,
				urgency: 'urgent',
				topic: this.noRepeat.extractTopic(rawResponse),
			}
		}

		if (this.noRepeat.isRepeat(rawResponse)) {
			return { forward: false, urgency: 'silent' }
		}

		this.noRepeat.add(rawResponse)
		return {
			forward: true,
			urgency: 'advisory',
			topic: this.noRepeat.extractTopic(rawResponse),
		}
	}
}

function normalizePhrase(text: string): string {
	return text.trim().toLowerCase().replace(/[.,!?]$/, '')
}

function isSilent(response: string): boolean {
	const normalized = normalizePhrase(response)
	return SILENCE_PHRASES.some(
		(phrase) => normalized === phrase || normalized.startsWith(phrase),
	)
}

function classifyUrgency(response: string): 'urgent' | 'advisory' {
	const lower = response.toLowerCase()
	return URGENT_PATTERNS.some((p) => lower.includes(p)) ? 'urgent' : 'advisory'
}
```
