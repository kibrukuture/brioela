import { getDb } from '@/core/database/client';
import type { WebhookEvent } from '@tolbel/align';
import { and, eq } from '@brioela/shared/drizzle';
import { bankingProviderTransferMappings } from '@brioela/shared/drizzle/schema';
import { BANKING_PROVIDERS } from '@brioela/shared/constants/banking-providers';
import { finalizePayRequestOfframpTransfer } from '@/core/webhooks/align/helpers/finalize-pay-request-offramp-transfer';
import { finalizeOutgoingPayoutOfframpTransfer } from '@/core/webhooks/align/helpers/finalize-outgoing-payout-offramp-transfer';
import { finalizePeerToPeerOfframpTransfer } from '@/core/webhooks/align/helpers/finalize-peer-to-peer-offramp-transfer';
import { finalizeCardOrderOfframpTransfer } from '@/core/webhooks/align/helpers/finalize-card-order-offramp-transfer';

export async function onOfframpTransferStatusUpdated(event: WebhookEvent) {
	const transferId = event.entity_id;
	const db = getDb();
	await db.transaction(async (tx) => {
		const [mapping] = await tx
			.select({ referenceType: bankingProviderTransferMappings.referenceType, referenceId: bankingProviderTransferMappings.referenceId })
			.from(bankingProviderTransferMappings)
			.where(
				and(
					eq(bankingProviderTransferMappings.provider, BANKING_PROVIDERS.ALIGN),
					eq(bankingProviderTransferMappings.providerTransferId, transferId)
				)
			)
			.limit(1);

		if (!mapping?.referenceType || !mapping.referenceId) return;

		switch (mapping.referenceType) {
			case 'pay_request': {
				await finalizePayRequestOfframpTransfer({ tx, payRequestId: mapping.referenceId, transferId });
				return;
			}
			case 'outgoing_payout': {
				await finalizeOutgoingPayoutOfframpTransfer({ tx, payoutId: mapping.referenceId, transferId });
				return;
			}
			case 'peer_to_peer': {
				await finalizePeerToPeerOfframpTransfer({ tx, peerToPeerTransferId: mapping.referenceId, transferId });
				return;
			}
			case 'card_order': {
				await finalizeCardOrderOfframpTransfer({ tx, orderId: mapping.referenceId, transferId });
				return;
			}
			default: {
				return;
			}
		}
	});

	return { received: true, transferId, status: 'processed' };
}
