# Design Philosophy

## The Standard

Every design decision in Brioela is made against one test: does this feel like it was built for this person specifically? Not for a general user. Not for a persona. For the person holding the phone right now.

The visual bar is set by the best iOS experiences of 2025-2026: Apple's Liquid Glass language (depth, refraction, material), Teenage Engineering's product discipline (every element has a reason), and the premium editorial tradition (typography that carries meaning, not just content). These are not references to imitate — they are the floor.

---

## Ambient Intelligence, Not Tool

Brioela is not a scanner you pull out when you need it. It is an intelligence that runs alongside your food life. The design must reflect this. Idle states are alive but quiet. The interface does not demand attention. It offers it.

Concretely:
- The app at rest is not empty. It breathes. The ambient background field (Skia shader layer) gives the darkness depth.
- Content appears when it is relevant, not when the user requests it. Proactive intelligence is a visual expectation.
- The interface is confident. It does not hedge. When the AI knows something, it states it. The design reflects that confidence — no excessive qualifiers, no decorative uncertainty.

---

## Two Brain Cell Standard

Spec `00-product-philosophy-and-ux.md` defines this: no screen should require more than 10 words to understand. No action should require more than one tap to locate.

Design implications:
- The primary action on any screen is immediately obvious — size, position, and visual weight are unambiguous.
- Secondary and tertiary actions are present but not competing. They do not shout.
- Information hierarchy is ruthless: the most important thing is largest and highest. One hierarchy, one reading direction.
- If a screen requires explanation, the screen is wrong.

This standard applies to every feature UI built from this design system.

---

## Zero Form Policy

Spec `00-product-philosophy-and-ux.md` bans forms. No form fields except where legally or technically unavoidable (authentication inputs, legal agreement).

Design implications:
- Constraints are captured via conversational AI exchange or scan, never via a form
- Preferences are learned from behavior, never from settings panels
- When user input is required, it is a single tap (select), a voice utterance, or a camera frame — never typed text
- The keyboard is an exceptional state, not a normal one

If a design concept requires a form, the concept is wrong.

---

## Depth and Glass

Brioela's surfaces are layered, not flat. The interface exists in three-dimensional space:
- Background: the world (dark ambient field)
- Mid-layer: content surfaces (Liquid Glass cards — blurred, translucent, floating)
- Foreground: primary actions and critical information

The glass metaphor is pervasive. Every card surface is glass — `BackdropFilter` blur behind it, the world visible through it. The color of the environment bleeds through the glass. When the AI determines something, the environment tints accordingly.

This creates a design grammar: depth communicates importance. What floats is more important than what is behind it. The user intuitively reads the hierarchy through the physicality of the layers.

---

## Typography as Tone

The three-font system is not aesthetic variety — it is a tonal vocabulary.

The display font (Cormorant Garamond) speaks for the app in peak moments. It is rare and therefore powerful. When it appears, the user stops.

The functional font (Plus Jakarta Sans) is the working voice — precise, confident, consistent. It never surprises.

The body font (DM Sans) is the reading voice — approachable, warm, unhurried. It is what the user reads when they have time.

The design rule: use the display font only when the moment earns it. Overuse destroys its power. The frequency of display font usage is calibrated across the whole app — each feature's UI spec defines exactly when.

---

## Motion as Physics

All interactive motion has mass. Physics governs how things arrive and depart. The consequence:
- Elements land with weight — a small settling overshoot that communicates substance
- Elements leave cleanly — no bounce, because departure is not energetic
- Danger states snap — urgency has no room for spring physics
- Ambient states breathe — organic, not mechanical

The user never reads the motion consciously. They feel the weight of the interface. They feel that it is responsive. They feel that it respects what just happened. That feeling is built by the spring configs in `04-motion.md`.

---

## Color as Response

The color system does not decorate — it responds. The verdict color field exists because the AI has evaluated something and reached a conclusion. The interface makes that conclusion felt before the user reads it.

The corollary: when the AI has not concluded anything, the interface does not pretend it has. Neutral surfaces are genuinely neutral. No decorative gradients. No colorful empty states. Color in Brioela carries semantic weight.

---

## Generative UI as Intelligence Expression

Generative UI is not a feature. It is how the AI's intelligence becomes visible in the interface. The AI sees context that a static component tree cannot. When it selects a layout variant or assembles props for a specific moment, it is expressing that contextual awareness in visual form.

The design constraint: the AI selects from a finite registry. This is not a limitation — it is the discipline that keeps generative UI trustworthy. The components in the registry are designed by the team; the AI's intelligence is expressed through which one fits the moment.

---

## Restraint as a Design Value

The most powerful moments in Brioela are rare. The holographic shimmer appears for genuine milestones, not routine interactions. The display font appears at genuine peaks, not at every section header. The verdict color bloom appears when the AI has actually evaluated something, not as decoration.

Restraint is what gives these moments power. An interface that performs at full intensity all the time trains the user to ignore it. An interface that is mostly quiet, and occasionally extraordinary, teaches the user that the extraordinary moments mean something.

Every design decision about frequency, scale, and intensity should be made in service of this principle: is this moment earning the attention it is asking for?
