import WrapperEmailTemplate from '@/core/email/templates/wrapper.template';

export default function SubscriptionExpiredTemplate() {
	return (
		<WrapperEmailTemplate
			title="Subscription Expired"
			WrappableContent={() => (
				<div>
					<p style={{ margin: '8px 0' }}>Your Schnl subscription has expired.</p>
					<p style={{ margin: '8px 0' }}>
						We hope you enjoyed using Schnl. If you'd like to continue, you can reactivate your subscription anytime.
					</p>
				</div>
			)}
		/>
	);
}
