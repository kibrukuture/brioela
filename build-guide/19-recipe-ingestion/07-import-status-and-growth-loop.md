# Recipe Ingestion — Import Status And Growth Loop

## What This File Covers

The user-facing import status experience, failure/partial states, completion surfaces, and why share-sheet recipe import is a product growth loop.

---

## User-Facing States

The import experience has four user-visible states:

| State | Copy | Primary action |
|---|---|---|
| queued/processing | "Turning this into a recipe..." | View status |
| completed | "Recipe imported." | Open recipe |
| needs review | "Recipe imported, but a few details need review." | Review recipe |
| partial | "Source saved, but I could not fully extract the recipe." | Retry later |

Never leave the user wondering whether the share worked.

---

## Status UI

Status UI can live in:

- share extension confirmation
- app import tray
- recipe library pending section
- push/in-app completion surface if allowed

The status view should show:

- source title/thumbnail
- current status
- warnings
- retry option for partial/failed
- open recipe when complete

---

## Failure Handling

Failure copy should be specific and recoverable.

Examples:

- "This source is private, so I cannot read it."
- "I found a video, but no recipe text or transcript."
- "The image is too blurry to read."
- "This does not look like a recipe."

Do not say only "Import failed."

---

## Notification Rules

Recipe import completion can be a low/medium priority notification only when useful.

Follow `12-notifications`:

- no non-critical push during active sessions
- quiet hours apply
- one thing rule
- no marketing copy

Push copy:

```text
Recipe imported: Spicy Chickpea Bowl.
```

Action:

```text
Open recipe
```

If the user is already active in app, use in-app completion instead of push.

---

## Acquisition Loop

The share-sheet import loop is:

1. User sees food content on TikTok, YouTube, Instagram, or web.
2. User taps Share.
3. Brioela appears as an action.
4. One tap starts import.
5. Recipe becomes cookable in Brioela.
6. User has a reason to return, cook, and keep the app.

This is a stronger acquisition moment than an ad because the user has immediate intent.

---

## If User Does Not Have App Installed

For web/PWA discovery flows:

- Show a lightweight landing page for recipe import.
- Explain that native app enables one-tap share-sheet import.
- Preserve the source URL through install handoff when possible.
- After install/sign-in, resume import.

This supports the viral-growth spec without turning recipe import into a public publishing feature.

---

## Sharing Boundary

Recipe ingestion does not publish imported recipes to a community feed.

Allowed:

- user imports a recipe privately
- user sees source attribution
- user later cooks it
- future viral-sharing feature may create share cards around Brioela moments

Blocked in this folder:

- public recipe reposting
- creator-content scraping for community databases
- social feeds of imported recipes
- automatic external sharing

The growth loop is one-tap utility, not content theft or social reposting.

---

## Success Metrics

Track:

- share extension open rate
- import job creation rate
- import completion rate
- time from share to usable recipe
- partial/failure reason distribution
- imported recipes later cooked
- install conversion from shared-recipe/PWA flow

The strongest metric is not imports created. It is imported recipes later cooked.
