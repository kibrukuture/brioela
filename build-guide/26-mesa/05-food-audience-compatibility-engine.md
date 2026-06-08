# Mesa — Food Audience Compatibility Engine

## What This File Covers

How Mesa evaluates products, recipes, menu dishes, and grocery items across multiple people.

---

## Core Rule

Mesa does not average people.

One hard conflict for one member remains a hard conflict for that member. The group result can say "works for most" but must still show who cannot eat it.

---

## Result Shape

```typescript
type MesaCompatibilityResult = {
  entityKind: "product" | "recipe" | "menu_dish" | "meal_plan" | "grocery_item"
  entityId: string
  audience: FoodAudience
  overall: "works_for_all" | "works_for_some" | "ask_or_modify" | "avoid_for_mesa"
  memberResults: MesaMemberCompatibility[]
  summary: string
}

type MesaMemberCompatibility = {
  memberId: string
  label: string
  verdict: "green" | "yellow" | "red"
  reason: string
  matchedConstraints: string[]
  suggestedSubstitution: string | null
}
```

---

## Overall Rules

`works_for_all`:

- every selected member is green

`works_for_some`:

- at least one green
- at least one red

`ask_or_modify`:

- no red, but at least one yellow
- or substitution likely resolves conflict

`avoid_for_mesa`:

- multiple red conflicts
- hard conflict for a protected child/elder member
- source confidence too low for active hard constraints

---

## Copy Examples

```text
Works for everyone at your Mesa.
```

```text
Works for you and Maya. Avoid for Noah: contains peanuts.
```

```text
Could work with one change: use tamari instead of soy sauce for your gluten-free member.
```

```text
Not a good Mesa choice: two members have hard conflicts.
```

---

## Substitutions

Substitution logic should preserve the food idea when possible.

Rules:

- never silently rewrite a recipe/product choice
- show the original conflict
- suggest one low-intervention swap
- require user acceptance for recipe variant changes

---

## Confidence

Low source confidence changes Mesa behavior.

If a label/menu/recipe is incomplete and any Mesa member has a hard constraint, return yellow or red depending on risk. Do not mark green for everyone from weak evidence.
