import type { CreateCardOrderRequest } from '@brioela/shared/validators/card-order.validator';

export function getCardOrderFeeAmountAtomic(input: { type: CreateCardOrderRequest['type'] }): string {
	if (input.type === 'virtual') return '0';
	return '1500';
}
