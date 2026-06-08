# Memory Engine — Universal Visual Intake

## What This File Covers

The pipeline for when a user submits a photo to the agent outside of any defined flow — a prescription bottle, a meal, a gym, a dog, a rash, a stool, a blood pressure reading. The agent classifies, decides what to do with it, writes to memory, and optionally creates a skill.

---

## The Boundary — Personal vs Ground

Two completely separate flows. Two completely separate code paths. Never overlap.

**Universal visual intake (this file):** user shows the agent something for their own memory. Processed privately, written to `user_memory`. Never shared. Never community-visible.

**Ground (spec 35):** user explicitly submits a video or photo as a community Find in a public space. Goes through the Ground submission flow, stripped of audio, faces blocked, stored in Supabase community table.

The distinction is user intent, not location detection. There is no gray area.

---

## Memory vs Skills — The Distinction

A photo almost never creates a skill. It almost always updates memory. Both are possible — they serve different purposes.

**Memory (declarative):** facts about the user. "Takes metformin 500mg." Stored in `user_memory`. Tells the agent WHO the user is.

**Skills (procedural):** reusable how-to instructions. "When this user asks about food safety, cross-reference their medication list first." Stored in `skills`. Tells the agent HOW to serve this user.

A medication photo → always writes a memory fact. It MAY also cause the agent to create a skill — but only if the agent judges the behavioral change is complex enough to warrant a reusable procedure. Usually it is not. Skills are earned through patterns, not triggered by single photos.

---

## The Pipeline

```
User submits photo
      ↓
Single Gemini vision call (not streaming, not Live)
      ↓
Structured JSON output — not free text
      ↓
Brain DO handler parses JSON
      ↓
  shouldProcess = false → discard silently
  shouldProcess = true  →
      ↓
    write memoryUpdates to user_memory (always synchronous)
    create personalitySignals in user_personality if present (Curator-level, queued)
    if newSkill.create = true → call create_user_skill
      ↓
One-line confirmation shown to user ONLY if a new skill was created
(memory writes are silent — no notification)
```

---

## Gemini Vision Call

```typescript
// backend/src/agents/brain/_handlers/visual-intake.handler.ts

import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'

const VisualIntakeOutputSchema = z.object({
  shouldProcess:      z.boolean(),
  category:           z.string().nullable(),
  reasoning:          z.string(),
  memoryUpdates: z.array(z.object({
    namespace:  z.string(),
    key:        z.string(),
    value:      z.record(z.unknown()),
    confidence: z.number().min(0).max(1),
    source:     z.literal('image'),
  })),
  newSkill: z.object({
    create:      z.boolean(),
    name:        z.string(),
    description: z.string().max(120),
    content:     z.string(),
  }).nullable(),
})

const VISUAL_INTAKE_PROMPT = `
Classify this image and decide what — if anything — to learn from it for the user's memory profile.

You are building a complete picture of this person from passive observation.
The user shows you things. You decide what matters.

Return valid JSON matching the exact schema:
{
  "shouldProcess": boolean,
  "category": string | null,         // "health" | "food" | "lifestyle" | "location" | null
  "reasoning": string,               // one sentence explaining your decision
  "memoryUpdates": [
    {
      "namespace": string,           // dot-separated, max 3 levels, e.g. "health.medications"
      "key": string,                 // lowercase with underscores, e.g. "metformin"
      "value": object,               // JSON object — never a bare string
      "confidence": number,          // 0.0–1.0
      "source": "image"
    }
  ],
  "newSkill": {
    "create": boolean,
    "name": string,                  // lowercase hyphens only, max 64 chars
    "description": string,           // max 120 chars — one line
    "content": string                // full markdown procedure
  } | null
}

Rules:
- shouldProcess = false for: blank walls, blurry images, selfies with no relevant context,
  random furniture, memes, landscapes with no meaning, social media screenshots.
  Discard threshold is intentionally high — better to skip than to write noise.

- memoryUpdates is empty [] when shouldProcess = false.
- value is always a JSON object — never a bare string.
- newSkill is null in most cases. Only set newSkill.create = true when the memory fact implies
  a genuinely reusable behavioral change (e.g. medication photo → cross-check interactions skill).
  Single observations rarely warrant a skill.

Known category patterns:
- Prescription bottle / medication packaging → category "health", namespace "health.medications"
- Meal or food product → category "food", namespace depends on context
- Gym bag, sports equipment → category "lifestyle", namespace "personality.fitness"
- Dog, cat, pet → category "lifestyle", namespace "relationships.pets"
- Baby, child → category "lifestyle", namespace "relationships.household"
- Blood pressure reading, glucose monitor, stool photo → category "health"
- Travel context (airport, landmark, foreign street) → category "location"
`

export async function processVisualIntake(
  imageBytes: Uint8Array,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
  db: DrizzleDB,
  userId: string,
  env: Env,
): Promise<void> {
  const genai = new GoogleGenerativeAI(env.GEMINI_API_KEY)
  const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const result = await model.generateContent([
    { text: VISUAL_INTAKE_PROMPT },
    { inlineData: { data: Buffer.from(imageBytes).toString('base64'), mimeType } },
  ])

  const raw = result.response.text()

  // Parse the JSON from the model's response
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) ?? raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return   // model returned unparseable output — silent discard

  const parsed = VisualIntakeOutputSchema.safeParse(JSON.parse(jsonMatch[0].replace(/```json|```/g, '')))
  if (!parsed.success) return   // schema mismatch — silent discard

  const output = parsed.data

  if (!output.shouldProcess) return   // agent decided this image is not worth processing

  // Write memory updates
  for (const update of output.memoryUpdates) {
    const existingEntry = db.select().from(userMemory)
      .where(eq(userMemory.id, `${update.namespace}:${update.key}`))
      .get()

    const mergedValue = existingEntry
      ? { ...JSON.parse(existingEntry.value), ...update.value }
      : update.value

    db.insert(userMemory).values({
      id:         `${update.namespace}:${update.key}`,
      userId,
      namespace:  update.namespace,
      key:        update.key,
      value:      JSON.stringify(mergedValue),
      confidence: update.confidence,
      source:     'image',
      active:     1,
      importance: 6,   // visual intake defaults to slightly above baseline — image evidence is intentional
      readCount:  0,
      writeCount: 1,
      lastWrite:  Date.now(),
      updatedAt:  Date.now(),
    })
    .onConflictDoUpdate({
      target:  userMemory.id,
      set: {
        value:      JSON.stringify(mergedValue),
        confidence: update.confidence,
        writeCount: sql`write_count + 1`,
        lastWrite:  Date.now(),
        updatedAt:  Date.now(),
      },
    })
    .run()
  }

  // Create skill if agent decided it warrants one
  if (output.newSkill?.create) {
    const { name, description, content } = output.newSkill
    const existing = db.select({ name: skills.name }).from(skills)
      .where(eq(skills.name, name)).get()

    if (!existing) {
      db.insert(skills).values({
        name,
        userId,
        description,
        content,
        tags:      '[]',
        source:    'user',
        status:    'active',
        version:   1,
        useCount:  0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).run()
    }
  }
}
```

---

## Classification Domains and Memory Routing

| What the user shows | Category | Namespace | Key examples |
|---|---|---|---|
| Prescription bottle | health | `health.medications` | `metformin`, `lisinopril` |
| Glucose monitor reading | health | `health.signals` | `glucose_reading` |
| Blood pressure display | health | `health.signals` | `blood_pressure` |
| Stool photo | health | `health.signals` | `bristol_stool_type` |
| Cooked meal | food | `food.meals` | `doro_wat` |
| Grocery product | food | `food.products` | derived from label |
| Dog | lifestyle | `relationships.pets` | `dog` |
| Baby | lifestyle | `relationships.household` | `infant` |
| Gym bag | lifestyle | `personality.fitness` | `gym` |
| Garden | lifestyle | `preferences.lifestyle` | `gardening` |
| Airport / foreign landmark | location | `life.travel` | `travel_context` |
| Blank wall / blurry / meme | — | shouldProcess = false | no write |

---

## Medication Photo — What Actually Changes

The structured health write is primary. Prescription photos create `health_captures` evidence and a normalized `medications` row. `user_memory.health.medications` can mirror a prompt-ready summary, but it is not the operational source for scan checks or reminders.

**After the write:**
- Every product scan automatically checks medication-food interactions for active rows in the private `medications` table
- Recipe suggestions filter against the same interaction rules
- Voice session context includes the medication list — the AI can mention interactions proactively
- Interaction rules live in Supabase as versioned config — updated without a deploy

**If the agent creates a skill** (not always):
Skill example: "When this user asks about any food or product, always check their active medication categories for interactions before responding." This is created when the medication implies a meaningful, reusable behavioral change that the agent cannot derive from the structured medication row alone — e.g., a medication with many known food interactions (Warfarin, MAOIs, statins). For most medications, the structured row plus summary mirror is sufficient.

**Cumulative:** multiple medication photos → multiple entries. All checked on every scan. "I stopped taking X" → agent sets `active = 0` on that entry. Interaction checks for that drug stop immediately.

---

## Stool Classification — Bristol Stool Scale

The Bristol Stool Scale is real clinical medicine (types 1–7). When a user submits a stool photo:

```typescript
// Example memory write for stool intake
{
  namespace:  'health.signals',
  key:        'stool_observation',
  value: {
    bristol_type:  6,                    // 1–7 per Bristol Scale
    observed_at:   Date.now(),
    context:       'watery, loose',
    cross_ref:     true,                 // flag for illness detective cross-reference
  },
  confidence:  0.85,
  source:      'image',
}
```

The agent then quietly cross-references against what was eaten in the last 24–48 hours using scan and receipt history. If a correlation pattern emerges, it flags it — not as a diagnosis but as a pattern signal. This is the food illness detective (spec 30) triggered by a photo rather than a voice report.

---

## Discard Decision — High Threshold

The agent should err toward discarding rather than writing noise. A low-confidence observation is worth less than a clean memory with no noise.

The model returns `shouldProcess = false` for:
- Blank walls, random furniture, backgrounds with nothing relevant
- Blurry or unidentifiable images
- Selfies with no food or health context
- Memes or social media screenshots
- Landscapes with no actionable meaning
- Anything below a reasonable confidence floor

When discarded: no notification, no error, no response. The user gets nothing back. That is correct.
