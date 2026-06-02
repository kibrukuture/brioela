import {
  getBankingCurrencyDecimals,
  type BankingCurrencyCode,
} from "@schnl/shared/constants/banking-currency-decimals";

export function parseAmountAtomic(amountAtomic: string): bigint {
  if (!/^-?\d+$/.test(amountAtomic)) {
    throw new Error("Invalid amountAtomic");
  }
  return BigInt(amountAtomic);
}

export function decimalStringToAtomic(
  amountDecimal: string,
  currency: BankingCurrencyCode
): bigint {
  const trimmed = amountDecimal.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Invalid amountDecimal");
  }

  const decimals = getBankingCurrencyDecimals(currency);
  const negative = trimmed.startsWith("-");
  const abs = negative ? trimmed.slice(1) : trimmed;
  const [whole = "0", frac = ""] = abs.split(".");

  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const base = 10n ** BigInt(decimals);
  const atomic = BigInt(whole) * base + BigInt(fracPadded || "0");

  return negative ? -atomic : atomic;
}

export function atomicToDecimalString(
  amountAtomic: bigint,
  currency: BankingCurrencyCode
): string {
  const decimals = getBankingCurrencyDecimals(currency);
  const negative = amountAtomic < 0n;
  const abs = negative ? -amountAtomic : amountAtomic;
  const base = 10n ** BigInt(decimals);

  const whole = abs / base;
  const frac = abs % base;

  const fracStr =
    decimals === 0 ? "" : `.${frac.toString().padStart(decimals, "0")}`;
  return `${negative ? "-" : ""}${whole.toString()}${fracStr}`;
}

export function decimalStringToAtomicString(
  amountDecimal: string,
  currency: BankingCurrencyCode
): string {
  return decimalStringToAtomic(amountDecimal, currency).toString();
}

export function bigintToString(value: bigint): string {
  return value.toString();
}
