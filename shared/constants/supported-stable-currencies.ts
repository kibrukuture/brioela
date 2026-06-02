export const SUPPORTED_STABLE_CURRENCIES = {
  usdc: "usdc",
  usdt: "usdt",
  eurc: "eurc",
} as const;

export type SupportedStableCurrency =
  (typeof SUPPORTED_STABLE_CURRENCIES)[keyof typeof SUPPORTED_STABLE_CURRENCIES];
