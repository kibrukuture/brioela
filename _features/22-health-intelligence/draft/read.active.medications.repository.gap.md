# Draft: read.active.medications.repository.ts (gap)

Target: `backend/src/agents/brain/_repositories/read.active.medications.repository.ts`

**Consumer:** **24** scanner constraint check via Brain RPC `readActiveMedicationsForConstraintCheck`.

Source: `07-scanner/03-constraint-check.md`

```typescript
import { eq, and } from 'drizzle-orm'
import type { BrainDatabase } from '@/agents/brain/_database'
import { medications } from '@/agents/brain/_schemas'

export type ActiveMedicationForConstraintCheck = {
	id: string
	medicationName: string
	medicationCategory: string
	doseMg: number | null
	doseUnit: string | null
	withFood: boolean | null
}

export function readActiveMedicationsForConstraintCheck(
	database: BrainDatabase,
	userId: string,
): ActiveMedicationForConstraintCheck[] {
	return database
		.select({
			id: medications.id,
			medicationName: medications.medicationName,
			medicationCategory: medications.medicationCategory,
			doseMg: medications.doseMg,
			doseUnit: medications.doseUnit,
			withFood: medications.withFood,
		})
		.from(medications)
		.where(and(eq(medications.userId, userId), eq(medications.active, true)))
		.all()
}
```

Scanner then fetches **23** `medication_food_interaction_rule` + community `anonymous_medication_food_event_associations` from Postgres.
