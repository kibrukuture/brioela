# Draft: brioela.brain.agent.ts (memory RPC methods only)

Target: `backend/src/agents/brain/brioela.brain.agent.ts` — excerpt

```typescript
@callable()
appendMemoryEvent(memoryEventAppend: AppendBrainMemoryEvent): BrainMemoryEventAppend {
	const memoryEvent = appendMemoryEventSchema.parse(memoryEventAppend)
	const event = writeMemoryEvent(this.database, createMemoryEventWrite(memoryEvent, readCurrentEpochMs()))

	return { event }
}

@callable()
listMemoryEvents(memoryEventFilter: ListBrainMemoryEvents): BrainMemoryEvents {
	const filter = listMemoryEventsSchema.parse(memoryEventFilter)

	return listMemoryEvents(this.database, filter)
}
```

Full file also contains migration readiness bootstrap — see feature **04-brain-foundation**.
