# Passport — Rendering With Generative Grammar

## What This File Covers

How Passport uses Brioela Generative Grammar safely while keeping instruction content validated and static.

---

## Core Rule

Generative Grammar can frame Passport. It cannot invent or change Passport instructions.

Instruction blocks are validated before rendering.

---

## Grammar Surface

Add a Passport surface to Generative Grammar when implementing:

```typescript
type GenerativeSurface = "passport"
```

Allowed nodes:

- `stack`
- `hero_line`
- `instruction_block`
- `severity_ribbon`
- `translation_pair`
- `expiration_note`
- `qr_anchor`

---

## Static Fallback

Passport must have a complete static renderer.

If grammar fails, show:

- title
- instruction blocks
- language
- expiration
- revocation status

No Passport should fail to render because the generative layer failed.

---

## Visual Tokens

Use tokens only:

- `plain_truth`
- `warm_caution`
- `table_care`
- `focused_cooking`

Avoid playful/celebratory moods for safety handoffs.

---

## Share Artifact

For image/PDF modes, render a static artifact after privacy validation.

Do not embed hidden metadata containing private profile details.
