export const CURRENCIES = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'United States dollar', symbol: '$' },
  { code: 'AED', name: 'United Arab Emirates dirham', symbol: 'د.إ' },
  { code: 'GBP', name: 'British pound', symbol: '£' },
];

export function getRecentCurrencies() {
  return CURRENCIES.slice(0, 3);
}

export function searchCurrencies(query: string) {
  const lowercaseQuery = query.toLowerCase();
  return CURRENCIES.filter(
    (currency) =>
      currency.code.toLowerCase().includes(lowercaseQuery) ||
      currency.name.toLowerCase().includes(lowercaseQuery)
  );
}
