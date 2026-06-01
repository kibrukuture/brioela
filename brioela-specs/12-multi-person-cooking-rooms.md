# 12. Multi-Person Cooking Rooms

## Goal
Enable multiple human participants plus Brioela's cooking agent to join the same live cooking session and coordinate around one recipe.

## User Outcome
- Invite family or friends into a cooking room.
- Share audio, optional video, and synchronized recipe state.
- Let Brioela guide the group and adapt to multiple participants.

## In Scope
- Shared room session.
- Participant presence.
- Shared recipe progress.
- Multi-speaker transcript handling.

## Out of Scope
- Public livestreaming.
- Creator monetization.

## Core Session Objects
- `cooking_room`
- `room_participant`
- `room_recipe_state`
- `room_transcript_event`

## System Design
- Realtime media provider handles transport.
- Brioela room coordinator keeps canonical recipe state.
- Participant speech is attributed where possible.
- Agent responses are broadcast back into the room.

## State Rules
- One canonical active recipe per room.
- All participants see the same current step.
- The room owner or designated controller can override step changes.

## Technical Constraints
- Must tolerate unstable mobile connections.
- Must support resume after temporary disconnect.
- Transcript attribution should not block the session when uncertain.

## Success Metrics
- Number of multi-person sessions created.
- Mean participants per room.
- Session completion rate.
