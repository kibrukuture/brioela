# Mesa — Feature Integration

## What This File Covers

How Mesa connects to scanner, recipes, menu scanning, meal planning, Bela, cooking, Kids Mode, and shared content.

---

## Scanner

After standard scan result, Mesa can add a compatibility row:

```text
Mesa: works for everyone.
```

or:

```text
Mesa: avoid for Noah — contains peanuts.
```

Standard user safety still appears first.

---

## Recipe Ingestion

Imported recipes can be checked against active Food Audience.

Examples:

- "This recipe works for everyone."
- "Works if you swap butter for olive oil."
- "Not a Mesa recipe as written: contains shellfish."

Do not overwrite source recipes. Save accepted Mesa-safe variants separately or as notes.

---

## Menu Scanning

Menu scanning can rank dishes by Mesa compatibility.

Primary use:

```text
Show dishes that work for the whole table.
```

If no dish works for all, show closest options and waiter questions.

---

## Meal Plan

Meal plan generation takes Food Audience as input.

Rules:

- hard conflicts excluded
- prefer recipes that work for all
- suggest variants when simple substitutions fix conflicts
- grocery list should mark who the item is for if not universal

---

## Bela

Bela order constraints should use active Mesa audience when the order is for Mesa.

Shopper scanner should show:

```text
Not OK for Mesa: contains sesame for one member.
```

Bela substitutions must clear the selected audience.

---

## Cooking Session

Cooking Agent should know current audience.

Examples:

```text
Are we cooking this just for you, or for Mesa tonight?
```

```text
This step adds soy sauce. For your gluten-free member, use tamari.
```

Ask once per session, not repeatedly.

---

## Kids Mode

Kids Mode stays a supervised learning/tone layer.

Mesa can later provide member-specific constraints for child members if owner created them, but Kids Mode does not create Mesa members by itself.

---

## Shared Content Classifier

If user shares a place, recipe, menu, or product and Mesa is active, Brioela can ask:

```text
Should I check this for Mesa or just you?
```

Do not assume shared content is for everyone.
