import { z } from '@brioela/shared/zod'

const jsonLiteralSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])

export type JsonValue = z.infer<typeof jsonLiteralSchema> | JsonValue[] | { [key: string]: JsonValue }

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
	z.union([jsonLiteralSchema, z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)]),
)
