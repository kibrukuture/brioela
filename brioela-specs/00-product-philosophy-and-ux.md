# 00. Product Philosophy and UX

## The Core Principle

Brioela is an ambient operating system for everything you eat. The user never manages it. They just live their life and Brioela quietly makes it better. The product has one visible behavior: you point, it thinks, it tells you what matters. Everything else is invisible infrastructure.

The mental model for every design decision: Shazam for food. You open Shazam, it listens, it tells you the song. You configured nothing. You learned nothing. It just did the thing. Brioela is that, but for anything you eat or drink.

## The Ambient Principle

Ambient means the product exists in the background and surfaces only when it has something genuinely worth surfacing. It does not demand attention. It does not ask questions unless asking is the only option. It does not show dashboards the user has to go look at.

The app blends into the user's life. The smarter the backend, the simpler the foreground must be. These are inversely proportional. Complexity belongs in the system, not in the interface.

## Voice and Video First

- Primary input: voice.
- Secondary input: camera (pointing, not typing).
- Text input: only if voice or camera genuinely cannot handle it, and only for the shortest possible interaction.
- Forms: never. No onboarding forms, no preference screens, no profile builders.

The user never types out what they like, what they hate, or what they're allergic to. Brioela learns this by watching what they do.

## Zero Form Policy

No feature in Brioela may require the user to fill a form to begin receiving value. Constraints like allergies are learned the first time a mismatch is detected and the app asks once to confirm. Preferences are inferred from behavior before being confirmed. Dietary identity is proposed after enough signal exists, not demanded at registration.

The maximum number of questions Brioela asks a new user before providing value: two.

## How the App Learns

Brioela accumulates context from behavior, not self-reporting:

- Scans a product twice and does not buy it → probable dislike signal.
- Scans something containing an ingredient flagged in a prior complaint → allergy candidate.
- Saves recipes with a consistent cuisine → preference signal.
- Scans late at night repeatedly → time-of-day eating pattern.
- Says "I'm going to Tokyo next week" out loud → travel intent signal.

None of these require the user to open a settings screen. The system acts on patterns. When confidence is high enough, it may confirm the inference with one question. That's it.

## When the App Speaks vs Stays Silent

Brioela speaks only when:
1. The user directly asked something.
2. An allergy or safety risk is detected (immediate, unavoidable).
3. It has something genuinely useful that the user could not have asked for because they didn't know it existed — and the confidence is high.

Brioela does not speak when:
- It has something mildly interesting.
- The user is already in a flow (cooking, shopping, active conversation).
- It already surfaced something similar in the last hour.
- Confidence is below threshold.

Silence is the default. Speech is the exception.

## The "Two Brain Cell" UX Standard

Every user interaction must be completable by someone who is distracted, standing in a grocery store, has their hands covered in flour, or is half asleep. This means:

- No screen requiring more than 10 words to understand.
- No primary action that requires a second tap to locate.
- No result that requires reading more than two lines to get the point.
- No notification that is not immediately obvious in its meaning and action.

## The "Can't Live Without It" Moment

Every user experiences one moment where Brioela surprises them with something they needed but did not ask for. That moment converts a casual user into a permanent one. Examples:

- Flags a trace allergen in a product the user assumed was safe.
- Surfaces grandma's recipe exactly when the user just bought those ingredients.
- Alerts about a product the user buys regularly being cheaper 200 meters away.
- Detects that every time the user eats this brand they don't cook for three days after.

The product is engineered to create this moment as early as possible in the user's first week.

## The Two Product Laws

1. The user never manages the system. The system manages itself and reports back.
2. A feature that requires the user to remember to use it is a feature that will be abandoned within two weeks.

Every spec in this folder must be read against these two laws before implementation begins.

## The Third Law: Scanning Is Always Free

Unlimited scanning is never paywalled. Not on day one. Not ever.

The scan moment is the core viral loop, the primary acquisition mechanism, and the daily habit driver. People scanning products in grocery stores and showing the results to strangers next to them is free distribution at scale. A paywall after 10 scans breaks that loop permanently. Yuka proved that unlimited free scanning grows to 73 million users. No other metric overrides this rule.
