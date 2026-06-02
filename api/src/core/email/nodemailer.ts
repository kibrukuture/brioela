import Nodemailer, { type Transporter } from 'nodemailer';

type NodemailerEmailOptions = {
	to: string | string[];
	from?: string;
	subject: string;
	html?: string;
	text?: string;
	cc?: string | string[];
	bcc?: string | string[];
	replyTo?: string;
};

type NodemailerResult = {
	success: boolean;
	messageId?: string;
	error?: string;
};

let transporter: Transporter | null = null;

function createNodemailerTransporter() {
	if (transporter) return transporter;

	transporter = Nodemailer.createTransport({
		host: process.env.ZEPTOMAIL_SERVER_NAME,
		port: 587, // Standard SMTP port for STARTTLS
		secure: false, // false for port 587, true for port 465
		auth: {
			user: process.env.ZEPTOMAIL_USER_NAME,
			pass: process.env.ZEPTOMAIL_PASSWORD,
		},
		// Performance optimizations
		pool: true, // Use connection pooling
		maxConnections: 5, // Send up to 5 emails concurrently
		maxMessages: 100, // Reuse connection for 100 emails before reconnecting
	});

	return transporter;
}

const DEFAULT_FROM = 'hello@schnl.com';

export default async function sendEmailViaNodemailer(options: NodemailerEmailOptions): Promise<NodemailerResult> {
	const client = createNodemailerTransporter();

	try {
		const res = await client.sendMail({
			from: { address: options.from ?? DEFAULT_FROM, name: 'Schnl' },
			to: options.to,
			cc: options.cc,
			bcc: options.bcc,
			replyTo: options.replyTo,
			subject: options.subject,
			text: options.text,
			html: options.html,
		});

		return {
			success: true,
			messageId: typeof res.messageId === 'string' ? res.messageId : String(res.messageId),
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
