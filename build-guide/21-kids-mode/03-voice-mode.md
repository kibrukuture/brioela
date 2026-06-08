# Kids Mode — Voice Mode

## What This File Covers

How Kids Mode works inside Mira sessions when the parent says "explain this to my kid" or asks Brioela to switch tone for a child.

---

## Core Rule

Kids Voice Mode is contextual. It is not a persistent session mode.

Mira switches tone for one explanation, then returns to the adult session mode.

---

## Trigger Phrases

Examples:

- "Explain this to my kid."
- "Can you say that for an eight-year-old?"
- "Tell her why this has too much sugar."
- "Make that kid-friendly."

The agent should infer child explanation intent from context, but only when the parent clearly asks.

---

## Session Behavior

In cooking/voice sessions:

1. Parent asks for child explanation.
2. Mira checks current context: product, ingredient, recipe step, or scan result.
3. Agent uses Kids Mode age range or asks one short age-range question if missing.
4. Agent gives short child-friendly explanation.
5. Agent returns to normal adult mode.

No toggle. No settings screen during live session.

---

## System Instruction Addendum

When triggered, inject a temporary instruction:

```text
For this response only, explain to a child aged [ageRange]. Use warm, simple language. Keep it short. Do not hide safety warnings. After this response, return to normal adult cooking assistant behavior.
```

This is not a new model. It is a temporary instruction on the existing live session.

---

## Audio/TTS

Use the existing Mira voice pipeline. No new TTS infrastructure.

Rules:

- slower and warmer than normal adult instruction
- no baby voice
- no exaggerated cartoon tone
- keep under 20 seconds when possible
- parent can interrupt/barge in

---

## Safety During Voice

If the context includes a hard allergy or safety issue, lead with parent-facing clarity first.

Example:

```text
For you first: this contains peanuts, which is on your allergy list. For your kid: peanuts can be dangerous for people whose bodies react badly to them, so this is a food to avoid in your family.
```

Safety warning remains accurate. The child-friendly explanation can simplify but not soften the core warning.

---

## Tone Reset

After the kid explanation, reset to normal session behavior.

Implementation marker:

```typescript
type VoiceToneMode = {
  mode: "adult" | "kid_explanation"
  ageRange: "5-7" | "8-10" | "11-12" | null
  expiresAfterResponse: boolean
}
```

`expiresAfterResponse` must be true for Kids Mode voice explanations.
