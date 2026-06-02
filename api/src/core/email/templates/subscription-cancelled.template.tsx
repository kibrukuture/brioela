import WrapperEmailTemplate from '@/core/email/templates/wrapper.template';
import { OUR_COMPANY_EMAIL } from '@schnl/shared/constants';

export default function SubscriptionCancelledTemplate() {
	const mailTo = `mailto:${OUR_COMPANY_EMAIL}`;
	return (
		<WrapperEmailTemplate
			title="Subscription Cancelled"
			WrappableContent={() => (
				<div>
					<p style={{ margin: '8px 0' }}>
						Your subscription has been cancelled. You will have access until your current billing cycle ends.
					</p>
					<p style={{ margin: '8px 0' }}>
						If you have any questions, please contact us at <a href={mailTo}>Schnl Support</a>.
					</p>
				</div>
			)}
		/>
	);
}
