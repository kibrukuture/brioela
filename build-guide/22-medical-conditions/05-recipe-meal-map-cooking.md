# Medical Conditions — Recipe, Meal, Map, And Cooking Integration

## What This File Covers

How active medical conditions affect recipes, imported recipes, meal plans, map/restaurant recommendations, menu scanning, and cooking sessions.

---

## Recipe Filtering

Recipe suggestions and imported recipes must be evaluated against active conditions.

Behavior:

- hard condition conflict → hidden by default or blocked until reviewed
- soft condition conflict → ranked lower and flagged
- info condition note → shown in detail

Example:

```text
Gout flag: anchovies are high-purine. Replace with capers for a similar salty note.
```

Substitutions should be lowest-intervention: preserve the recipe when possible.

---

## Meal Plan

Meal plan generation adds active condition profile to inputs.

Additional inputs:

- active condition profiles
- rule version
- hard/soft condition filters
- wearable glucose facts if available
- medication food interaction notes if available

Rules:

- hard conflicts excluded unless user explicitly asks to view
- soft conflicts can appear with warnings if no better option exists
- use condition-compatible substitutions before rejecting a recipe
- never generate a plan that conflicts with celiac/PKU hard rules

---

## Menu Scanning

Menu scanning should apply condition rules to parsed dishes.

Examples:

- pregnancy: raw fish, unpasteurized cheese, deli meats → yellow/red depending rule
- celiac: wheat/gluten/shared fryer uncertainty → red/yellow
- hypertension: high-sodium dish descriptions → yellow
- diabetes/pre-diabetes: refined carbs/sugar-heavy desserts → yellow or rank lower

Unknown ingredients default caution. Restaurant staff cannot evaluate medical conditions; Brioela should generate ingredient/preparation questions, not ask the waiter for medical advice.

---

## Map Recommendations

Map rankings can adapt to conditions.

Examples:

- celiac: favor dedicated gluten-free places and strong community handling signals
- pregnancy: favor places with clear cooked/pasteurized options
- hypertension: favor lower-sodium options where menu intelligence supports it
- diabetes/pre-diabetes: favor places with lower added sugar/refined carb burden

Map should not publicly label a restaurant as "safe for diabetes" or "pregnancy-safe." It should rank privately for the user.

---

## Cooking Session

Cooking Agent receives compact condition context in the session prompt.

Examples:

- "Active condition: celiac. Never suggest gluten-containing ingredients or shared-flour substitutions."
- "Active condition: pregnancy. Flag raw/unpasteurized/high-mercury food risks."
- "Active condition: Warfarin. Give vitamin K consistency notes, not avoid-all-green-vegetable advice."

The agent should speak condition guidance naturally and only when relevant.

---

## Wearables Integration

Wearables can enrich condition support when the user connects them.

T2 diabetes / pre-diabetes + CGM:

- use personal glucose response as a scan/recipe/meal-plan overlay
- prefer the user's actual response over population glycemic index when enough evidence exists
- maintain medical boundary: observational only

Illness/recovery signals:

- wearable data can support ambient/illness context
- do not diagnose from wearables

---

## Notification Boundary

Medical condition nudges are sensitive.

Use in-app surfaces first. Push only for high-value, user-requested, or time-sensitive moments and only through notification rules.

Do not send fear-based condition push notifications.
