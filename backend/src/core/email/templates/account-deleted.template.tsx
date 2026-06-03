import WrapperEmailTemplate from '@/core/email/templates/wrapper.template';
import { OUR_COMPANY_EMAIL } from '@schnl/shared/constants';

export default function AccountDeletedTemplate({ name }: { name: string }) {
	const mailTo = `mailto:${OUR_COMPANY_EMAIL}`;
	return (
		<WrapperEmailTemplate
			title=""
			WrappableContent={() => (
				<div>
					<p style={{ fontSize: '16px', lineHeight: '26px', margin: '16px 0', color: '#666666' }}>Your account has been deleted.</p>
					<p style={{ fontSize: '16px', lineHeight: '26px', margin: '16px 0', color: '#666666' }}>We're sorry to see you go.</p>
					<p style={{ fontSize: '16px', lineHeight: '26px', margin: '16px 0', marginTop: '32px', color: '#1a1a1a' }}>
						If you have any questions, please contact us at <a href={mailTo}>Schnl Support</a>.
					</p>
				</div>
			)}
		/>
	);
}
