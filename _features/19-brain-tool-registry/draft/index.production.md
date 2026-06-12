# Draft: _tools/index.ts — production snapshot

Target: `backend/src/agents/brain/_tools/index.ts`

**Gap (G10):** Alarm tool factories not re-exported from barrel.

```typescript
export * from '@/agents/brain/_tools/get.brain.tools'
export * from '@/agents/brain/_tools/write.user.memory.tool'
export * from '@/agents/brain/_tools/read.user.memory.tool'
export * from '@/agents/brain/_tools/log.memory.event.tool'
export * from '@/agents/brain/_tools/view.user.recipe.tool'
export * from '@/agents/brain/_tools/update.user.recipe.tool'
export * from '@/agents/brain/_tools/archive.user.recipe.tool'
```

**Target barrel (when complete):** add alarm, skill, constraint, session, web tool exports as each feature ships.
