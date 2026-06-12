# Gap snapshot: parse.menu.helper.ts

Target: `backend/src/api/menu-scans/_helpers/parse.menu.helper.ts`

**Status:** Not in repo. From `build-guide/17-menu-scanning/02-menu-gpt4o-mini-vision-and-parsing.md`.

```typescript
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import {
  ParsedMenuSchema,
  ParsedMenuDishSchema,
  type ParsedMenu,
  type MenuScanSourceSchema,
} from '@brioela/shared/validator/menu.scan'
import type { Env } from '@/types/env'

const ParserOutputSchema = z.object({
  dishes: z.array(ParsedMenuDishSchema.omit({ id: true })),
  parserWarnings: z.array(z.string()),
  notMenuReason: z.string().nullable(),
})

const MENU_PARSER_PROMPT = `
Parse this restaurant menu text into structured dishes.
Rules:
- Return valid JSON matching the schema exactly.
- Extract dish names, descriptions, listed ingredients, cooking methods, modifiers, prices if visible.
- Preserve uncertainty: empty arrays or null when unknown.
- Do not infer allergens from cuisine alone.
- Do not mark dishes safe or unsafe.
- If text is not a restaurant menu, return empty dishes and notMenuReason.
`

type ParseMenuInput = {
  source: z.infer<typeof MenuScanSourceSchema>
  combinedText: string
  restaurantId: string | null
  placeName: string | null
  resolvedUrl: string | null
  env: Env
}

export async function parseMenuFromText(input: ParseMenuInput): Promise<ParsedMenu> {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: ParserOutputSchema,
    messages: [
      { role: 'system', content: MENU_PARSER_PROMPT },
      { role: 'user', content: input.combinedText.slice(0, 120_000) },
    ],
  })

  void input.env

  const dishes = object.dishes.map((dish) => ({
    ...dish,
    id: crypto.randomUUID(),
  }))

  if (object.notMenuReason) {
    object.parserWarnings.push(object.notMenuReason)
  }

  return ParsedMenuSchema.parse({
    source: input.source,
    restaurantId: input.restaurantId,
    placeName: input.placeName,
    resolvedUrl: input.resolvedUrl,
    dishes,
    parserWarnings: object.parserWarnings,
  })
}
```

**Rule:** Verdict evaluation happens after parsing — parser must not assign safe/unsafe.
