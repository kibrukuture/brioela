/**
 * Supported blockchain networks for wallet operations
 */
export const SUPPORTED_CRYPTO_NETWORKS = [
  "ethereum",
  "polygon",
  "base",
  "arbitrum",
  "solana",
  "tron",
] as const;

export type CryptoNetwork = (typeof SUPPORTED_CRYPTO_NETWORKS)[number];

/**
 * EVM-compatible networks (use 0x... addresses)
 */
export const EVM_NETWORKS = [
  "ethereum",
  "polygon",
  "base",
  "arbitrum",
] as const;

/**
 * Non-EVM networks (use different address formats)
 */
export const NON_EVM_NETWORKS = ["solana", "tron"] as const;

/**
 * Default network for wallet operations.
 *
 * Polygon chosen for:
 * - Ultra-low fees ($0.0005 - $0.01 per transaction, 83% of txns < $0.01)
 * - Fast finality (1-5 seconds, perfect for Mastercard integration)
 * - EVM-compatible (required for ERC20 direct approval contracts)
 * - Proven reliability and scale (used by Reddit, Starbucks, Disney)
 * - Official Align support
 *
 * @see network_selection_analysis.md for detailed comparison
 */
export const DEFAULT_WALLET_NETWORK = "polygon" as const;

/**
 * Check if a network is EVM-compatible
 */
export function isEvmNetwork(network: string): boolean {
  return EVM_NETWORKS.includes(network as (typeof EVM_NETWORKS)[number]);
}
