# 33. Minimum Spend Meal Plan

## Goal

Generate a personalized 7-day meal plan from what the user already has at home — minimizing what they need to buy, respecting every constraint, and building on recipes they have actually made before and liked.

## Why This Exists

The universal Monday morning problem: you have a fridge of random ingredients, you have no idea what to make this week, you know you are going to waste half of what you bought, and you do not want to spend more money than you need to.

Brioela has everything needed to solve this completely:
- The user's full scan and receipt history (what they bought and have at home).
- Their recipe history (what they have made, what they saved, what they rated well).
- Their constraint profile (allergies, dietary identity, medical conditions).
- Their budget baseline from receipt data.
- The healthy food map showing what is available and at what price nearby.

No meal planning app has this combination. Generic apps generate plans from a generic ingredient database. Brioela generates plans from YOUR actual fridge.

## User Outcome

- User says: "Plan my week" (or taps the weekly plan button).
- Brioela asks one optional question: "Do you want me to use what you already have as much as possible?"
- Within 5 seconds: a 7-day plan appears.
  - Day 1–7 with breakfast, lunch, dinner (or just dinners if that is the user's pattern from history).
  - Each meal shows which ingredients are already at home (green) vs. need to be bought (grey).
  - A consolidated shopping list at the bottom: only what needs to be purchased, sorted by category, estimated total cost based on price history.
- User can tap any meal to swap it. Brioela suggests alternatives that use the same at-home ingredients.
- The final shopping list is shareable and can be sent to any notes app.

## Plan Generation Logic

1. **Inventory snapshot**: pull from the user's Brain DO — products scanned and bought recently that have not been used in logged recipes yet. Receipt data contributes estimated quantities.
2. **Constraint filter**: every meal must clear allergies, dietary identity, and active medical conditions. Non-negotiable.
3. **Recipe pool**: prioritize recipes the user has saved, made before, or explicitly liked. Second priority: recipes from the community that match the constraint profile. Third priority: new recipes generated from available ingredients.
4. **Waste minimization**: rank recipe combinations by how many at-home ingredients they consume before they expire. Produce bought 4 days ago ranks higher than pantry staples that will last months.
5. **Variety constraint**: no recipe type repeated within 3 consecutive days. No ingredient repeated as the main protein on back-to-back days.
6. **Budget signal**: if the user's average weekly spend from receipt history is available, the plan's estimated cost is shown against that baseline. If the plan would exceed the baseline, a lower-cost variant is offered.

## Shopping List

The shopping list is generated from the delta between the plan's ingredients and the estimated inventory:

- Items the user already has: shown struck through or in a separate "you have this" section.
- Items to buy: sorted by store department (produce, dairy, meat, pantry).
- Estimated cost: based on price history from receipt scans for each item.
- Store suggestion: if two or more items on the list are cheaper at a specific nearby store (from community price data), the list notes this: "3 of these items are cheaper at [store]."

## Adjustability

The plan is not a rigid prescription. The user can:
- Tap any meal and say "swap this" — Brioela suggests 3 alternatives using the same at-home ingredients.
- Say "make this faster" — Brioela replaces the meal with a version that takes under 20 minutes, using the same base ingredients.
- Say "remove [ingredient] this week" — all meals containing it are replaced.
- Drag days to reorder.

All adjustments update the shopping list in real time.

## Voice Access

At any point during the week, the user can ask:
- "What was I supposed to cook tonight?"
- "I don't have [ingredient], what can I make instead?"
- "What's left in my plan for this week?"

The cooking voice agent (spec 10) is aware of the active meal plan and can start a cooking session for any planned meal directly from voice without navigating to the plan screen.

## Fridge Rescue Integration

This feature is closely related to the fridge/pantry ingredient rescue (spec 14). The difference:
- Spec 14: urgent. "What can I make right now with what I have?"
- This spec: planned. "Plan the whole week to minimize waste and spending."

Both share the same inventory model and constraint pipeline. They are different surfaces over the same data.

## Data Model

- `meal_plan`: plan_id, user_id, week_start_date, generated_at, status (active/completed/abandoned).
- `meal_plan_slot`: slot_id, plan_id, day_index (1–7), meal_type (breakfast/lunch/dinner), recipe_id, ingredient_status_json (at_home vs. to_buy).
- `meal_plan_shopping_list`: list_id, plan_id, ingredient_name, upc (nullable), quantity, unit, status (to_buy/already_have/bought), estimated_cost, store_suggestion.

## Technical Constraints

- Plan generation is a single LLM structured call with the full inventory snapshot, recipe pool, and constraints as context. Not a streaming session.
- Target latency: under 5 seconds.
- The inventory snapshot is assembled by the Brain DO from its SQLite state — no external query required.
- The plan is stored per-user in the Brain DO, not in Supabase (it is personal, not shared data).
- Plan generation is available in Core tier and above. Free users can see a single-day plan as a preview with an upgrade prompt for the full week.

## The Daily Ambient Surface (Spec 51)

This spec is user-initiated and weekly. Spec 51 (Tonight) is its daily ambient counterpart: one unasked card, one dish, at the user's learned dinner-decision time. The convergence rule is strict — when a plan from this spec is active, Tonight is simply today's plan slot re-validated against current inventory and readiness; it never competes with the plan. Both features share the same inventory model, recipe pool ordering, and constraint pipeline.

## Success Metrics

- Plan generation rate per week per active user.
- Shopping list completion rate (user marks items as bought).
- Waste reduction proxy: ingredient usage rate from at-home inventory vs. plans generated without inventory awareness.
- Plan swap rate (how often users adjust — high = the first plan was not good enough; low after a few weeks = the model has learned their preferences).
- Budget adherence: do users who use the meal plan spend closer to their historical weekly average than users who do not?
