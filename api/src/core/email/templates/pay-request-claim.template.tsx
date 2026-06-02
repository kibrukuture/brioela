import type { FC } from 'hono/jsx';

import EmailWrapper from '@/core/email/templates/wrapper.template';

export default function PayRequestClaimTemplate(props: {
	senderName: string;
	amountText: string;
	deepLink: string;
	expiresInDays: number;
}) {
	const WrappableContent: FC = () => (
		<>
			<p style={{ marginTop: 0, marginBottom: 12 }}>
				{props.senderName} sent you {props.amountText}
			</p>
			<p style={{ marginTop: 0, marginBottom: 12 }}>Add your bank details to receive it</p>
			<p style={{ marginTop: 0, marginBottom: 12 }}>
				<a
					href={props.deepLink}
					style={{
						display: 'inline-block',
						padding: '12px 18px',
						borderRadius: 8,
						background: '#000000',
						color: '#ffffff',
						textDecoration: 'none',
						fontWeight: 600,
					}}
				>
					Claim payment
				</a>
			</p>
			<p style={{ marginTop: 0, marginBottom: 0, color: '#888888', fontSize: 14 }}>Link expires in {props.expiresInDays} days</p>
		</>
	);

	return <EmailWrapper title="You have a payment waiting" WrappableContent={WrappableContent} />;
}
