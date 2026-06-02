export const CRON_TIMES = {
  every_1_minute: "*/1 * * * *",
  every_5_minutes: "*/5 * * * *",
  every_10_minutes: "*/10 * * * *",
  every_15_minutes: "*/15 * * * *",
  every_30_minutes: "*/30 * * * *",
  every_1_hour: "0 * * * *",
  every_12_hours: "0 */12 * * *",
  every_day_at_2_am: "0 2 * * *",
  every_day_at_2_pm: "0 14 * * *",
} as const;
