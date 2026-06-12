// `alarm_type` on scheduled_alarms rows is intentionally free text (z.string().min(1)) —
// the AI writes any value it judges correct. Only dedup-relevant types are enumerated here.
export const DEDUP_ALARM_TYPE_VALUES = ['brain_maintenance_run', 'behavior_pattern_detection'] as const
export type DedupAlarmType = (typeof DEDUP_ALARM_TYPE_VALUES)[number]
