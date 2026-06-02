# LiveKit Limitations And Workarounds

This file is not a product spec.

This is an audit note for the LiveKit + Gemini Live research, including:

- what is supported
- what is limited
- where the limitation appears to come from
- proof links
- the recommended workaround for Brioela

## Core Question

Question:

- Does `gemini-3.1-flash-live-preview` support full live multimodal interaction with context injection?
- If something breaks, is that a Gemini problem or a LiveKit integration problem?

## Short Answer

- Gemini Live itself supports live multimodal sessions.
- Google docs indicate live audio, live video input, barge-in, and session management.
- The specific limitation discussed here is the current **LiveKit Agents integration path** for `gemini-3.1-flash-live-preview`.
- For Brioela, the best workaround is:
  - keep LiveKit for rooms/media
  - use Gemini Live directly for the model session
  - do not depend on the current LiveKit Gemini plugin path for `gemini-3.1-flash-live-preview`

## What Google Gemini Live Supports

Google docs indicate Gemini Live supports:

- low-latency live sessions
- audio input
- audio output
- video input
- text input/output
- interruption / barge-in
- session management
- updating system instructions during a session

### Proof Links

- Live API overview:
  - `https://cloud.google.com/vertex-ai/generative-ai/docs/live-api`
- Start/manage session:
  - `https://cloud.google.com/vertex-ai/generative-ai/docs/live-api/start-manage-session`
- Configure capabilities/tools:
  - `https://cloud.google.com/vertex-ai/generative-ai/docs/live-api/configure-gemini-capabilities`

### Important Google-side Evidence

From Google docs, key capability points include:

- Gemini Live enables low-latency realtime voice and video interaction.
- Users can interrupt the model during the session.
- System instructions can be updated during a session.

Important caveat from Google docs:

- functions/tools are not described as freely redefined at any moment
- tool declarations are expected at session start

Key quoted point from Google capability docs:

> "All functions must be declared at the start of the session"

Meaning:

- ongoing system instruction changes: supported
- ongoing media/context flow: supported
- arbitrary mid-session tool schema mutation: not the primary documented path

## What LiveKit Supports

LiveKit supports the room/media side well.

That includes:

- multi-person realtime rooms
- audio tracks
- video tracks
- data channels
- agent participants
- recordings / export
- agent frameworks and hosted agents

For Brioela live cooking sessions, LiveKit is a strong fit for:

- user + grandma + mom + AI in one room
- live mic and camera streams
- AI joining as a participant
- room recording
- shared state/events through data channels

### LiveKit Docs Links

- LiveKit agents overview:
  - `https://docs.livekit.io/agents.md`
- Realtime models overview:
  - `https://docs.livekit.io/agents/models/realtime.md`
- Multimodality overview:
  - `https://docs.livekit.io/agents/multimodality.md`
- Audio docs:
  - `https://docs.livekit.io/agents/multimodality/audio.md`
- Vision overview:
  - `https://docs.livekit.io/agents/multimodality/vision.md`
- Pricing:
  - `https://livekit.com/pricing`
- Inference pricing:
  - `https://livekit.com/pricing/inference`

## Exact LiveKit Limitation For Gemini 3.1 Live

The important page is:

- `https://docs.livekit.io/agents/models/realtime/plugins/gemini.md`

This is the exact LiveKit page documenting the limitation.

### Exact Quoted Text

> "`gemini-3.1-flash-live-preview` has known compatibility limitations with LiveKit Agents."

> "Gemini 3.1 Flash Live Preview restricts `send_client_content` to initial history seeding only."

> "`generate_reply()`, `update_instructions()`, and `update_chat_ctx()` are not compatible with 3.1 models."

> "The session still stores the updated values internally, but the changes aren't sent to the model mid-session."

> "Because `update_instructions()` is not supported mid-session, agent handoffs ... are also affected."

## What This Actually Means

This does **not** mean:

- Gemini cannot do duplex
- Gemini cannot hear and speak in realtime
- Gemini cannot accept any context
- LiveKit cannot host an AI participant in a room

It means:

- the current LiveKit Gemini plugin path for `gemini-3.1-flash-live-preview` has a limitation around certain mid-session control/update operations

The key distinction is:

- **media-plane** works
- **control-plane** is where the limitation appears

### Media-plane

This is fine:

- join room
- consume audio
- consume video
- publish audio back
- behave like a participant in the room

### Control-plane

This is where the documented issue is:

- mid-session `update_instructions()`
- mid-session `update_chat_ctx()`
- `generate_reply()`-style server-triggered reply patterns
- certain handoff/update flows

## Best Interpretation Of The Root Cause

Based on the docs:

- this does **not** look like a broad "Gemini Live cannot do this at all" limitation
- this does **not** look like a room/media limitation from LiveKit
- this looks like:
  - a model/API behavior mismatch for `gemini-3.1-flash-live-preview`
  - surfaced through LiveKit's Gemini plugin abstraction

In short:

- Gemini Live overall is capable
- this specific LiveKit integration path for this model has limitations

## Recommended Workaround For Brioela

### Best Path

Keep LiveKit.

Do not replace LiveKit.

Instead:

1. Use LiveKit for rooms, participants, audio/video transport, and data channels.
2. Have the backend subscribe to the room media.
3. Send selected audio/video directly to Gemini Live through Google's own live API.
4. Receive Gemini's output directly from Google's live session.
5. Publish the AI output back into the LiveKit room as the AI participant.

### Why This Is Best

This keeps:

- LiveKit doing what it is excellent at: realtime transport and rooms
- Gemini doing what it is excellent at: multimodal reasoning and speech

And it avoids depending on the current LiveKit Gemini plugin behavior for `gemini-3.1-flash-live-preview`.

## Brioela Architecture Recommendation

Recommended split:

- **LiveKit**: room, participants, WebRTC, mic/camera streams, data channels, recording
- **Gemini Live direct session**: multimodal AI brain
- **Brioela backend**: memory injection, policy, orchestration, tool bridging, recipe/session state

This gives the cleanest control.

## When LiveKit Plugin Is Still Fine

The LiveKit Gemini plugin is still acceptable if the Brioela flow is simple enough.

Examples:

- plain live cooking assistance
- AI hears and sees user actions
- AI responds naturally in realtime
- minimal mid-session instruction rewrites

If Brioela needs more advanced behavior such as:

- frequent live prompt mutation
- heavy context rewrites during the session
- complex agent handoffs
- aggressive server-triggered follow-up turns

then the direct Gemini Live bridge is safer.

## Practical Decision

### Option A

Use LiveKit Gemini plugin directly.

Good for:

- faster prototype
- simpler cooking assistant

Risk:

- documented 3.1 integration limitations

### Option B

Use LiveKit for transport and Gemini Live direct for the model session.

Good for:

- maximum control
- better alignment with Gemini's native live API capabilities
- safer long-term architecture if Brioela needs a very intelligent cooking brain with heavy context management

Recommended for Brioela:

- **Option B**

## Better Than LiveKit?

For multi-person audio/video plus AI, there is no clearly better default option found in this research.

Other options exist, but they are usually different tradeoffs, not obviously better:

- Daily
- Agora
- Twilio / Vonage video stacks
- fully custom WebRTC stack

For Brioela, LiveKit still looks like one of the strongest choices.

So the recommended move is:

- keep LiveKit
- replace only the Gemini integration path if needed

## Final Recommendation

For Brioela live cooking sessions:

- LiveKit is a good choice
- Gemini Live is the right model family if one brain should hear + see + talk
- for `gemini-3.1-flash-live-preview`, do **not** rely blindly on the current LiveKit Gemini plugin path for advanced mid-session control
- use a direct Gemini Live bridge if Brioela needs strong dynamic context and orchestration

## Source List

### Google

- `https://cloud.google.com/vertex-ai/generative-ai/docs/live-api`
- `https://cloud.google.com/vertex-ai/generative-ai/docs/live-api/start-manage-session`
- `https://cloud.google.com/vertex-ai/generative-ai/docs/live-api/configure-gemini-capabilities`

### LiveKit

- `https://docs.livekit.io/agents.md`
- `https://docs.livekit.io/agents/models/realtime.md`
- `https://docs.livekit.io/agents/models/realtime/plugins/gemini.md`
- `https://docs.livekit.io/agents/multimodality.md`
- `https://docs.livekit.io/agents/multimodality/audio.md`
- `https://docs.livekit.io/agents/multimodality/vision.md`
- `https://livekit.com/pricing`
- `https://livekit.com/pricing/inference`
