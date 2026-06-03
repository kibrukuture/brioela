import WrapperEmailTemplate from '@/core/email/templates/wrapper.template';
import { OUR_COMPANY_EMAIL } from '@schnl/shared/constants';

export default function VirtualAccountRemovedTemplate({ currency }: { currency: string }) {
	const mailTo = `mailto:${OUR_COMPANY_EMAIL}`;
	return (
		<WrapperEmailTemplate
			title=""
			WrappableContent={() => (
				<div>
					<p style={{ fontSize: '16px', lineHeight: '26px', margin: '16px 0', color: '#666666' }}>
						Your {currency} account details have been removed.
					</p>
					<p style={{ fontSize: '16px', lineHeight: '26px', margin: '16px 0', color: '#666666' }}>
						If this wasn’t you, please contact us at <a href={mailTo}>Schnl Support</a>.
					</p>
				</div>
			)}
		/>
	);
}
