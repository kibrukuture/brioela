import { Agent, callable } from 'agents'
import { createBrainDatabase, type BrainDatabase } from '@/agents/brain/_database'
import { createBrainMemoryEventWrite } from '@/agents/brain/_mappers'
import { runBrainMigrations, type BrainMigrationReadiness } from '@/agents/brain/_migrations'
import { listBrainMemoryEvents, writeBrainMemoryEvent } from '@/agents/brain/_repositories'
import {
	appendBrainMemoryEventSchema,
	type AppendBrainMemoryEvent,
	type BrainMemoryEventAppend,
	type BrainMemoryEvents,
	type CheckedBrainReadiness,
	listBrainMemoryEventsSchema,
	type ListBrainMemoryEvents,
} from '@/agents/brain/_rpc'
import { BrainReadinessUnavailableError } from '@/agents/brain/_types'
import { readCurrentEpochMs } from '@/time/_helpers'

export interface BrioelaBrainState {
	ready: boolean
}

export type BrioelaBrainEnv = Cloudflare.Env

export class BrioelaBrain extends Agent<BrioelaBrainEnv, BrioelaBrainState> {
	initialState: BrioelaBrainState = { ready: false }

	private readonly database: BrainDatabase
	private readiness: BrainMigrationReadiness | null = null

	constructor(ctx: DurableObjectState, env: BrioelaBrainEnv) {
		super(ctx, env)
		this.database = createBrainDatabase(ctx.storage)

		ctx.blockConcurrencyWhile(async () => {
			const readiness = await runBrainMigrations(this.database, readCurrentEpochMs())
			this.readiness = readiness
			this.setState({ ready: readiness.status === 'ready' })
		})
	}

	@callable()
	appendMemoryEvent(memoryEventAppend: AppendBrainMemoryEvent): BrainMemoryEventAppend {
		// Callable input is runtime data; parse the command before Brain maps it to storage.
		const memoryEvent = appendBrainMemoryEventSchema.parse(memoryEventAppend)
		const event = writeBrainMemoryEvent(this.database, createBrainMemoryEventWrite(memoryEvent, readCurrentEpochMs()))

		return { event }
	}

	@callable()
	listMemoryEvents(memoryEventFilter: ListBrainMemoryEvents): BrainMemoryEvents {
		const filter = listBrainMemoryEventsSchema.parse(memoryEventFilter)

		return listBrainMemoryEvents(this.database, filter)
	}

	@callable()
	checkBrainReadiness(): CheckedBrainReadiness {
		if (this.readiness === null) {
			throw new BrainReadinessUnavailableError()
		}

		return { readiness: this.readiness }
	}
}
