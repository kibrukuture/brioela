# 31. Kids Food Literacy Mode

## Goal

When a parent scans a product with their child, Brioela explains what is in it — and why it matters — in language a child can understand. The parent becomes the teacher. The child becomes engaged. The moment is shareable.

## Why This Exists

Parents want to teach their children about food. Most have no idea how. The ingredient list on a cereal box is impenetrable to a 7-year-old and barely decipherable to the parent reading it.

Brioela can bridge this. The same scan that gives the parent a full technical verdict can simultaneously produce a child-friendly explanation of the same thing — in the same moment, from the same product.

This is a shareable feature. "My 8-year-old now asks to scan groceries before we buy them" is a TikTok video that writes itself. Parents sharing this is organic distribution to an audience that trusts peer recommendations over ads.

## User Outcome

- Parent scans a product normally.
- A "explain to my kid" button appears on the scan result screen.
- One tap: Brioela produces a short, plain-language explanation of what the product contains, whether it is a good choice, and one interesting food fact — all calibrated for a child aged 5–12.
- The explanation can be read on-screen or played aloud (the AI reads it in a friendly voice).
- The parent and child hear it together. The child asks questions. The parent has answers.

## Age Calibration

The explanation adjusts based on the age range the parent sets (once, via a tap — not a form):

- **5–7 years**: very simple. "This has a lot of sugar — that's like eating 4 sugar cubes. Your body works better with less sugar." Colors, numbers, concrete analogies.
- **8–10 years**: slightly more. "This has something called Red Dye 40. Some kids find it makes them feel hyper. Scientists are still studying it." Introduce concept names.
- **11–12 years**: closer to adult. "This product has 28 grams of added sugar, which is already above the recommended daily limit for your age. The main preservative is sodium benzoate, which can react with vitamin C to form benzene."

If no age is set, Brioela defaults to the 8–10 range.

## The Explanation Format

Every kid-mode explanation has three parts:

1. **The verdict in one sentence**: "This is not a great snack — it has a lot of sugar and some artificial colors."
2. **The why in two sentences**: plain-language explanation of the main finding.
3. **One cool fact**: something true and interesting about food science that makes the child want to know more. "Did you know that the red color in some foods comes from a tiny bug called a cochineal? Look for 'carmine' on the label."

The cool fact is not always about the scanned product — it can be a broader food fact triggered by something in the product. It makes the interaction educational, not just verdictive.

## Voice Mode

In a cooking session (spec 10), the parent can say: "Explain this to my kid." The AI switches tone mid-session to child-friendly mode for that explanation, then returns to normal adult mode.

This requires no mode toggle. The voice agent detects the instruction contextually and adjusts.

## Shared Scan Card

After a kid-mode scan, the result screen offers a share card formatted differently from the standard scan share:

- Simplified design. Bright, clean.
- Shows the product, the child-friendly verdict, and "we scanned this together with Brioela."
- Parents share this to family group chats, parenting communities, TikTok.

The share card explicitly looks like a parenting moment, not an app advertisement. That is intentional.

## Safety Override

Kids mode does not suppress hard allergy flags. If the product contains a confirmed allergen for this family, that alert appears at the top of the screen in the standard critical format before the kids-mode explanation. Safety is never deprioritized for tone.

## Data Model

- `kids_mode_profile`: user_id, enabled (boolean), age_range (5-7 / 8-10 / 11-12), created_at.
- `kids_mode_scan_event`: scan_event_id, explanation_text, explanation_spoken (boolean), shared (boolean), created_at.

## Technical Constraints

- Kids mode explanation is generated as a secondary LLM call after the standard scan verdict. It does not replace the standard verdict — it augments it.
- The age calibration is passed as a parameter in the system prompt. The prompt instructs the model to avoid jargon above the target age level.
- Audio playback of the explanation uses the same TTS pipeline as the cooking voice agent — no additional infrastructure.
- Kids mode is available on Core tier and above. Free tier users see a teaser on the scan result with one example line and an upgrade prompt.

## Success Metrics

- Kids mode activation rate among users with family accounts or multi-user households.
- Scan-to-explanation rate in kids mode (parent actually taps "explain to my kid").
- Share card generation rate from kids mode scans.
- Voice explanation play rate.
- Retention difference between users with kids mode active vs. not (hypothesis: significantly higher — the feature creates a daily family habit).
