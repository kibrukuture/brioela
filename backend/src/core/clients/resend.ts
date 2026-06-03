import { Resend } from 'resend';

function createResendClient() {
	return new Resend(process.env.RESEND_API_KEY);
}

let resendClient: ReturnType<typeof createResendClient> | null = null;

export default function getResendClient() {
	if (!resendClient) {
		resendClient = createResendClient();
	}
	return resendClient;
}
