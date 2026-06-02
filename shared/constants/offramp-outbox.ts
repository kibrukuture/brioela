export const DEFAULT_OFFRAMP_OUTBOX_BACKOFF_MS = [
  60_000, // 1m
  300_000, // 5m
  900_000, // 15m
  3_600_000, // 1h
  14_400_000, // 4h
  43_200_000, // 12h
  86_400_000, // 24h
  172_800_000, // 48h
] as const;

export const OFFRAMP_OUTBOX_LOCK_TTL_MINUTES = 15 as const;

export const RUN_OFFRAMP_OUTBOX_JOB_RESULT_STATUSES = [
  "done",
  "scheduled",
  "not_claimed",
  "failed",
] as const;

export type RunOfframpOutboxJobResultStatus =
  (typeof RUN_OFFRAMP_OUTBOX_JOB_RESULT_STATUSES)[number];
