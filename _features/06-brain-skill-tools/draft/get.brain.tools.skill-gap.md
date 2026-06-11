# Draft: get.brain.tools.ts (skill tools gap)

Target: `backend/src/agents/brain/_tools/get.brain.tools.ts` — skill tools are **not registered**. Full file registers memory, recipe, and alarm tools only.

```typescript
// Expected per build-guide/05-brain/02-tool-protocol.md — NOT PRESENT TODAY:

// chat + cooking should include:
//   create_user_skill, update_user_skill, view_user_skill,
//   archive_user_skill, delete_user_skill

// brain_maintenance should include:
//   update_user_skill, archive_user_skill

// Current TOOL_PERMISSIONS (excerpt) — no skill entries:
const TOOL_PERMISSIONS = {
  chat: [
    "log_memory_event",
    "write_user_memory",
    "read_user_memory",
    "view_user_recipe",
    "schedule_user_alarm",
    "cancel_user_alarm",
  ],
  brain_maintenance: [
    "write_user_memory",
    "update_user_recipe",
    "archive_user_recipe",
    "schedule_user_alarm",
  ],
};
```
