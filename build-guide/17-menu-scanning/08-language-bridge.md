# Menu Scanning — Language Bridge

## What This File Covers

Brioela as the user's restaurant language bridge: translated menu overlay, spoken waiter handoff, and
three-way restaurant conversation when the user and staff do not share a language.

This is not a separate translator app. It is menu scanning plus the user's food profile plus voice.
Brioela already knows what the user can eat, what they prefer, what needs a waiter question, and what
language they speak. Language Bridge turns that context into a real restaurant conversation.

---

## Core Product Moment

The user scans a menu in any language. Brioela renders a virtualized menu overlay in the user's
language, preserving the original dish names where helpful and adding dish-level verdicts.

If the user needs staff help, they can say:

```text
Brioela, talk to the waiter for me.
```

Brioela then becomes the middle layer:

```text
user language → Brioela → waiter language
waiter language → Brioela → user language
```

The conversation is constrained by the menu scan and the user's food profile. Brioela does not become
a general travel interpreter unless the conversation is food/order related.

---

## Virtualized Menu Overlay

The overlay should not feel like a raw translation table. It should feel like the same menu made
understandable for this user.

Example after scanning a Chinese menu:

```text
Recommended to ask
宫保鸡丁 · Kung Pao Chicken

Usually made with peanuts.
Ask if they can prepare it without peanuts and with a clean wok.

Ask before ordering

Likely okay
番茄鸡蛋汤 · Tomato Egg Soup

No visible conflict in the menu text.
Restaurant prep can still vary.

Avoid
花生拌面 · Peanut Noodles

Peanuts are visible in the dish name.
```

Rules:

- Keep original dish name visible for staff reference.
- Show translated meaning in the user's language.
- Show Brioela verdict in the user's language.
- Keep waiter questions in both languages when needed.
- Preserve uncertainty. Do not over-translate sparse menu text into fake certainty.

---

## Waiter Conversation Mode

Language Bridge uses voice/video agent behavior when the user explicitly asks Brioela to talk to staff.

Entry points:

- user taps a dish question and chooses "Ask for me"
- user says "Brioela, talk to the waiter"
- user turns the phone toward staff from the menu detail screen

The screen should show a simple bilingual live state:

```text
Brioela is asking about peanuts.

English for Marta
Chinese for staff

Hold phone near the waiter.
```

---

## Full Example — Marta In China

Marta speaks English. She is traveling in Chengdu. The menu is Chinese. Marta has a confirmed peanut
allergy and avoids shellfish. The waiter does not speak English.

Marta scans the menu.

Brioela shows:

```text
Ask before ordering
宫保鸡丁 · Kung Pao Chicken

This dish often includes peanuts.
Brioela can ask whether they can make it without peanuts and avoid shared prep.

Ask for me
```

Marta taps **Ask for me**.

Brioela speaks to Marta first:

```text
Brioela: I can ask about peanuts and shared prep. Do you also want me to ask whether there is shellfish
in the sauce or broth?

Marta: Yes, ask that too.

Brioela: Got it. I’ll ask about peanuts, peanut oil, shared wok or prep, and shellfish in sauce or broth.
Hold the phone near the waiter.
```

Brioela turns to the waiter in Chinese:

```text
Brioela: 你好，她对花生过敏，也不吃贝类。她想点宫保鸡丁。请问这道菜里面有花生、花生油，或者会和花生一起用同一个锅或工具处理吗？酱汁或高汤里有贝类吗？
```

Waiter replies in Chinese:

```text
Waiter: 这道菜通常有花生。我们可以不放花生，但是酱料是提前做好的，里面没有贝类。锅可以单独洗一下，但是厨房里有花生。
```

Brioela summarizes to Marta:

```text
Brioela: He said the dish normally has peanuts. They can leave peanuts out, and the sauce does not use
shellfish. They can wash the wok separately, but peanuts are used in the kitchen.

For your allergy, I would still treat this as caution. Do you want me to ask for a different dish with
no peanut prep nearby?
```

Marta:

```text
Marta: Yes, ask what chicken dish is safest.
```

Brioela asks the waiter:

```text
Brioela: 她需要避免花生和贝类。有没有一道鸡肉菜，不含花生、花生油或贝类，而且更容易单独准备？
```

Waiter:

```text
Waiter: 番茄鸡蛋汤可以，或者清炒鸡肉不放花生。清炒鸡肉可以单独做。
```

Brioela to Marta:

```text
Brioela: He suggested tomato egg soup or a simple stir-fried chicken made separately without peanuts.
The stir-fried chicken is the better match if you want chicken.
```

Marta:

```text
Marta: Order the stir-fried chicken.
```

Brioela to waiter:

```text
Brioela: 她想点清炒鸡肉。请不要放花生、花生油或贝类。如果可以的话，请单独处理。谢谢。
```

---

## Safety And Privacy Boundaries

- Brioela only shares the minimum food rule needed for the order.
- It does not reveal the user's full profile.
- It does not say the user has a medical condition unless the user explicitly approved that wording.
- It asks ingredient/preparation questions, not medical questions.
- It summarizes staff answers back to the user before ordering when the answer affects a hard constraint.
- It stores no raw restaurant conversation unless the user saves the menu/session.

---

## Result Shape Additions

```typescript
type MenuLanguageBridge = {
  userLanguage: string
  staffLanguage: string | null
  originalDishName: string
  translatedDishName: string
  bilingualQuestion: {
    userLanguageText: string
    staffLanguageText: string
  } | null
  conversationModeAvailable: boolean
}
```

`staffLanguage` can be inferred from menu text, restaurant locale, or user selection. The user can
override it before Brioela speaks.

---

## Build Notes

- Menu parsing stays one-shot GPT-4o mini vision extraction + structured parsing.
- Live waiter conversation is a separate voice/video session entered only after user action.
- Use the same constraint profile as dish verdicts.
- Use the same waiter question rules from `04-waiter-questions.md`.
- Use Passport-style minimization for what is spoken to staff.
