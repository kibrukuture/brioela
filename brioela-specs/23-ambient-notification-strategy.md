# 23. Ambient Notification Strategy

## Goal

Define exactly when Brioela surfaces information to the user, what form it takes, and the rules that prevent it from becoming noise. The default is silence. Interruption requires justification.

## The Core Rule

Brioela does not push notifications. Brioela surfaces moments.

A moment has three properties:
1. The information is genuinely useful to this specific user right now.
2. The user could not have found it themselves without effort.
3. The timing is correct — surfacing it earlier or later would reduce its value.

If any of these three are missing, the information stays silent.

## Priority Levels

### Critical (Always Delivered Immediately)
- Allergy or safety match detected in a product the user is actively scanning.
- Hard allergen detected in a product the user is about to cook with.
- These cannot be suppressed. They interrupt whatever the user is doing.

### High (Delivered When Contextually Appropriate)
- Cooking session invite from a family member or friend.
- Pre-trip food intelligence ready before departure.
- Post-cooking session: recipe has been captured and saved permanently.
- Constraint confirmed (first time the agent is sure about a new preference or allergy).

### Medium (Batched, Delivered Once Per Day Maximum)
- Weekly food summary (Sunday morning, not a weekday afternoon).
- Hyperlocal price alert for a product the user buys regularly.
- New community note on a product the user has scanned multiple times.
- Healthy food map: nearby farmers market or health store discovered.

### Low (Never as Push — In-App Only)
- General recipe suggestions.
- Browse-mode discovery content.
- Feature announcements or subscription prompts.
- Stats about the user's food patterns (shown on open, never pushed).

## Delivery Rules

- **Maximum push notifications per day**: 1 for medium priority, unlimited for critical.
- **No marketing push notifications**: ever. Upgrade prompts, feature announcements, and re-engagement messages are in-app surfaces only, never push.
- **No push during active sessions**: if the user is in a voice session or a cooking room, non-critical notifications are queued and shown after the session ends.
- **Quiet hours**: no push notifications between 11pm and 7am local time, except critical safety alerts.
- **Geo-triggered timing**: map-based notifications (farmers market nearby, price alert at store) are only delivered when the user is near the relevant location and during reasonable hours.

## Notification Suppression Rules

- If the user dismisses a type of notification twice without acting on it, that category is automatically suppressed for 14 days.
- If the user dismisses three of the same category, it is permanently suppressed unless re-enabled.
- Suppression state is stored in the Orchestrator DO per user.

## In-App Ambient Surfaces

Not all surfacing is a push notification. Most moments happen inside the app without interruption:

- **During scan**: community notes appear below the verdict automatically. The user sees them without opening a feed.
- **On map open**: the map is already pre-filtered by the user's dietary constraints. No setup needed each time.
- **Before a voice session**: the AI already knows the recipe, the user's constraints, and recent patterns. It does not need to ask "what are you cooking?" if a recipe is already selected.
- **After a scan rejected a product**: the app silently adds it to a "products you avoid" list. The user is not told — they just notice it never appears as recommended.

## The "One Thing" Rule for Push Notifications

Each push notification carries one piece of information and one optional action. It never tries to do two things. Examples of correct format:

- "The olive oil you scan often is cheaper 300m away. [Open map]"
- "Grandma's pasta recipe is saved. [View recipe]"
- "You're heading to Tokyo. Food intel is ready. [See what to eat]"
- "This product has peanuts. You scanned it before and skipped it. [Flag to avoid]"

No multi-part messages. No compound CTAs.

## Notification Permission Request Timing

Notification permission is requested after the user has received their first scan result and seen that the product is useful. It is not requested at app install or during onboarding. The prompt appears when:
- The user scans something with a community note nearby, and showing a permission request is contextually natural ("People near you commented on this — want alerts when that happens?")
- Or: after the user's third scan session.

## Data Model

- `notification_log`: user_id, type, priority, content_ref, delivered_at, opened_at, dismissed_at.
- `notification_suppression`: user_id, notification_type, suppressed_until, permanent.
- `notification_queue`: user_id, type, priority, payload_json, earliest_deliver_at, expires_at.

## Success Metrics

- Push notification open rate (target: above 30% for medium priority).
- Dismissal rate per notification type.
- Suppression trigger rate (proxy for notification quality — high suppression rate means quality is too low).
- Re-engagement rate from weekly summary delivery (users who return to app within 24 hours of receiving summary).
