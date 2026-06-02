import type {
	EmailOptions,
	EmailResult,
	ZeptoClientConfig,
	ZeptoSendMail,
	ZeptoSuccessResponse,
	ZeptoErrorResponse,
	ZeptoCcBccItem,
	ZeptoEmailAddress,
} from '@/core/email/types';

const DEFAULT_FROM = 'hello@schnl.com';

function toAddress(address: string | { name: string; address: string } | undefined): ZeptoEmailAddress {
	if (!address) return { address: DEFAULT_FROM, name: 'Schnl' };
	if (typeof address === 'string') return { address, name: 'Schnl' };
	return { address: address.address, name: address.name ?? 'Schnl' };
}

function toRecipientList(value: EmailOptions['to']): ZeptoCcBccItem[] {
	if (Array.isArray(value)) {
		return value.map((v) => {
			if (typeof v === 'string') return { email_address: { address: v, name: '' } };
			return { email_address: { address: v.address, name: v.name ?? '' } };
		});
	}
	if (typeof value === 'string') return [{ email_address: { address: value, name: '' } }];
	return [{ email_address: { address: value.address, name: value.name ?? '' } }];
}

function toCcBccList(value: EmailOptions['cc'] | EmailOptions['bcc']): ZeptoCcBccItem[] | undefined {
	if (!value) return undefined;
	if (Array.isArray(value)) {
		return value.map((v) => {
			if (typeof v === 'string') return { email_address: { address: v, name: '' } };
			return { email_address: { address: v.address, name: v.name ?? '' } };
		});
	}
	if (typeof value === 'string') return [{ email_address: { address: value, name: '' } }];
	return [{ email_address: { address: value.address, name: value.name ?? '' } }];
}

function toReplyToList(value: EmailOptions['replyTo']): ZeptoEmailAddress[] | undefined {
	if (!value) return undefined;
	if (Array.isArray(value))
		return value.map((v) => (typeof v === 'string' ? { address: v, name: '' } : { address: v.address, name: v.name ?? '' }));
	if (typeof value === 'string') return [{ address: value, name: '' }];
	return [{ address: value.address, name: value.name ?? '' }];
}

function toZeptoPayload(options: EmailOptions): ZeptoSendMail {
	return {
		from: toAddress(options.from),
		to: toRecipientList(options.to),
		subject: options.subject,
		htmlbody: options.html,
		textbody: options.text,
		reply_to: toReplyToList(options.replyTo),
		cc: toCcBccList(options.cc),
		bcc: toCcBccList(options.bcc),
	};
}

export async function sendEmail(options: EmailOptions, config?: ZeptoClientConfig): Promise<EmailResult> {
	const payload = toZeptoPayload(options);

	try {
		const reqBody = JSON.stringify(payload);

		const res = await fetch(config?.url ?? process.env.ZEPTOMAIL_URL, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: config?.token ?? process.env.ZEPTOMAIL_TOKEN,
			},
			body: reqBody,
		});

		console.log('[Email] response status', res.status, res.statusText);

		const raw = await res.text();

		let data: ZeptoSuccessResponse | ZeptoErrorResponse | null = null;
		try {
			data = JSON.parse(raw);
		} catch (e) {
			console.error('[Email] response parse error', e);
		}

		if (!res.ok || !data || 'error' in data) {
			const message = data && 'error' in data ? `${data.error.code}: ${data.error.message}` : `HTTP ${res.status}`;
			console.error('[Email] send failed', message);
			return { success: false, error: message };
		}

		return { success: true, messageId: data.request_id };
	} catch (error) {
		console.error('[Email] exception', error instanceof Error ? error.stack || error.message : String(error));
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}
