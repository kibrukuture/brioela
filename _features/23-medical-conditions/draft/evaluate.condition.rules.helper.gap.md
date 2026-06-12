# Draft: evaluate.condition.rules.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/evaluate.condition.rules.helper.ts`

Source: `build-guide/22-medical-conditions/03-condition-rule-config.md`, `04-scan-verdict-integration.md`

---

## Intended production file

```typescript
import type { ActiveMedicalConditionContext } from '@/agents/brain/_repositories/read.active.medical.conditions.repository'
import type { ConditionRule } from '@brioela/shared/drizzle/schema/condition.rule.schema'

export type ConditionFlagResult = {
	conditionType: string
	flagLevel: 'hard' | 'soft' | 'info'
	matchedRuleIds: string[]
	trigger: string
	reason: string
	confidence: number
}

export type ProductRuleEvaluationInput = {
	ingredients: string[]
	additives: string[]
	nutrients: Record<string, number>
	categories: string[]
	preparationTerms: string[]
	dataConfidence: number
}

export function evaluateConditionRules(
	activeConditions: ActiveMedicalConditionContext[],
	rulesByCondition: Map<string, ConditionRule[]>,
	product: ProductRuleEvaluationInput,
): ConditionFlagResult[] {
	const flags: ConditionFlagResult[] = []

	for (const condition of activeConditions) {
		const rules = rulesByCondition.get(`${condition.conditionType}:${condition.ruleVersion}`) ?? []

		for (const rule of rules) {
			if (!rule.active) continue
			if (rule.strictness !== 'all' && rule.strictness !== condition.strictness) continue

			const match = matchRuleTrigger(rule, product)
			if (!match) continue

			flags.push({
				conditionType: condition.conditionType,
				flagLevel: rule.flagLevel as ConditionFlagResult['flagLevel'],
				matchedRuleIds: [rule.ruleId],
				trigger: match.trigger,
				reason: formatReasonTemplate(rule.reasonTemplate, match),
				confidence: product.dataConfidence,
			})
		}
	}

	return mergeConditionFlags(flags)
}

function matchRuleTrigger(rule: ConditionRule, product: ProductRuleEvaluationInput): { trigger: string } | null {
	// ingredient / nutrient / additive / category / preparation matching
	// Uses Supabase ingredient_synonyms cache for expansion
	// Incomplete data → return null for hard conditions (caller shows uncertainty copy)
	return null
}

function formatReasonTemplate(template: string, match: { trigger: string }): string {
	return template.replace('{trigger}', match.trigger)
}

function mergeConditionFlags(flags: ConditionFlagResult[]): ConditionFlagResult[] {
	// Multiple rules same condition → merge matchedRuleIds; keep highest severity
	return flags
}
```

**Fail-safe:** If `rulesByCondition` fetch failed and condition is hard (celiac, PKU), return uncertainty flag — not empty array.

**Separate from:** `checkProductConstraints` (**07**/**24**) — condition evaluation runs as second pass, results in `conditionFlags[]` not `constraint.matches`.
