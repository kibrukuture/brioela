import WrapperEmailTemplate from '@/core/email/templates/wrapper.template';

export default function PasswordResetTemplate({ userName, verificationCode }: { userName?: string; verificationCode: string }) {
	return (
		<WrapperEmailTemplate
			title="Reset Your Password"
			WrappableContent={() => (
				<div>
					<p style={{ margin: '8px 0' }}>Hi {userName || 'there'},</p>
					<p style={{ margin: '8px 0' }}>
						We received a request to reset your password. Use the verification code below to reset your password in the app:
					</p>
					<div
						style={{
							margin: '24px 0',
							padding: '20px',
							backgroundColor: '#F3F4F6',
							borderRadius: '8px',
							textAlign: 'center',
						}}
					>
						<p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
							Verification Code
						</p>
						<p
							style={{
								margin: 0,
								fontSize: '32px',
								fontWeight: '700',
								letterSpacing: '8px',
								color: '#1F2937',
								fontFamily: 'monospace',
							}}
						>
							{verificationCode}
						</p>
					</div>
					<p style={{ margin: '8px 0', color: '#6B7280', fontSize: '14px' }}>
						If you didn't request this, you can safely ignore this email.
					</p>
					<p style={{ margin: '8px 0', color: '#6B7280', fontSize: '14px' }}>This code will expire in 1 hour.</p>
				</div>
			)}
		/>
	);
}
