import {
  electronicFormatIBAN,
  friendlyFormatIBAN,
  isValidIBAN,
} from "ibantools";
import { UiError } from "@brioela/shared/lib/ui/errors";

export function formatIbanForDisplay(input: string): string {
  const electronic = electronicFormatIBAN(input) ?? "";
  return friendlyFormatIBAN(electronic) ?? "";
}

export function formatIbanForStorage(input: string): string {
  return electronicFormatIBAN(input) ?? "";
}

export function isValidIban(input: string): boolean {
  const electronic = electronicFormatIBAN(input) ?? "";
  return isValidIBAN(electronic);
}

export type IbanValidationResult =
  | { ok: true; electronic: string; display: string }
  | { ok: false; reason: "empty" | "invalid_format" };

export function validateIban(input: string): IbanValidationResult {
  const electronic = (electronicFormatIBAN(input) ?? "").trim();
  if (!electronic) return { ok: false, reason: "empty" };
  if (!isValidIBAN(electronic)) return { ok: false, reason: "invalid_format" };
  return {
    ok: true,
    electronic,
    display: friendlyFormatIBAN(electronic) ?? electronic,
  };
}

export function requireValidIban(input: string): string {
  const result = validateIban(input);
  if (!result.ok) {
    throw new UiError(
      result.reason === "empty" ? "iban_required" : "iban_invalid",
      {
        message:
          result.reason === "empty" ? "IBAN is required" : "Invalid IBAN",
        field: "iban",
        debug: `reason=${result.reason}`,
      }
    );
  }
  return result.electronic;
}
