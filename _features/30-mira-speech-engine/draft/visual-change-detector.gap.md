# Gap snapshot: visual-change-detector.ts

Target: `backend/src/agents/mira/mira-speech-decision/visual-change-detector.ts`

**Status:** Not in repo. Authoritative: `implementable-specs/cooking-session/mira-speech-decision-engine/02-visual-change-detector.md`.

```typescript
import { downsampleJpegToGrayscale16 } from '@/agents/mira/_helpers/downsample-jpeg.helper'

export type FrameAnalysis = {
	changeScore: number
	urgencySignal: boolean
	stable: boolean
}

type FrameSnapshot = {
	pixels: Uint8Array
	capturedAt: number
}

const ROLLING_WINDOW = 10
const URGENCY_SCORE_THRESHOLD = 60
const STABLE_SCORE_THRESHOLD = 10

export class VisualChangeDetector {
	private lastSnapshot: FrameSnapshot | null = null
	private recentChanges: number[] = []
	private lastAnalysis: FrameAnalysis = { changeScore: 0, urgencySignal: false, stable: true }

	onVideoFrame(jpegData: ArrayBuffer): FrameAnalysis {
		const current = downsampleJpegToGrayscale16(jpegData)
		const analysis = this.analyze(current)
		this.lastSnapshot = { pixels: current, capturedAt: Date.now() }
		this.recentChanges.push(analysis.changeScore)
		if (this.recentChanges.length > ROLLING_WINDOW) {
			this.recentChanges.shift()
		}
		this.lastAnalysis = analysis
		return analysis
	}

	getLastAnalysis(): FrameAnalysis {
		return this.lastAnalysis
	}

	getAverageChangeScore(): number {
		if (this.recentChanges.length === 0) return 0
		const sum = this.recentChanges.reduce((acc, score) => acc + score, 0)
		return sum / this.recentChanges.length
	}

	isStable(): boolean {
		return this.getAverageChangeScore() < STABLE_SCORE_THRESHOLD
	}

	private analyze(current: Uint8Array): FrameAnalysis {
		if (this.lastSnapshot === null) {
			return { changeScore: 0, urgencySignal: false, stable: true }
		}

		const prev = this.lastSnapshot.pixels
		let totalDiff = 0
		for (let i = 0; i < 256; i++) {
			totalDiff += Math.abs(current[i]! - prev[i]!)
		}
		const mad = totalDiff / 256
		const changeScore = Math.min(100, (mad / 50) * 100)
		const urgencySignal = changeScore > URGENCY_SCORE_THRESHOLD && this.trendIsAccelerating()

		return {
			changeScore,
			urgencySignal,
			stable: changeScore < STABLE_SCORE_THRESHOLD,
		}
	}

	private trendIsAccelerating(): boolean {
		if (this.recentChanges.length < 3) return false
		const last3 = this.recentChanges.slice(-3)
		return last3[2]! > last3[1]! && last3[1]! > last3[0]!
	}
}
```
