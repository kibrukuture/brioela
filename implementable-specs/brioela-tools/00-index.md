# Brioela Tools — Index

Each tool is one file. One file per tool — full depth: purpose, input schema, output, side effects, error cases, who can call it.

Tools are the ONLY interface between the agent's language model and the DO's SQLite. Every write to every table happens through a tool. Every structured read that is not automatic context loading happens through a tool. This folder is the agent's complete action vocabulary.

## Memory Tools

| File | Tool | One Line |
|---|---|---|
| [01-log-memory-event.md](./01-log-memory-event.md) | `log_memory_event` | Write a raw event into memory_event |
| [02-memory-update.md](./02-memory-update.md) | `memory_update` | Write or merge a structured fact into user_memory |
| [03-memory-read.md](./03-memory-read.md) | `memory_read` | Read a specific fact from user_memory mid-session |

## Skill Tools

| File | Tool | One Line |
|---|---|---|
| [04-skill-create.md](./04-skill-create.md) | `skill_create` | Create a new procedural skill |
| [05-skill-update.md](./05-skill-update.md) | `skill_update` | Rewrite an existing skill's content |
| [06-skill-view.md](./06-skill-view.md) | `skill_view` | Load a skill's full content into context |
| [07-skill-archive.md](./07-skill-archive.md) | `skill_archive` | Archive a skill, removing it from the index |
| [08-skill-delete.md](./08-skill-delete.md) | `skill_delete` | Permanently delete a skill row |

## Constraint Tools

| File | Tool | One Line |
|---|---|---|
| [09-propose-constraint.md](./09-propose-constraint.md) | `propose_constraint` | Propose a new allergy, intolerance, dislike, or boycott |
| [10-confirm-constraint.md](./10-confirm-constraint.md) | `confirm_constraint` | Confirm or reject a proposed constraint |

## Alarm Tools

| File | Tool | One Line |
|---|---|---|
| [11-schedule-alarm.md](./11-schedule-alarm.md) | `schedule_alarm` | Schedule a time-based alarm |
| [12-cancel-alarm.md](./12-cancel-alarm.md) | `cancel_alarm` | Cancel a pending alarm |

## Recipe Tools

| File | Tool | One Line |
|---|---|---|
| [13-recipe-view.md](./13-recipe-view.md) | `recipe_view` | Load a recipe's full content into context |
| [14-recipe-update.md](./14-recipe-update.md) | `recipe_update` | Rewrite a recipe's content and re-extract ingredients |
| [15-recipe-archive.md](./15-recipe-archive.md) | `recipe_archive` | Archive a recipe |

## Session Tools

| File | Tool | One Line |
|---|---|---|
| [16-get-session-context.md](./16-get-session-context.md) | `get_session_context` | Load previous session outcome and relevant context at session start |
| [17-recall-session-context.md](./17-recall-session-context.md) | `recall_session_context` | Search past sessions by keyword or meaning |

## Status

| Tool | Status |
|---|---|
| log_memory_event | ✓ DONE |
| memory_update | OPEN |
| memory_read | OPEN |
| skill_create | OPEN |
| skill_update | OPEN |
| skill_view | OPEN |
| skill_archive | OPEN |
| skill_delete | OPEN |
| propose_constraint | OPEN |
| confirm_constraint | OPEN |
| schedule_alarm | OPEN |
| cancel_alarm | OPEN |
| recipe_view | OPEN |
| recipe_update | OPEN |
| recipe_archive | OPEN |
| get_session_context | OPEN |
| recall_session_context | OPEN |
