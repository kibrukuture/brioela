import { Agent, callable } from 'agents'
import { createDatabase, type BrainDatabase } from '@/agents/brain/_database'
import { createMemoryEventWrite } from '@/agents/brain/_mappers'
import { runMigrations, type BrainMigrationReadiness } from '@/agents/brain/_migrations'
import { listMemoryEvents, writeMemoryEvent } from '@/agents/brain/_repositories'
import {
	appendMemoryEventSchema,
	type AppendBrainMemoryEvent,
	type BrainMemoryEventAppend,
	type BrainMemoryEvents,
	type CheckedBrainReadiness,
	listMemoryEventsSchema,
	type ListBrainMemoryEvents,
} from '@/agents/brain/_rpc'
import { BrainReadinessUnavailableError } from '@/agents/brain/_types'
import { readCurrentEpochMs } from '@/time/_helpers'
import type { AlarmRegistry } from '@/agents/brain/_dispatch'
import { createBrainAlarmRegistry, settleDueAlarms } from '@/agents/brain/_handlers'

export interface BrioelaBrainState {
	ready: boolean
}

export type BrioelaBrainEnv = Cloudflare.Env

export class BrioelaBrain extends Agent<BrioelaBrainEnv, BrioelaBrainState> {
	initialState: BrioelaBrainState = { ready: false }

	private readonly database: BrainDatabase
	private readiness: BrainMigrationReadiness | null = null
	private readonly alarmRegistry: AlarmRegistry = createBrainAlarmRegistry()

	constructor(ctx: DurableObjectState, env: BrioelaBrainEnv) {
		super(ctx, env)
		this.database = createDatabase(ctx.storage)

		ctx.blockConcurrencyWhile(async () => {
			const readiness = await runMigrations(this.database, readCurrentEpochMs())
			this.readiness = readiness
			this.setState({ ready: readiness.status === 'ready' })
		})
	}

	@callable()
	appendMemoryEvent(memoryEventAppend: AppendBrainMemoryEvent): BrainMemoryEventAppend {
		// Callable input is runtime data; parse the command before Brain maps it to storage.
		const memoryEvent = appendMemoryEventSchema.parse(memoryEventAppend)
		const event = writeMemoryEvent(this.database, createMemoryEventWrite(memoryEvent, readCurrentEpochMs()))

		return { event }
	}

	@callable()
	listMemoryEvents(memoryEventFilter: ListBrainMemoryEvents): BrainMemoryEvents {
		const filter = listMemoryEventsSchema.parse(memoryEventFilter)

		return listMemoryEvents(this.database, filter)
	}

	@callable()
	checkReadiness(): CheckedBrainReadiness {
		if (this.readiness === null) {
			throw new BrainReadinessUnavailableError()
		}

		return { readiness: this.readiness }
	}

	// CF Durable Object lifecycle — name `alarm` is fixed by the runtime and cannot be changed.
	// https://developers.cloudflare.com/durable-objects/api/alarms/
	// `super.alarm()` must run first: Agents SDK uses it to run `#ensureInitialized()` before any user logic.
	// https://github.com/cloudflare/agents/blob/main/packages/agents/src/index.ts
	override async alarm(): Promise<void> {
		await super.alarm()
		await settleDueAlarms(this.database, this.name, this.alarmRegistry, {
			scheduleAlarm: (ms) => this.ctx.storage.setAlarm(ms),
			cancelAlarm: () => this.ctx.storage.deleteAlarm(),
		})
	}
}
