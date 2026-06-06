# Menu Scanning — Waiter Questions

## What This File Covers

How Brioela generates short, specific questions for yellow dishes. This file owns script generation only; verdict assignment lives in `03-dish-verdicts.md`.

---

## Purpose

Yellow means the user should ask before ordering. The product value is not just flagging uncertainty; it removes the social friction of deciding what to say.

Every yellow dish must return a question the user can show to staff or read aloud.

---

## Question Rules

A waiter question must be:

- Specific to the dish.
- Specific to the user's relevant constraint.
- Short enough to read aloud.
- Non-accusatory and non-awkward.
- Focused on one risk when possible.
- Written in plain language, not medical jargon.

Do not generate broad generic questions like "Is this safe for me?" or "What allergens are in this?" Those shift the work back to the user and restaurant staff.

---

## Base Template

Use this base shape for hard allergy uncertainty:

```text
I'm allergic to [X]. Does [dish name] contain [X], or is it prepared in contact with [X]?
```

Examples:

- "I'm allergic to peanuts. Does the pad thai contain peanuts, or is it prepared in contact with peanuts?"
- "I have a shellfish allergy. Is the calamari fried in the same oil as shrimp or other shellfish?"
- "I avoid gluten. Is the crispy chicken battered with wheat, or fried in shared oil with gluten items?"

---

## Question Types

Generate the question from the reason for yellow.

| Yellow reason | Question focus |
|---|---|
| missing ingredient detail | ask whether the specific allergen/constraint ingredient is present |
| sauce, dressing, marinade, broth | ask whether the hidden component contains the risky ingredient |
| fried or crispy item | ask about batter and shared fryer |
| dairy/egg uncertainty | ask about butter, cream, cheese, egg wash, mayo, or aioli as applicable |
| vegan/vegetarian uncertainty | ask about meat stock, fish sauce, gelatin, dairy, egg, or animal fat |
| medical watchlist uncertainty | ask about the specific ingredient class without implying diagnosis |

If multiple risks exist, choose the most severe hard constraint first. The detail screen can show secondary questions, but the card should show one primary question.

---

## Medical Copy Boundary

For medical-condition watchlists, the script should ask about ingredients, not give medical advice.

Use:

```text
Does this dish contain grapefruit or grapefruit juice?
```

Avoid:

```text
Will this interfere with my medication?
```

Brioela can help the user ask ingredient questions. It must not ask restaurant staff to evaluate a medical condition or medication interaction.

---

## Display Rules

Yellow cards show:

- Dish name.
- Yellow indicator.
- One-sentence reason.
- Primary question.
- Tap target to copy/show large text.

The large-text view should be easy to show across a table in dim lighting. It should not include unnecessary profile details beyond the specific constraint needed for the question.

---

## Result Shape

```typescript
type WaiterQuestion = {
  dishId: string
  primaryQuestion: string
  riskIngredient: string
  questionType: "contains" | "shared_prep" | "hidden_component" | "cooking_method"
  secondaryQuestions: string[]
}
```

Only `primaryQuestion` appears in the dish list. `secondaryQuestions` are detail-screen only.
