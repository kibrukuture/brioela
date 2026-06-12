# Draft: append-acoustic-instruction-block.helper.ts (gap — file does not exist)

Target: `backend/src/agents/mira/_helpers/append-acoustic-instruction-block.helper.ts`

**Gap:** Cooking system instruction does not include acoustic block.

**Source:** `build-guide/33-acoustic-cooking/01-prompt-extension.md`, `_features/29-cooking-session/build.md` (wire in `build-system-instruction.helper.ts`)

---

```typescript
import { ACOUSTIC_AWARENESS_BLOCK } from '@/agents/mira/_prompts/acoustic.awareness.prompt'
import type { MiraSceneKind } from '@/agents/mira/_scenes/mira.scene.contract'

export function appendAcousticInstructionBlock(
  baseInstruction: string,
  sceneKind: MiraSceneKind,
): string {
  if (sceneKind !== 'cooking') {
    return baseInstruction
  }
  return `${baseInstruction.trim()}\n\n${ACOUSTIC_AWARENESS_BLOCK}`
}
```
