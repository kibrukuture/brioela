import WrapperEmailTemplate from '@/core/email/templates/wrapper.template';
import { OUR_COMPANY_EMAIL } from '@schnl/shared/constants';

export default function SubscriptionCreatedTemplate() {
	const mailTo = `mailto:${OUR_COMPANY_EMAIL}`;
	return (
		<WrapperEmailTemplate
			title="Welcome to Schnl! Your subscription is active 🎉"
			WrappableContent={() => (
				<div>
					{/* dont use any replaceable variables here */}
					<p style={{ margin: '8px 0' }}>Thank you for subscribing to Schnl! You can now start using your account.</p>
					<p style={{ margin: '8px 0' }}>
						If you have any questions, please contact us at <a href={mailTo}>Schnl Support</a>.
					</p>
				</div>
			)}
		/>
	);
}
