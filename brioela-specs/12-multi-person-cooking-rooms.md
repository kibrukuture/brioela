# 12. Multi-Person Cooking Rooms

## Goal

Enable multiple people in different locations to cook the same recipe together in real time, with Brioela's AI agent coordinating all participants, adapting to each person's kitchen, and recording the session into permanent memory.

## User Outcome

- Create or join a cooking room with a recipe selected.
- Family members or friends anywhere in the world join the same room.
- Everyone hears the AI agent. Everyone progresses through the same recipe steps.
- Brioela adapts to each participant's constraints (one person is dairy-free, grandma is diabetic, the child is allergic to peanuts) while keeping the session unified.
- After the session, the recipe and any grandma-style variations are saved permanently.

## Core Scenarios

### Remote Family (Primary Scenario)
Parent in kitchen. Grandma 100km away. Child at the counter. All connected through Brioela. Grandma is cooking from memory — she's done this dish 300 times. The AI watches, listens, reconstructs her technique into a structured recipe in the background. Everyone can hear her and the AI simultaneously.

### Friends Cooking the Same Dish (Second Scenario)
Two people in different cities agree to cook the same recipe tonight. They join a shared room. The AI guides both simultaneously, aware that one person's kitchen has different equipment and one person is missing an ingredient that needs a substitution. The AI adapts per-participant while keeping the shared step progression synchronized.

## In Scope

- Shared room with multiple human participants.
- Participant presence and audio (video optional per participant).
- Synchronized recipe step progression.
- Per-participant constraint awareness.
- Multi-speaker transcript attribution where possible.
- AI agent broadcast back into the room.
- Post-session recipe capture and memory write (see spec 13).

## Out of Scope

- Public livestreaming or broadcasting to non-participants.
- Creator monetization or tipping.
- Recording and distributing sessions externally.

## Media Transport: LiveKit Cloud

All multi-person rooms use LiveKit Cloud exclusively. This is the managed WebRTC SFU — Brioela does not run WebRTC infrastructure.

LiveKit Cloud handles: audio track routing between all participants, video track routing where enabled, room lifecycle, participant presence, reconnection on network drop, end-to-end encryption. Cost: $0.0005/minute per participant.

A grandma cooking session (grandma + parent + child + AI participant = 4 participants, 45 minutes) = $0.09 in LiveKit costs.

## AI Agent in the Room

The Brioela AI agent joins the LiveKit room as a participant via the LiveKit Agents SDK running as a Node.js worker on managed infrastructure (Railway or Fly.io). Before joining, it pulls full context from each participant's Orchestrator DO (their individual allergies, dislikes, dietary identity, prior recipe history).

The AI agent's voice goes back into the room via LiveKit so all participants hear it simultaneously.

The AI agent uses `gemini-3.1-flash-live-preview` as its brain — the same model as single-user sessions. The system prompt includes all participants' constraints merged into a unified context. When there is a conflict (grandma's recipe uses butter, one participant is dairy-free), the AI flags this to the group and suggests a per-person substitution.

## Per-Participant Constraint Handling

Each participant in the room has their own Orchestrator DO with their own constraints. The CookingAgent DO fetches all constraints at session start and merges them:

- Hard allergies from any participant: the AI never suggests that ingredient to anyone without flagging it loudly.
- Dietary identity conflicts: surfaced proactively before cooking begins, not mid-session.
- Soft dislikes: handled per-participant in substitution suggestions without disrupting the group.

## Session State (Held in CookingAgent DO)

- Room ID (LiveKit room name).
- Participant list: user_id, participant_name, livekit_participant_id, constraints_summary.
- Canonical active recipe and step list.
- Current step index (shared for all participants).
- Transcript accumulation: attributed to participant where speaker identification is possible.
- Vision frames: only from participants who have enabled camera in the session.

## State Rules

- One canonical active recipe per room.
- All participants see the same current step.
- The room creator is the default step controller.
- Any participant can request a step advance — the AI confirms before executing.
- Transcript attribution is best-effort. Session does not fail if attribution is uncertain.

## Technical Constraints

- Session must survive temporary disconnect by any participant including the AI agent.
- On reconnect, participant state is restored from CookingAgent DO.
- Audio track failures for one participant must not interrupt other participants.
- The AI agent reconnects automatically if its LiveKit connection drops.

## Post-Session Flow

On session end, the CookingAgent DO fires a job to Upstash Workflow:
1. Compile full multi-speaker transcript.
2. Reconstruct any taught recipe variations (especially grandma-style variations from spec 13).
3. Write finalized recipe and session summary to each participant's Orchestrator DO individually.
4. Notify each participant their recipe has been saved.

Each participant's memory is updated independently — they each own their own copy of what was learned.

## Data Model

- `cooking_room`: room_id, livekit_room_name, creator_user_id, recipe_id, created_at, ended_at, status.
- `room_participant`: room_id, user_id, livekit_participant_id, joined_at, left_at, constraints_snapshot_json.
- `room_recipe_state`: room_id, recipe_id, current_step_index, step_overrides_json, updated_at.
- `room_transcript_event`: room_id, speaker_participant_id, text, attributed_at, confidence.

## API Surface

- `POST /api/rooms/create` — create a room, select recipe, return room_id and LiveKit join token.
- `POST /api/rooms/:id/join` — join an existing room, return LiveKit join token with participant's context injected.
- `POST /api/rooms/:id/end` — close the room and trigger post-session workflow.
- `GET /api/rooms/:id/state` — return current room state for reconnecting participants.

## Success Metrics

- Number of multi-person sessions created per week.
- Mean participants per room.
- Session completion rate.
- Post-session recipe capture rate.
- Reconnect success rate (resilience proxy).
