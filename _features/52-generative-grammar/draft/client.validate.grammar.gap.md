# Draft: client-validate.ts (gap — file does not exist)

Target: `mobile/grammar/client-validate.ts`

**Gap (feature 52):** Client-side re-validation — defense in depth.

**Source:** `15-validation-and-repair.md`

---

```typescript
import {
	brioelaGenerativeUiDocumentSchema,
	type BrioelaGenerativeUiDocument,
} from '@brioela/shared/grammar'
import { isLayoutTemplateAllowedOnSurface } from '@brioela/shared/grammar/catalog/allowlists'
import {
	isBackgroundEffectPairingLegal,
	isEntranceMotionPairingLegal,
} from '@brioela/shared/grammar/catalog/pairing'
import { isSupportedGrammarVersion } from '@brioela/shared/grammar/version'

export type ClientValidateResult =
	| { ok: true; document: BrioelaGenerativeUiDocument }
	| { ok: false; reason: string }

export function validateReceivedBrioelaGenerativeUi(
	input: unknown,
): ClientValidateResult {
	const parsed = brioelaGenerativeUiDocumentSchema.safeParse(input)
	if (!parsed.success) {
		return { ok: false, reason: 'schema_parse_failed' }
	}

	const doc = parsed.data

	if (!isSupportedGrammarVersion(doc.grammarVersion)) {
		return { ok: false, reason: 'unsupported_grammar_version' }
	}

	if (!isLayoutTemplateAllowedOnSurface(doc.surface, doc.layoutTemplate.type)) {
		return { ok: false, reason: 'layout_not_allowed_on_surface' }
	}

	if (
		doc.backgroundEffect &&
		!isBackgroundEffectPairingLegal(doc.emotionalTone, doc.backgroundEffect.family)
	) {
		return { ok: false, reason: 'illegal_background_pairing' }
	}

	if (
		doc.entranceMotion &&
		!isEntranceMotionPairingLegal(doc.emotionalTone, doc.entranceMotion.preset)
	) {
		return { ok: false, reason: 'illegal_entrance_pairing' }
	}

	return { ok: true, document: doc }
}
```
