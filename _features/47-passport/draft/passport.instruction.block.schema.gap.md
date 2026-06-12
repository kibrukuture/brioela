# Draft: passport.instruction.block.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/passport.instruction.block.schema.ts`

**Gap (feature 47):** Instruction blocks persisted per Passport.

**Source:** `build-guide/28-passport/02-passport-data-model.md`

---

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const passportBlockSeverityValues = ['info', 'ask', 'avoid', 'critical'] as const
export type PassportBlockSeverity = (typeof passportBlockSeverityValues)[number]

export const passportInstructionBlocks = sqliteTable(
	'passport_instruction_block',
	{
		id: text('id').primaryKey(),
		passportId: text('passport_id').notNull(),
		sortOrder: integer('sort_order', { mode: 'number' }).notNull(),
		heading: text('heading').notNull(),
		linesJson: text('lines_json').notNull(),
		severity: text('severity', { enum: passportBlockSeverityValues }).notNull(),
	},
	(table) => [
		check('passport_block_sort_order_check', sql`${table.sortOrder} >= 0`),
		index('passport_instruction_block_passport_index').on(table.passportId, table.sortOrder),
	],
)

export type PassportInstructionBlockRow = typeof passportInstructionBlocks.$inferSelect
export type NewPassportInstructionBlockRow = typeof passportInstructionBlocks.$inferInsert
```
