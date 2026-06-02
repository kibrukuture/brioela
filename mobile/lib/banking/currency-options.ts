import { ImageSourcePropType } from 'react-native';
type CurrencyOption = {
  code: string;
  name: string;
  symbol: string;
  flag: ImageSourcePropType;
  details: string;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: require('@/assets/flags/usa.png'),
    details: 'Routing number, account number and Swift/BIC',
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: require('@/assets/flags/eu.png'),

    details: 'IBAN and Swift/BIC',
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: require('@/assets/flags/gb.png'),

    details: 'Sort code and account number',
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    flag: require('@/assets/flags/aed.png'),
    details: 'IBAN and Swift/BIC',
  },
] as const;
