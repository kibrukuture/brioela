import WrapperEmailTemplate from '@/core/email/templates/wrapper.template';
export default function PaymentFailedTemplate() {
	return (
		<WrapperEmailTemplate
			title="⚠️ Payment Failed - Action Required"
			WrappableContent={() => (
				<div>
					<p style={{ margin: '8px 0' }}>Please update your payment method:</p>
					<a
						href={'{{updatePaymentUrl}}'}
						style={{
							display: 'inline-block',
							background: '#2563eb',
							color: '#fff',
							padding: '12px 24px',
							borderRadius: '6px',
							textDecoration: 'none',
						}}
					>
						Update Payment Method
					</a>
				</div>
			)}
		/>
	);
}
