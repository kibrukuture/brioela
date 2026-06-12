import type { AlarmAction } from '@/agents/brain/_types'
import type { BrainAlarmType } from '@/agents/brain/_dispatch/alarm.type.schema'

export interface AlarmRegistry {
	register(pattern: BrainAlarmType, handler: AlarmAction): void
	resolve(alarmType: string): AlarmAction | null
}

export function createAlarmRegistry(): AlarmRegistry {
	const handlers = new Map<BrainAlarmType, AlarmAction>()

	return {
		register(pattern, handler) {
			handlers.set(pattern, handler)
		},
		resolve(alarmType) {
			for (const [pattern, handler] of handlers) {
				if (alarmType.startsWith(pattern)) return handler
			}
			return null
		},
	}
}
