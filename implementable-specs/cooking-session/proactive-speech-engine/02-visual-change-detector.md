# Proactive Speech Engine — Visual Change Detector

## Purpose

The visual change detector compares consecutive JPEG frames to detect whether something changed in the kitchen. It answers two questions:

1. Is there any visual change? (motion, color shift, new item on counter)
2. Is the change the kind that signals urgency? (smoke color, sudden bright light, rapid color change in pan)

This signal is used by the adaptive frequency controller to decide how often to check — and when to escalate to an urgent observation request.

---

## Why Lightweight Frame Comparison (Not CV Model)

Running a full computer vision model inside a Cloudflare DO is not feasible. The DO is not a GPU. Instead the detector uses pixel-level comparison on a heavily downsampled version of the frame. A 640x480 JPEG downsampled to 16x16 is 256 pixels — trivial to compute.

This is sufficient. The goal is not to understand the scene — Gemini does that. The goal is to detect CHANGE. A pan going from golden-brown to dark-brown, smoke appearing, or a liquid starting to boil are all detectable as pixel-level differences even at 16x16.

---

## Implementation

```typescript
interface FrameSnapshot {
  pixels:    Uint8Array    // 16x16 grayscale — 256 bytes
  capturedAt: number       // timestamp
}

class VisualChangeDetector {
  private lastSnapshot:  FrameSnapshot | null = null
  private recentChanges: number[] = []   // last 10 change scores (0-100)

  onVideoFrame(jpegData: ArrayBuffer): FrameAnalysis {
    const current = this.downsample(jpegData)
    const analysis = this.analyze(current)

    // Store snapshot
    this.lastSnapshot = { pixels: current, capturedAt: Date.now() }

    // Rolling window of change scores
    this.recentChanges.push(analysis.changeScore)
    if (this.recentChanges.length > 10) this.recentChanges.shift()

    return analysis
  }

  private downsample(jpegData: ArrayBuffer): Uint8Array {
    // JPEG decode → resize to 16x16 grayscale
    // In Cloudflare Workers: use the Canvas API (available via HTMLRewriter or ImageScript)
    // Result: 256 grayscale values (0-255)
    // Implementation detail left to the engineer — multiple libraries handle this
    return new Uint8Array(256)  // placeholder
  }

  private analyze(current: Uint8Array): FrameAnalysis {
    if (!this.lastSnapshot) {
      return { changeScore: 0, urgencySignal: false, stable: true }
    }

    const prev = this.lastSnapshot.pixels

    // Mean absolute difference between frames
    let totalDiff = 0
    for (let i = 0; i < 256; i++) {
      totalDiff += Math.abs(current[i] - prev[i])
    }
    const mad = totalDiff / 256   // 0-255 range

    // Normalize to 0-100
    const changeScore = Math.min(100, (mad / 50) * 100)

    // Urgency signal: rapid, large change across many pixels
    // This pattern matches: smoke appearing, sudden bright flash, pan going very dark
    const urgencySignal = changeScore > 60 && this.trendIsAccelerating()

    return {
      changeScore,
      urgencySignal,
      stable: changeScore < 10,
    }
  }

  private trendIsAccelerating(): boolean {
    if (this.recentChanges.length < 3) return false
    const last3 = this.recentChanges.slice(-3)
    // Each score higher than the previous = accelerating change
    return last3[2] > last3[1] && last3[1] > last3[0]
  }

  getAverageChangeScore(): number {
    if (this.recentChanges.length === 0) return 0
    return this.recentChanges.reduce((a, b) => a + b, 0) / this.recentChanges.length
  }

  isStable(): boolean {
    return this.getAverageChangeScore() < 10
  }
}

interface FrameAnalysis {
  changeScore:   number    // 0-100 — how much changed vs last frame
  urgencySignal: boolean   // true = accelerating large change — potential emergency
  stable:        boolean   // true = very little change — likely waiting/simmering
}
```

---

## Change Score Interpretation

| Score | What It Likely Means | Engine Response |
|---|---|---|
| 0–10 | Almost nothing changed — user is still, nothing moving | Stable — reduce check frequency |
| 10–30 | Slow motion — user moving around the kitchen, stirring | Normal — maintain regular check interval |
| 30–60 | Active movement — cutting, adding ingredients, repositioning | Active — slightly increase check frequency |
| 60–80 | Large change — significant new activity, possible smoke | Elevated — next check should be sooner |
| 80–100 | Rapid large change — accelerating (smoke, fire, overflow) | URGENT — trigger immediate observation |

---

## Urgency Signal — What Triggers It

The `urgencySignal: true` condition requires:
1. Change score > 60 (significant change happened)
2. Trend is accelerating (score increased in last 3 frames)

This pattern specifically avoids false positives from the user waving their hand in front of the camera or bumping the phone. A single large frame diff does NOT trigger urgency — it takes an accelerating series. Smoke billowing, boiling over, or a sudden flare all create exactly this accelerating pattern.

When `urgencySignal: true`, the engine bypasses normal suppression rules and triggers an immediate observation request. The only rule that cannot be bypassed: Gemini is currently speaking (don't interrupt Gemini's own output).

---

## Stable Kitchen Detection

When `isStable() === true` (average change score < 10 over 10 consecutive frames), the kitchen is visually static. This signals the simmering/waiting phase. The adaptive frequency controller uses this to extend the proactive check interval to 60 seconds — there is nothing new to see, so there is no point checking every 15 seconds.

---

## What the Detector Does NOT Do

- It does not understand the scene — that is Gemini's job
- It does not make decisions about speaking — that is the suppression rules + frequency controller
- It does not store frames — only 256-byte pixel snapshots (no image data persisted)
- It does not run on every frame — it runs as part of `onVideoFrame()` which is already limited to 1 FPS
