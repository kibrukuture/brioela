# Verified Profiles — Creator Video Firewall

## What This File Covers

How verified_profile creators and chefs can publish or attach step-by-step food videos without turning Brioela into TikTok. This is a relevance firewall for creator content.

---

## Core Rule

Creator videos are not a feed.

Brioela does not show endless creator videos. It shows the few creator videos that are most useful for the user's current food context.

If there are 10,000 creator videos, the user should maybe see 10, and often zero.

---

## Where Creator Videos Can Appear

Allowed surfaces:

- imported recipe attribution
- recipe detail, if the user imported/saved that creator's recipe
- cooking session step help
- meal-plan recipe suggestion, if the recipe fits the user
- search result when user asks for a specific dish/cuisine
- verified profile page

Blocked surfaces:

- infinite vertical video feed
- algorithmic entertainment feed
- autoplay feed on home
- random creator recommendations unrelated to user intent
- follower-based discovery feed

---

## Creator Video Shape

```typescript
type VerifiedCreatorVideo = {
  videoId: string
  verifiedProfileId: string
  recipeId: string | null
  title: string
  sourceUrl: string | null
  durationSeconds: number
  stepMarkers: Array<{
    stepIndex: number
    startSecond: number
    endSecond: number
    label: string
  }>
  constraintTags: string[]
  cuisineTags: string[]
  difficulty: "easy" | "medium" | "hard"
  verificationStatus: "pending" | "approved" | "rejected"
}
```

Videos should be structured around cooking usefulness: steps, timing, ingredients, technique, substitutions.

---

## Relevance Firewall

A creator video can surface only if it passes relevance checks.

Checks:

- matches the current recipe, dish, or user query
- compatible with user's hard constraints or has clear adaptations
- source is verified_profile and video is approved
- not already dismissed by user
- not repetitive with recently shown videos
- useful in the current moment, not just popular

Ranking inputs:

- recipe fit
- constraint compatibility
- pantry/meal-plan fit
- creator verification strength
- user cuisine/preferences
- cooking skill level
- video step quality
- recency only as a minor factor

Popularity is not the primary ranker.

---

## Surface Limits

Limits:

- max 3 creator videos in a recipe suggestion context
- max 1 creator video per cooking step
- max 10 total creator videos in any browse/search result page
- no automatic weekly creator recommendations unless user asks
- no push notifications for creator videos

Brioela is not a place to scroll. It is a place to decide and cook.

---

## Recipe Import Loop

When a user imports a recipe from a verified_profile creator:

- preserve creator attribution
- prefer creator's structured recipe source if available
- attach step video markers if approved
- run user-specific constraints and substitutions
- let the user cook it in Brioela

Share copy can say:

```text
Cooked from [Creator] with Brioela.
Adapted for gluten-free automatically.
```

Only include the adaptation if the user chooses to share it and privacy scrub passes.

---

## Creator Benefit

Creators get distribution through utility, not feed addiction.

They benefit when their recipes are:

- imported cleanly
- attributed correctly
- easier to cook
- adaptable to constraints
- discoverable by relevant users

The creator wins because their food becomes cookable. Brioela wins because recipe quality and attribution improve.

---

## Privacy And Safety

Do not expose user health profile to creators.

Creators can see aggregate privacy-safe analytics later, such as saves or cook starts. They cannot see:

- which user has which allergy
- medical conditions
- Mesa members
- wearable/glucose data
- private substitutions unless aggregated and safe
