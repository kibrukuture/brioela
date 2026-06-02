import { SUPPORTED_BANKING_CURRENCY_CODES, type SupportedBankingCurrencyCode } from '@schnl/shared/constants';

export function isSupportedBankingCurrencyCode(value: string): value is SupportedBankingCurrencyCode {
	return (SUPPORTED_BANKING_CURRENCY_CODES as readonly string[]).includes(value);
}
