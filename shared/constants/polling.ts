export const DEFAULT_POLLING_BACKOFF_MS = [
  60_000, // 1m
  300_000, // 5m
  900_000, // 15m
  3_600_000, // 1h
  14_400_000, // 4h
  43_200_000, // 12h
  86_400_000, // 24h
  172_800_000, // 48h
];

export const DEFAULT_POLLING_MAX_ATTEMPTS = 8;
export const DEFAULT_POLLING_TTL_MS = 259_200_000; // 3 days
