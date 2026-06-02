import type { FC } from 'hono/jsx';
import WrapperEmailTemplate from '@/core/email/templates/wrapper.template';

interface StressTestEmailTemplateProps {
	message: string;
	communicationCode?: string | null;
}

export default function StressTestEmailTemplate({ message, communicationCode }: StressTestEmailTemplateProps) {
	const Content: FC = () => (
		<div style={{ fontSize: '16px', color: '#111827', lineHeight: 1.5 }}>
			<p style={{ margin: '0 0 12px 0' }}>This is a stress-test email to verify sending from api.schnl.com.</p>
			<p style={{ margin: 0 }}>{message}</p>
		</div>
	);

	return <WrapperEmailTemplate title="Stress test email" WrappableContent={Content} communicationCode={communicationCode ?? undefined} />;
}
