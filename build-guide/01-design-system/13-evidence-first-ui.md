# Design System — Evidence-First UI

## What This File Covers

Evidence-first UI is Brioela's rule for turning intelligence into product surfaces. It applies to
scanner, Bela, Passport, receipts, recalls, illness detective, medication reminders, menu scanning,
wearables, Ground, and any feature where Brioela explains a decision.

Evidence-first does not mean score-first. The product answer comes first, then the evidence that
changed or supported it. Scores, confidence, source names, timestamps, and raw fields are supporting
context, not the headline.

---

## Core Rule

Every evidence-first surface answers in this order:

```text
answer
why it matters
what evidence changed or supported it
what to do next
raw details, if the user asks
```

Bad pattern:

```text
Score: 78
Sugar: 8g
Origin: France
Source: Open Food Facts
Confidence: 94%
```

Good pattern:

```text
Worth caution.
This looks mostly fine, but Brioela is being careful because MSG matters for your profile.

78 / 100
sugar okay · sodium okay · fiber helps
94% confident from the label photo and Open Food Facts
```

---

## Why This Matters

Brioela is not a dashboard. It is a food decision system.

A dashboard shows facts and asks the user to decide. Brioela makes a careful decision, then shows the
evidence so the user can understand, challenge, or trust the answer.

The UI must not feel like:

```text
Name: Kibru
Age: 24
Status: Good
```

Use prose, hierarchy, spacing, motion, and grouping. Use explicit labels only when they reduce
ambiguity for health, money, time, quantity, or legal/safety proof.

---

## Scanner

Compact:

```text
Worth caution
Savory Oat Crisps

Mostly fine. Brioela is being careful because MSG matters for your profile.

Save   Avoid   Nearby
Details
```

Expanded:

```text
Worth caution
This looks mostly fine. MSG is why Brioela is being careful for your profile.

People with a similar profile have reported headaches more often after products with MSG.

78 / 100
sugar okay · sodium okay
fiber helps · 2 additives

94% confident from the label photo and Open Food Facts

France · Danone
no boycott match

Water, oats, cane sugar, MSG…

Observed association only.
Not a clinical conclusion.
```

Do not lead with the score. The verdict is the answer. The score is evidence.

---

## Bela Shopper Screen

Bad:

```text
Product: Cereal X
Constraint: Sesame
Status: Blocked
Action: Substitute
```

Good:

```text
Not this one.
This cereal lists sesame, and the order blocks sesame.

Choose another cereal.
Keep the same size if you can.
```

For shopper UI, evidence-first means the shopper gets the decision and next action instantly. The user
profile stays private. The shopper does not need to see the full constraint list.

---

## Bela User Live Scan

```text
Blocked before checkout
Marta scanned a cereal with sesame.

Brioela stopped it because sesame is blocked for this order.
Marta is choosing a replacement now.
```

This is stronger than a scan log table. The user sees that the system protected the order in real
time.

---

## Receipt Intelligence

Bad:

```text
Matched product: product_123
Confidence: 0.83
Category: dairy
Price: $4.99
```

Good:

```text
Likely matched
This receipt line looks like Danone yogurt.

The match is strong enough for spend history, but not enough for allergy decisions.
```

Receipt evidence should never pretend to prove ingredients. It proves purchase context and price; the
product facts still come from product evidence.

---

## Recall Alerts

Bad:

```text
Recall ID: R-2026-001
Product ID: product_123
Match confidence: high
Action required: discard
```

Good:

```text
Do not eat this.
This recall matches yogurt you scanned last week.

Lot A14 is included in the official notice.
Discard it or return it to the store.
```

Safety UI is action-first. Official source and lot details appear below the action.

---

## Illness Detective

Bad:

```text
Suspect 1: sushi
Confidence: 73%
Suspect 2: egg salad
Confidence: 42%
```

Good:

```text
Most likely lead
The sushi meal fits the timing best.

You logged nausea about 7 hours later, and two recent recall notices mention similar products.
This is a lead, not a diagnosis.
```

Avoid courtroom or diagnostic language. Use “lead,” “fits the timing,” and “worth checking.”

---

## Medication Reminders

Bad:

```text
Medication: Warfarin
Dose: 5mg
Status: missed
Action: confirm
```

Good:

```text
Medication reminder
Did you take your scheduled dose?

Yes · Not yet · Skip this reminder
```

Lock-screen and shared-space surfaces should be redacted by default. Detailed medication names are
shown only when the user opted into explicit reminder copy.

---

## Menu Scanning

Bad:

```text
Dish: Pad Thai
Verdict: Yellow
Reason: peanuts possible
Question: ask waiter
```

Good:

```text
Ask before ordering
Pad Thai often includes peanuts, and this menu does not say either way.

Ask: “Can this be made without peanuts or peanut oil?”
```

For menus, evidence-first means the user gets a practical waiter question, not a risk table.

---

## Passport

Passport should feel like a food boarding pass:

```text
Please avoid peanuts and sesame.
Ask about sauces and shared fryers.
This expires tonight.
```

Passport is not a profile page. It is a temporary instruction artifact for another human.

---

## Wearables And Personal Health Overlay

Bad:

```text
Glucose delta: +42
Window confidence: 0.77
Product ID: product_123
```

Good:

```text
This tends to spike you.
Your last three scans of this product were followed by higher glucose.

Try it with more protein or choose the lower-sugar swap.
```

Personal physiological evidence is private. Show it as personal experience, not population truth.

---

## Ground Finds

Bad:

```text
Find type: price
Store: Market X
Product: eggs
Price: $3.49
```

Good:

```text
Eggs are cheaper here today.
$3.49 at Market X.

Seen 20 minutes ago.
```

Ground is public evidence. Keep it factual, local, and useful. No profiles, feeds, or reputation copy.

---

## Rule Of Thumb

If a UI sentence starts with a database field name, rewrite it.

Prefer:

```text
Worth caution.
Blocked before checkout.
Likely matched.
Do not eat this.
Ask before ordering.
This tends to spike you.
```

Avoid:

```text
Status:
Score:
Product:
Confidence:
Source:
Reason:
```

Labels are allowed inside technical detail drawers, receipts, legal proof, and clinician/practitioner
views. They should not be the default product surface.
