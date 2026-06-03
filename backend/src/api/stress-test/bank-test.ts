import getAlignClient from '@/core/clients/align';
import type { AppContext } from '@/index';
import { createMailer } from '@tolbel/cf-mailer';

import { apiErrorResponse, apiSuccessResponse } from '@/lib/response';
import { ErrorCode } from '@schnl/shared/types/api';

export async function createCustomerHandler(c: AppContext) {
	try {
		const body = await c.req.json();
		const { email, type, first_name, last_name } = body ?? {};

		if (!email || !type || !first_name || !last_name) {
			return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Missing required fields: email, type, first_name, last_name'), 400);
		}

		const client = getAlignClient('sandbox');
		const customer = await client.customers.create({ email, type, first_name, last_name });
		client.webhooks.create({
			url: 'https://schnl.com/align-webhook',
		});
		return c.json(apiSuccessResponse({ customer }));
	} catch (error) {
		return c.json(
			apiErrorResponse(
				ErrorCode.PROCESSING_FAILED,
				'Failed to create Align customer (stress-test)',
				error instanceof Error ? error.message : 'Unknown error'
			),
			500
		);
	}
}

export async function getKycLinkHandler(c: AppContext) {
	try {
		const customerId = c.req.query('userId');
		if (!customerId) {
			return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Missing query param: userId'), 400);
		}

		const client = getAlignClient();
		const customer = await client.customers.get(customerId);

		const existing = customer?.kycs?.kyc_flow_link;
		if (existing) {
			return c.json(apiSuccessResponse({ kyc_flow_link: existing }));
		}

		const kycSession = await client.customers.createKycSession(customerId);
		const link = kycSession.kycs.kyc_flow_link;
		if (!link) {
			return c.json(apiErrorResponse(ErrorCode.PROCESSING_FAILED, 'Failed to create KYC link'), 500);
		}

		return c.json(apiSuccessResponse({ kyc_flow_link: link }));
	} catch (error) {
		return c.json(
			apiErrorResponse(
				ErrorCode.PROCESSING_FAILED,
				'Failed to retrieve KYC link (stress-test)',
				error instanceof Error ? error.message : 'Unknown error'
			),
			500
		);
	}
}

export async function getCustomerHandler(c: AppContext) {
	try {
		const customerId = c.req.query('userId');
		if (!customerId) {
			return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Missing query param: userId'), 400);
		}

		const client = getAlignClient();
		const customer = await client.customers.get(customerId);

		return c.json(apiSuccessResponse({ customer }));
	} catch (error) {
		return c.json(
			apiErrorResponse(
				ErrorCode.PROCESSING_FAILED,
				'Failed to retrieve Align customer (stress-test)',
				error instanceof Error ? error.message : 'Unknown error'
			),
			500
		);
	}
}
