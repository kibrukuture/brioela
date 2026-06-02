import type { CreateVirtualAccountResponse } from '@schnl/shared/validators/banking.validator';
import { createVirtualAccountSchema } from '@schnl/shared/validators/banking.validator';
import { CURRENCY_OPTIONS } from '@/lib/banking/currency-options';

export function getVirtualAccountDetails(
  currency: string,
  accounts: readonly CreateVirtualAccountResponse[] | undefined
) {
  const validation = createVirtualAccountSchema.safeParse({ currency: currency.toLowerCase() });
  const normalized = validation.success ? validation.data.currency : null;
  const account = normalized ? accounts?.find((a) => a.currency === normalized) : undefined;
  const currencyMeta = CURRENCY_OPTIONS.find(
    (c) => c.code.toLowerCase() === currency.toLowerCase()
  );

  return {
    code: currency,
    name: currencyMeta?.name ?? currency,
    symbol: currencyMeta?.symbol,
    holderName: account?.accountBeneficiaryName ?? '—',
    iban: account?.iban ?? '',
    swiftBic: account?.bic ?? '',
    bankName: account?.bankName ?? '—',
    bankAddress: account?.bankAddress ?? '—',
    routingNumber: account?.routingNumber ?? '',
    accountNumber: account?.accountNumber ?? '',
  };
}

export function formatBankingAccountShareMessage(
  details: ReturnType<typeof getVirtualAccountDetails>
): string {
  let message = `My ${details.code} account details:\n\nName: ${details.holderName}\n`;
  if (details.iban) {
    message += `IBAN: ${details.iban}\n`;
  }
  if (details.routingNumber) {
    message += `Routing Number: ${details.routingNumber}\n`;
  }
  if (details.accountNumber) {
    message += `Account Number: ${details.accountNumber}\n`;
  }
  if (details.swiftBic) {
    message += `Swift/BIC: ${details.swiftBic}\n`;
  }
  message += `Bank: ${details.bankName}, ${details.bankAddress}`;
  return message;
}
