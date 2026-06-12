# Draft: illness.detective.skill.seed.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_seeds/illness.detective.skill.seed.ts`

**Source:** `implementable-specs/04-skills.md` — system skill `illness-detective`.

---

```typescript
export const ILLNESS_DETECTIVE_SKILL_NAME = 'illness-detective' as const

export const illnessDetectiveSkillSeed = {
	name: ILLNESS_DETECTIVE_SKILL_NAME,
	description:
		'Rank likely food culprits from recent history with recalls and community signals — never diagnose.',
	tags: ['sift', 'food-safety', 'system'],
	source: 'system' as const,
	content: `# Illness Detective (Sift)

## When to use
User reports feeling sick after eating, or asks what food might have caused symptoms.

## Procedure
1. Ask only: when did symptoms start?
2. Compute lookback window from onset (1-6h last meal; 6-24h 2-3 meals; 24-72h full window).
3. Call \`run_sift\` with symptom_onset_hours — do not stream a long investigation in chat.
4. Present top 3 suspects with plain-language reasons. Use "likely suspect" — never "confirmed cause".
5. Include severe-symptom guidance (doctor if severe).
6. Optionally ask: others sick? fully cooked? — user may skip.
7. If others sick from same source, log anonymized community signal (no user id).
8. Schedule sickness_followup ~24h later.

## Boundaries
- Never diagnose. Never claim wearable data proves food poisoning.
- Active recall match = highest weight; link to recall detail when present.
- Individual illness reports are private; community writes are anonymized only.
`,
	version: 1,
} as const
```

Register in Brain first-boot seed alongside other system skills (**10** agent identity).
