# 27. Restaurant Menu Scanning

## Goal

Let the user photograph a restaurant menu and instantly see which dishes they can eat, which they must avoid, and which need a question asked — all filtered through their full allergy, preference, and dietary profile without any manual setup.

## Why This Exists

For anyone with a serious food allergy, dining out is an interrogation. You read every dish description, you flag the waiter, you ask about shared fryers, you get a confident "yes it's fine" that turns out to be wrong. The experience is anxiety-inducing and exhausting.

Brioela already knows everything about the user: their allergies (confirmed or inferred), their dislikes, their dietary identity (vegan, diabetic, pregnant, low-FODMAP). The restaurant menu is just unstructured text. The combination of those two things solves a real, daily problem for hundreds of millions of people.

## User Outcome

- User opens camera, photographs the menu (one photo or multiple pages).
- Within 3 seconds, the menu is overlaid or listed with color-coded indicators:
  - Green: safe to eat, matches preferences.
  - Yellow: possible issue, one ingredient to ask about.
  - Red: contains a confirmed allergen or hard constraint violation — do not order.
- User can tap any dish to see exactly why it was flagged and what to ask the waiter.
- If a dish has a yellow flag, Brioela generates the exact question to ask: "Does this contain [ingredient]? Is it cooked in a shared fryer with [allergen]?"
- If the menu or waiter uses another language, Brioela can show a translated menu overlay and speak the question to staff in their language when the user asks.

## Input Handling

- **Photo input**: standard camera capture, same flow as barcode scan. GPT-4o mini vision extraction reads menu text.
- **Multiple pages**: user can photograph multiple pages, Brioela stitches them into a unified menu.
- **Digital menu via link**: if the restaurant has a website or QR code menu, user can share the URL to Brioela and the same analysis runs on the web content.
- **Low-light restaurant conditions**: GPT-4o mini vision extraction runs on the server with contrast enhancement for dark-background menus.

## AI Processing

1. GPT-4o mini vision extraction reads full menu text.
2. LLM parses menu into structured dishes: name, description, ingredients where listed, cooking method where mentioned.
3. Each dish is evaluated against the user's full constraint profile pulled from their Orchestrator DO.
4. Dishes missing ingredient detail are flagged yellow by default (unknown = ask, not assume safe).
5. Results returned as a structured list with per-dish verdict, reason, and suggested waiter question.
6. If needed, Language Bridge turns the waiter question into a two-way food conversation between user and staff.

The processing model is a standard text call (not Gemini Live) — this is a one-shot structured extraction, not a conversation. Latency target: under 3 seconds from photo to results.

## Constraint Profile Used

Everything from the user's Orchestrator DO:
- Hard allergies (confirmed via behavioral engine or explicit confirmation).
- Soft dislikes (will not flag as red, but will rank green dishes lower).
- Dietary identity: vegan, vegetarian, halal, kosher, gluten-free, diabetic, pregnant, low-FODMAP, etc.
- Medical condition flags (spec 28): pregnancy, pre-diabetes, gout, Warfarin — each has specific ingredient watchlists.

## Waiter Script Generation

For yellow-flagged dishes, Brioela generates a short, specific, non-awkward question the user can show to the waiter or read aloud:

"I'm allergic to [X]. Does [dish name] contain [X] or is it prepared in contact with [X]?"

The question is pre-formulated, not generic. This removes the anxiety of not knowing what to ask.

If the user says "Brioela, talk to the waiter," Brioela uses the same question, the user's constraint
profile, and the detected staff language to ask on the user's behalf. It asks ingredient/preparation
questions only and summarizes the answer back to the user before ordering.

## Offline Partial Mode

If the user is in low-connectivity conditions (common in restaurants in areas with poor signal), the app caches the last-known constraint profile locally. Vision extraction runs when connectivity is available. The constraint matching runs locally against the cached profile when extracted text is available. The result will not include real-time community notes but will still flag known allergens and dietary conflicts.

## Integration with Map

If the restaurant is in the Brioela healthy food map (spec 04), the menu scan result can be cross-referenced with existing community notes about that restaurant: "3 people with gluten sensitivity reported this restaurant handles gluten well." This adds a social trust layer on top of the ingredient analysis.

## Data Model

- `menu_scan`: scan_id, user_id, restaurant_id (nullable), photo_count, extracted_text, created_at.
- `menu_scan_result`: scan_id, dish_name, verdict (safe/caution/avoid), reason, waiter_question, created_at.

Raw extracted text is discarded after processing. Results are stored for the session only unless the user explicitly saves the menu to their profile.

## Technical Constraints

- GPT-4o mini vision extraction and menu parsing must complete in under 3 seconds on a typical menu photo.
- The user's constraint profile is pulled from their Orchestrator DO — not re-derived from scratch per scan.
- No menu data is stored on Brioela's servers after the session unless the user saves it. Menu content is transient.

## Success Metrics

- Menu scan usage rate among users with confirmed allergies.
- Yellow-flag "ask waiter" tap rate (user engaged with the advice).
- Session-to-session repeat usage (users who scan menus more than once per month).
- Conversion rate: free users who hit menu scan for the first time → Core tier upgrade.
