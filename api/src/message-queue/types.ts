export interface EmailJobPayload {
	type: 'email';
	emailType:
		| 'subscription_created'
		| 'subscription_renewed'
		| 'subscription_cancelled'
		| 'payment_failed'
		| 'subscription_expired'
		| 'product_changed';
	userId: string;
	data: Record<string, unknown>;
}

export interface WebhookJobPayload {
	type: 'webhook';
	webhookUrl: string;
	payload: Record<string, unknown>;
	retries?: number;
}

export interface PollingJobPayload {
	type: 'polling';
	jobId: string;
}

export interface ExpirePayRequestJobPayload {
	type: 'banking.pay_request_expire';
	payRequestId: string;
}

export interface ExecutePayRequestPayoutJobPayload {
	type: 'banking.pay_request_execute_payout';
	payRequestId: string;
}

export interface ExecuteOutgoingPayoutJobPayload {
	type: 'banking.outgoing_payout_execute';
	payoutId: string;
	transferPurpose: string;
}

export interface ExecutePeerToPeerTransferJobPayload {
	type: 'banking.peer_to_peer_execute';
	transferId: string;
}

export interface RunOfframpOutboxQueueJobPayload {
	type: 'banking.offramp_outbox_process';
	outboxId: string;
}

export type JobPayload =
	| EmailJobPayload
	| WebhookJobPayload
	| PollingJobPayload
	| ExpirePayRequestJobPayload
	| ExecutePayRequestPayoutJobPayload
	| ExecuteOutgoingPayoutJobPayload
	| ExecutePeerToPeerTransferJobPayload
	| RunOfframpOutboxQueueJobPayload;

export interface QueueJobOptions {
	delay?: number; // seconds
	retries?: number;
	headers?: Record<string, string>;
}

export interface QueueJobResult {
	success: boolean;
	messageId?: string;
	error?: string;
}
