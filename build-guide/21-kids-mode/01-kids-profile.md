# Kids Mode — Kids Profile

## What This File Covers

The minimal Kids Mode profile: age range, enabled state, default behavior, and the hard rule that Brioela does not build child identity profiles.

---

## Product Rule

Kids Mode is for explaining food to a child. It is not a child account system.

The parent sets an age range once with one tap. Brioela uses that age range to calibrate language.

---

## Age Ranges

Supported ranges:

| Range | Language style |
|---|---|
| `5-7` | very simple, concrete, sugar-cube/counting analogies, no jargon |
| `8-10` | simple concepts, a few food science words explained plainly |
| `11-12` | near-adult explanation, numbers and ingredient names allowed |

If no age range is set, default to `8-10`.

---

## Setup Flow

Kids Mode setup must be one tap, not a form.

Entry points:

- first time parent taps "Explain to my kid"
- settings toggle
- voice session when parent says "explain this to my kid"

Setup UI:

```text
How old is the child listening?
[5-7] [8-10] [11-12]
```

No name, birthday, school, gender, or profile photo.

---

## Profile Shape

```typescript
type KidsModeProfile = {
  userId: string
  enabled: boolean
  ageRange: "5-7" | "8-10" | "11-12"
  createdAt: number
  updatedAt: number
}
```

This can live in the user's private Brain context or app profile state. It is a parent preference, not child data.

---

## No Child Identity

Do not collect:

- child name
- birthdate
- school
- location
- photo/avatar
- personal interests
- health data about the child

If a parent volunteers a child's name in a voice session, do not persist it for Kids Mode.

---

## Multiple Children

First version supports one active age range.

If a parent has multiple children, they can change the age range before generating the explanation. Do not build multi-child profiles yet.

Reason: multi-child profiles quickly become child identity storage, which this feature intentionally avoids.
