# Haptic System

## Philosophy

Haptics are a design layer, not a feature. Every significant interaction in Brioela produces a precisely chosen haptic response. The haptic confirms what the eye sees and the ear might hear — the three channels reinforce each other. Without a system-level vocabulary for this, every feature invents its own haptic logic and the result is incoherent.

The haptic vocabulary mirrors the motion and verdict vocabulary already defined. When the `snap` spring fires, the corresponding haptic fires in the same frame. When a verdict blooms, the haptic matches its urgency level.

---

## Library

`expo-haptics` — already part of Expo managed workflow. No additional installation.

```ts
import * as Haptics from 'expo-haptics'
```

---

## Semantic Haptic Tokens

All haptic calls in the codebase go through named tokens from `src/design-system/haptics.ts`. No direct `Haptics.*` calls in feature code — always through the semantic layer.

### Selection

```ts
haptic.selection()
// → Haptics.selectionAsync()
```

When: navigating between items, toggling a selection, swiping between tabs, any discrete navigation step. The lightest possible signal — acknowledgment only.

### Impact

```ts
haptic.impact.soft()     // → Haptics.impactAsync(ImpactFeedbackStyle.Soft)
haptic.impact.light()    // → Haptics.impactAsync(ImpactFeedbackStyle.Light)
haptic.impact.medium()   // → Haptics.impactAsync(ImpactFeedbackStyle.Medium)
haptic.impact.heavy()    // → Haptics.impactAsync(ImpactFeedbackStyle.Heavy)
haptic.impact.rigid()    // → Haptics.impactAsync(ImpactFeedbackStyle.Rigid)
```

When:
- `soft` — gentle, elastic confirmation. Tag added, ingredient saved.
- `light` — minor UI tap. Button press with non-critical outcome.
- `medium` — standard confirmation. Default for most interactive elements.
- `heavy` — significant confirmation. Constraint saved, recipe imported, session started.
- `rigid` — stiff, precise. Scan barcode lock. Pairs with the glow ring closing animation.

### Verdict

```ts
haptic.verdict.safe()     // → Haptics.notificationAsync(NotificationFeedbackType.Success)
haptic.verdict.caution()  // → Haptics.notificationAsync(NotificationFeedbackType.Warning)
haptic.verdict.danger()   // → Haptics.notificationAsync(NotificationFeedbackType.Error)
```

When: the AI has returned a scan verdict. The haptic fires the moment the verdict is known — simultaneously with the verdict color bloom and the verdict card animation. The three signals land together.

---

## Haptic + Motion Pairing

Haptics and springs must fire together. The rule: the haptic token that matches the motion intensity fires on the same interaction event, not after it.

| Motion config | Haptic token | When |
|---|---|---|
| `spring.micro` | `haptic.impact.light` | Minor UI feedback |
| `spring.landing` | `haptic.impact.medium` | Card/modal appears |
| `spring.snap` | `haptic.impact.rigid` | Scan ring closes, hard lock |
| `spring.slow` | `haptic.impact.heavy` | Major state transition |
| Verdict bloom — safe | `haptic.verdict.safe` | Safe scan result |
| Verdict bloom — caution | `haptic.verdict.caution` | Caution scan result |
| Verdict bloom — danger | `haptic.verdict.danger` | Danger / hard block |

---

## Implementation Pattern

The haptic hook lives in `src/design-system/haptics.ts`:

```ts
import * as Haptics from 'expo-haptics'

export const haptic = {
  selection: () => Haptics.selectionAsync(),

  impact: {
    soft:   () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),
    light:  () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    heavy:  () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    rigid:  () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),
  },

  verdict: {
    safe:    () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    caution: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    danger:  () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  },
}
```

Usage in a component:

```tsx
import { haptic } from '@/design-system/haptics'

// On scan lock — fires with the ring close animation
const onBarcodeDetected = () => {
  haptic.impact.rigid()
  // trigger scan ring close animation
}

// On verdict arrival
const onVerdictReceived = (verdict: 'safe' | 'caution' | 'danger') => {
  haptic.verdict[verdict]()
  // trigger verdict bloom animation
}
```

---

## Accessibility

The Taptic engine is disabled automatically by iOS in Low Power Mode. The haptic calls are fire-and-forget — if the device cannot produce the haptic, nothing breaks. Do not check for haptic availability before calling.

Users with sensory sensitivities may need to disable haptics. Brioela exposes a "Haptic feedback" toggle in settings. When off, all calls to `haptic.*` are no-ops. The toggle state is stored in user preferences and checked by a thin wrapper around the haptic module — feature code does not need to check it.

```ts
// The wrapper respects the toggle — feature code is unchanged
export const haptic = {
  selection: () => isHapticsEnabled() && Haptics.selectionAsync(),
  // ...
}
```

---

## Rules

- No direct `Haptics.*` calls anywhere in feature code. Always `haptic.*` from the design system.
- Every verdictbloom fires its matching `haptic.verdict.*` token — never omit the haptic from a verdict.
- Never add haptics to ambient/background events (data sync, background prefetch, silent notifications). Haptics are for user-initiated or AI-verdict moments only.
- Never chain multiple haptics in rapid succession — one haptic per discrete event. If two events happen within 100ms, only the more significant haptic fires.
