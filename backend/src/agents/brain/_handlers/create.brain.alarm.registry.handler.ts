import { createAlarmRegistry, type AlarmRegistry, BRAIN_ALARM_TYPE_VALUES } from '@/agents/brain/_dispatch'
import { runSessionWatchdog } from '@/agents/brain/_handlers/run.session.watchdog.handler'
import { runBrainMaintenance } from '@/agents/brain/_handlers/run.brain.maintenance.handler'
import { runBehaviorPattern } from '@/agents/brain/_handlers/run.behavior.pattern.handler'

export function createBrainAlarmRegistry(): AlarmRegistry {
	const registry = createAlarmRegistry()

	registry.register(BRAIN_ALARM_TYPE_VALUES[0], runSessionWatchdog)
	registry.register(BRAIN_ALARM_TYPE_VALUES[1], runBrainMaintenance)
	registry.register(BRAIN_ALARM_TYPE_VALUES[2], runBehaviorPattern)

	return registry
}
