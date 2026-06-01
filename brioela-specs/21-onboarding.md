# 21. Onboarding

## Goal

Get the user from first app open to their first genuinely useful moment in the shortest time possible, without asking them to fill out a profile, configure preferences, or learn how the app works.

## The Core Rule

The maximum number of questions Brioela asks during onboarding: two.

Onboarding does not mean registration forms, preference wizards, or feature tours. Onboarding means the user does something, Brioela responds usefully, and the user understands what the product does — through experience, not explanation.

## First Session Flow

1. **App opens** — one full-screen prompt: "Point at something you're about to eat."
   - No tutorial. No feature list. No how-it-works screen.
   - Camera opens immediately.

2. **User scans something** — product is resolved, verdict appears in under 3 seconds.
   - User sees: color verdict, one-sentence reason, optional expand.
   - This is onboarding. The product explained itself.

3. **After the first scan** — one optional question appears, only if the verdict flagged something:
   - "This has [ingredient]. Want me to always flag it?" Yes / No.
   - If the scan was clean, no question. The user just got value and nothing else is needed.

4. **Account creation** — deferred. The user can scan multiple times before being asked to create an account. The first sign-up prompt appears when the user tries to save a recipe, write a community note, or start a voice session.
   - Authentication: Apple Sign In or Google Sign In only. No email/password forms.

5. **The second possible question** — "Are there foods you must avoid for health reasons?" This appears only after the user's second or third scan, and only if no allergy signal has been detected yet. It is skippable with one tap.

## What Brioela Never Does in Onboarding

- Does not show a multi-step welcome flow.
- Does not ask "What are your health goals?"
- Does not ask "What is your dietary preference?" as a dropdown.
- Does not ask "What do you usually eat?"
- Does not show a permissions request screen ahead of the camera open — permission is requested on the first action that requires it.
- Does not show a subscription upgrade prompt until the user has scanned at least 3 products.

## Permission Request Sequencing

Permissions are requested exactly when the user takes an action that needs them, not before:

- Camera: when camera first opens (first action in the app).
- Location: when the user first opens the map or sees a local community note prompt.
- Notifications: after the user has received their first product scan verdict and the app has shown it can be useful. Not before.
- Microphone: when the user first taps to start a voice session.

## Cold Start (No Data Yet)

On a new account with no history, Brioela has no personalization data. The cold-start behavior for each feature:

- Scan verdict: uses base product score only, no personal adjustments. Still fully useful.
- Community notes: shows notes from nearby users, no personal filtering yet.
- Map: shows all nearby places by default health score, no personal filter.
- Recipe suggestions: shows popular and trending. No personal curation.
- Voice agent: asks at session start "What are we cooking?" and works from the recipe alone, without personal memory.

As the user scans, saves, and cooks, the memory fills in. The product gets visibly better within the first week of real use. This is the designed arc.

## Behavioral Constraint Discovery (Ongoing, Not One-Time)

Allergy and dislike constraints are not collected at registration. They are discovered over time through behavior and occasionally confirmed:

- User scans a product twice and does not buy it → dislike candidate. App remembers but does not confirm yet.
- After three similar rejections → app asks once: "I noticed you often skip products with [X]. Should I flag those?" Yes / No.
- User says during cooking "I don't really like this" → app records the signal, confirms if pattern repeats.
- User explicitly says "I'm allergic to peanuts" during any voice session → immediately confirmed as a hard allergy, no follow-up question needed.

One confirmation per constraint. After that, Brioela never asks about it again.

## App Store First Impression

The App Store description and screenshots must lead with the scan moment, not feature lists. The tagline and visuals should communicate: point your phone at food, know immediately if it's safe and healthy. Everything else is secondary.

## Success Metrics

- Time from first app open to first useful scan verdict.
- Account creation rate after first scan session.
- First-week retention (users who return within 7 days of first scan).
- Constraint confirmation rate (how many inferred constraints the user accepts vs. dismisses).
- Permission grant rate per permission type.
