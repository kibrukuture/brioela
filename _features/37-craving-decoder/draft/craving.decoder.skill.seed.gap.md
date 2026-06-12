# Draft: craving-decoder system skill (gap — not seeded)

Target:
- `backend/src/agents/brain/_skills/craving-decoder/craving.decoder.skill.content.md`
- `backend/src/agents/brain/_skills/craving-decoder/craving.decoder.skill.meta.ts`
- `backend/src/agents/brain/_skills/seed.system.skills.helper.ts` (add row)

**Gap:** `craving-decoder` missing from system skill seed list in **06**.

**Source:** `build-guide/39-craving-decoder/01-decoder-skill.md`, `brioela-specs/52-craving-decoder.md`

---

```typescript
// craving.decoder.skill.meta.ts
export const CRAVING_DECODER_SKILL_META = {
  name: 'craving-decoder',
  description: 'Evidence-based analysis when the user asks why they are craving something.',
  tags: ['craving', 'wellbeing', 'system'],
  source: 'system' as const,
  version: 1,
}
```

```markdown
<!-- craving.decoder.skill.content.md -->
# Craving Decoder

## When to use
Load this skill when the user asks why they are craving something — voiced, in chat, or on the scan screen while engaged.

Never proactive. Never ask "craving something?" Do not analyze unless the user initiated.

## Triggers
- Explicit voiced craving questions
- Craving-shaped scan questions while user is on scan UI
- Craving-context scans: late-night repeat comfort-category scans while user engaged the screen

## Disordered-eating guard (hard stop)
If the user uses compensatory language, punishment framing, or extreme restriction:
- Decline analysis gently. Do not label them.
- Do not log craving_decoded events or pattern-match further on this thread.
- Do not simulate treatment. Brioela is not a treatment tool.

## Evidence assembly (strict order)
1. Physiological now — last night's sleep, today's readiness from health.biometrics; flag short sleep
2. Eating gap — hours since last **observed** eating event; say "nothing logged since …" — never claim total fasting or nutrient deficiency
3. Craving history — prior craving_decoded events; stress_eating and time-of-day patterns for this category/hour
4. Context signals — wellbeing signals this week, travel state, user-volunteered cycle context only
5. Glucose dynamics — CGM recent rapid drop if present; Kin flattest note only when no personal curve
6. Synthesis — at most TWO causes, ranked; below evidence threshold say: "No pattern I can see — sometimes chocolate is just chocolate."

## Language rules
- Every claim carries its source in plain words ("your ring says", "nothing's been logged since", "the last four times")
- Observations, never verdicts — never "you shouldn't"
- Two or three sentences, then one optional offer, then silence

## Matched offer (one, optional)
| Cause | Offer |
|---|---|
| Eating gap | Real-food bridge from inventory — "you have eggs and leftover rice; want the 10-minute version?" |
| Short sleep | Tonight adjustment — "Tonight's dinner could be early and light — want me to factor that in?" |
| No cause | Honesty + flattest sweet option they already buy when data exists |

## After decode
Log one craving_decoded memory_event with category, causes, evidence refs. Record what the user did next when known.

## Out of scope for this skill
- Nutrient gap / "what's missing from your kitchen" analysis (negative space nutrition — separate feature)
- Proactive stress-eating lectures (ambient pattern budget — separate)
- Craving suppression coaching or willpower scoring
```

```typescript
// seed.system.skills.helper.ts — add to SYSTEM_SKILLS array
import { CRAVING_DECODER_SKILL_META } from './craving-decoder/craving.decoder.skill.meta'
import cravingDecoderContent from './craving-decoder/craving.decoder.skill.content.md'

// ... existing seeds ...
{
  ...CRAVING_DECODER_SKILL_META,
  content: cravingDecoderContent,
},
```
