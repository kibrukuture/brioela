# Kids Mode — Kid Co-Scan Mode

## What This File Covers

Parent-controlled phone handoff: the child holds the phone, scans products, and Brioela speaks directly in kid-friendly mode. This file only covers supervised Kids Mode scanning. Broader household or family-account architecture is intentionally out of scope for now.

---

## Product Rule

Kid Co-Scan Mode is supervised learning, not a child account.

The parent starts the mode, the child can scan and listen, and the parent can take over at any time.

---

## Entry Flow

Parent starts from a scan result or scanner screen:

```text
Let my kid scan
```

If age range is missing, ask once:

```text
How old is the child scanning?
[5-7] [8-10] [11-12]
```

Then enter a simplified scanner shell:

```text
Kid Scan Mode
Scan something together.
[Parent controls]
```

---

## Session Shape

```typescript
type KidCoScanSession = {
  sessionId: string
  userId: string
  ageRange: "5-7" | "8-10" | "11-12"
  startedAt: number
  endedAt: number | null
  status: "active" | "ended"
  scanCount: number
}
```

This is a temporary supervised mode. It does not create a child identity or household member.

---

## Child Experience

After a scan, Brioela speaks directly to the child:

```text
Nice scan. This cereal has lots of sugar, so it is more of a sometimes breakfast.
```

Then it can add one simple learning prompt:

```text
Can you find the word sugar on the label?
```

Prompt examples:

- "Can you find the first ingredient?"
- "What color is the verdict circle?"
- "Can you spot the word fiber?"
- "Would this be an everyday snack or a sometimes snack?"

The prompt is optional and should be short. Brioela is teaching label literacy, not quizzing aggressively.

---

## Parent Controls

Parent controls are always visible:

- End Kid Mode
- Mute voice
- Show adult details
- Share learning card
- Change age range

Parent-only actions require adult control:

- changing allergy/constraint settings
- saving new constraints
- creating Ground/community notes
- sharing externally
- purchases or subscription upgrades
- deleting history

The child can scan and learn. The child cannot modify the parent's food memory or safety settings.

---

## Safety Override

If a hard allergy or serious safety issue appears, Brioela switches to parent-first safety framing.

Example:

```text
Grown-up check: this contains peanuts, which your family avoids for safety.
```

Then child explanation:

```text
For kids: peanuts are not safe for everyone. In your family, this is a food to avoid.
```

Safety rules:

- hard allergy block appears before playful explanation
- voice tone becomes calm and clear
- parent controls are emphasized
- no scary language unless parent has explicitly chosen stronger allergy language later

---

## Scanner Reuse

Kid Co-Scan Mode reuses the standard scanner.

It does not create a separate product-resolution pipeline.

Order remains:

1. Standard product scan.
2. Standard adult/safety verdict.
3. Kids Mode explanation.
4. Optional learning prompt.

This prevents kid mode from becoming a less-safe scanner.

---

## Voice Behavior

Voice is on by default if parent starts co-scan mode with sound enabled.

Rules:

- speak warmly and briefly
- no baby voice
- no long lectures
- do not ask for personal child information
- do not store child responses as profile facts
- parent can mute instantly

The same voice stack as Cooking Session can be reused when live speech is needed, but co-scan does not require a full cooking session room.

---

## Out Of Scope For Now

Do not build in this feature:

- family accounts
- multiple household member profiles
- per-child allergy profiles
- child login
- child history timeline
- child-specific recommendations across the whole app

Those belong to a future Household Profiles / Family Account design discussion. For now, Kids Mode remains a parent-supervised explanation layer on top of the parent's account.
