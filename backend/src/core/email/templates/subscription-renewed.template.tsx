import WrapperEmailTemplate from '@/core/email/templates/wrapper.template';
import { OUR_COMPANY_EMAIL } from '@schnl/shared/constants';

export default function SubscriptionRenewedTemplate() {
	const mailTo = `mailto:${OUR_COMPANY_EMAIL}`;
	return (
		<WrapperEmailTemplate
			title="Your Schnl subscription has been renewed ✓"
			WrappableContent={() => (
				<div>
					<p style={{ margin: '8px 0' }}>Your Schnl subscription has been renewed.</p>
					<p style={{ margin: '8px 0' }}>
						If you have any questions, please contact us at <a href={mailTo}>Schnl Support</a>.
					</p>
				</div>
			)}
		/>
	);
}
