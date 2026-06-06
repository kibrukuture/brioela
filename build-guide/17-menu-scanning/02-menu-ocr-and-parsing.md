# Menu Scanning — OCR And Parsing

## What This File Covers

The server-side OCR and menu-specific LLM parsing path. This file stops at structured dish extraction; verdicts are handled in `03-dish-verdicts.md`.

---

## Pipeline

Menu scanning uses a one-shot structured extraction flow:

1. Normalize input from photo, multi-page photo, or URL.
2. Run server-side OCR for image input.
3. Merge multi-page OCR text in page order.
4. Send menu text to a standard text LLM call.
5. Parse the LLM response into a typed dish list.
6. Pass structured dishes to verdict evaluation.

This is not Gemini Live. There is no conversation, streaming video, or real-time speech. The target is one structured response in under 3 seconds for a typical menu photo.

---

## OCR Reuse From Scanner

Menu scanning reuses these scanner pieces from `07-scanner`:

- Gemini Vision call pattern for arbitrary text extraction.
- Server-side contrast enhancement for low-light images.
- Confidence and warning behavior.
- JPEG upload conventions.

Menu scanning does not reuse these scanner pieces:

- Barcode resolution.
- Open Food Facts lookup.
- Product cache lookup.
- Product-specific synthetic product model.

Menus produce dishes, not canonical products.

---

## OCR Output

OCR output keeps page boundaries because menu sections and repeated item names can matter.

```typescript
type MenuOcrPage = {
  pageIndex: number
  text: string
  confidence: number
  warnings: Array<"low_light" | "glare" | "partial_page" | "text_too_small" | "ocr_uncertain">
}

type MenuOcrResult = {
  pages: MenuOcrPage[]
  combinedText: string
  minConfidence: number
}
```

If `minConfidence < 0.4`, the scan fails and asks the user to retake the page. If some pages are readable and others fail, return partial results only if the UI clearly says the menu may be incomplete.

---

## Menu Parser Schema

The parser returns only what the menu supports. It must never invent hidden ingredients.

```typescript
type ParsedMenuDish = {
  id: string
  section: string | null
  name: string
  description: string | null
  listedIngredients: string[]
  cookingMethod: string | null
  modifiers: string[]
  priceText: string | null
  sourcePageIndexes: number[]
  extractionConfidence: number
}
```

`listedIngredients` means ingredients explicitly named or strongly implied by menu text. It does not mean a complete ingredient list.

Examples:

- "peanut satay noodles" may include `peanut`.
- "fried calamari" may include cooking method `fried`.
- "chef's seasonal risotto" has no reliable ingredient list and should remain sparse.

---

## Parser Prompt Rules

The menu parser prompt must include these rules:

- Return valid JSON matching the schema exactly.
- Extract dish names, descriptions, listed ingredients, cooking methods, modifiers, and prices if visible.
- Preserve uncertainty. Use empty arrays or `null` when unknown.
- Do not infer allergens from cuisine alone.
- Do not mark a dish safe or unsafe in the parser.
- Keep source page indexes for every dish.
- If text is not a restaurant menu, return an empty dish list with reason `not_menu`.

Verdict evaluation happens after parsing with the user's constraint profile.

---

## Latency Boundary

The feature target is under 3 seconds from photo submission to visible results for a normal menu page.

Latency budget:

- Image enhancement and OCR: fast path, one model call per page.
- Multi-page scans: parallel OCR per page when possible.
- Menu parsing: one standard text model call over merged OCR text.
- Verdict evaluation: deterministic server code over structured dishes and constraint profile.

If the menu is too large, return partial sections rather than waiting for a long full-menu analysis. The UI can show "More dishes loading" only if the backend supports stable incremental batches; otherwise keep the first implementation single-response.

---

## Output To Next Step

Parsing produces:

```typescript
type ParsedMenu = {
  source: "photo" | "multi_page_photo" | "url"
  restaurantId: string | null
  placeName: string | null
  dishes: ParsedMenuDish[]
  parserWarnings: string[]
}
```

No user-specific health claim is made in this layer.
