import { getDb } from '@/core/database/client';
import { BankingCurrency } from '@brioela/shared/drizzle/schema/banking-enums.schema';

export type Db = ReturnType<typeof getDb>;

export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export type BankingCurrencyCode = (typeof BankingCurrency.enumValues)[number];
