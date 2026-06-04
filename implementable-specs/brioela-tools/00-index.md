# Brioela Tools — Index

Each tool is one file. One file per tool — full depth: purpose, input schema, output, side effects, error cases, who can call it.

Tools are the ONLY interface between the agent's language model and the DO's SQLite. Every write to every table happens through a tool. Every structured read that is not automatic context loading happens through a tool. This folder is the agent's complete action vocabulary.

**Naming convention**: `verb_table_name` — three words, underscore-separated. The table the tool touches is always in the name. No ambiguity about what a tool does or where it writes.

## Memory Tools

| File | Tool | Table | One Line |
|---|---|---|---|
| [01-log-memory-event.md](./01-log-memory-event.md) | `log_memory_event` | `memory_event` | Write a raw event into memory_event |
| [02-write-user-memory.md](./02-write-user-memory.md) | `write_user_memory` | `user_memory` | Write or merge a structured fact into user_memory |
| [03-read-user-memory.md](./03-read-user-memory.md) | `read_user_memory` | `user_memory` | Read a specific fact from user_memory mid-session |

## Skill Tools

| File | Tool | Table | One Line |
|---|---|---|---|
| [04-create-user-skill.md](./04-create-user-skill.md) | `create_user_skill` | `skills` | Create a new procedural skill |
| [05-update-user-skill.md](./05-update-user-skill.md) | `update_user_skill` | `skills` | Rewrite an existing skill's content |
| [06-view-user-skill.md](./06-view-user-skill.md) | `view_user_skill` | `skills` | Load a skill's full content into context |
| [07-archive-user-skill.md](./07-archive-user-skill.md) | `archive_user_skill` | `skills` | Archive a skill, removing it from the index |
| [08-delete-user-skill.md](./08-delete-user-skill.md) | `delete_user_skill` | `skills` | Permanently delete a skill row |

## Constraint Tools

| File | Tool | Table | One Line |
|---|---|---|---|
| [09-propose-user-constraint.md](./09-propose-user-constraint.md) | `propose_user_constraint` | `constraints` | Propose a new allergy, intolerance, dislike, or boycott |
| [10-confirm-user-constraint.md](./10-confirm-user-constraint.md) | `confirm_user_constraint` | `constraints` | Confirm or reject a proposed constraint |

## Alarm Tools

| File | Tool | Table | One Line |
|---|---|---|---|
| [11-schedule-user-alarm.md](./11-schedule-user-alarm.md) | `schedule_user_alarm` | `scheduled_alarms` | Schedule a time-based alarm |
| [12-cancel-user-alarm.md](./12-cancel-user-alarm.md) | `cancel_user_alarm` | `scheduled_alarms` | Cancel a pending alarm |

## Recipe Tools

| File | Tool | Table | One Line |
|---|---|---|---|
| [13-view-user-recipe.md](./13-view-user-recipe.md) | `view_user_recipe` | `recipes` | Load a recipe's full content into context |
| [14-update-user-recipe.md](./14-update-user-recipe.md) | `update_user_recipe` | `recipes` | Rewrite a recipe's content and re-extract ingredients |
| [15-archive-user-recipe.md](./15-archive-user-recipe.md) | `archive_user_recipe` | `recipes` | Archive a recipe |

## Session Tools

| File | Tool | Table | One Line |
|---|---|---|---|
| [16-load-session-context.md](./16-load-session-context.md) | `load_session_context` | `sessions` + related | Load previous session outcome and relevant context at session start |
| [17-search-session-history.md](./17-search-session-history.md) | `search_session_history` | `sessions` via FTS5 | Search past sessions by keyword or meaning |

## Status

| Tool | Status |
|---|---|
| `log_memory_event` | ✓ DONE |
| `write_user_memory` | ✓ DONE |
| `read_user_memory` | ✓ DONE |
| `create_user_skill` | ✓ DONE |
| `update_user_skill` | ✓ DONE |
| `view_user_skill` | ✓ DONE |
| `archive_user_skill` | ✓ DONE |
| `delete_user_skill` | ✓ DONE |
| `propose_user_constraint` | ✓ DONE |
| `confirm_user_constraint` | ✓ DONE |
| `schedule_user_alarm` | ✓ DONE |
| `cancel_user_alarm` | ✓ DONE |
| `view_user_recipe` | ✓ DONE |
| `update_user_recipe` | ✓ DONE |
| `archive_user_recipe` | ✓ DONE |
| `load_session_context` | ✓ DONE |
| `search_session_history` | ✓ DONE |
