import WrapperEmailTemplate from '@/core/email/templates/wrapper.template';
import { OUR_COMPANY_EMAIL } from '@brioela/shared/constants';

export default function ProductChangedTemplate() {
	const mailTo = `mailto:${OUR_COMPANY_EMAIL}`;
	return (
		<WrapperEmailTemplate
			title="Plan Updated"
			WrappableContent={() => (
				<div>
					<p style={{ margin: '8px 0' }}>Your Schnl subscription plan has been updated.</p>
					<p style={{ margin: '8px 0' }}>Enjoy your new features!</p>
					<p style={{ margin: '8px 0' }}>
						If you have any questions, please contact us at <a href={mailTo}>Schnl Support</a>.
					</p>
				</div>
			)}
		/>
	);
}
