import type { FC } from 'hono/jsx';

interface WrapperEmailTemplateProps {
	title: string;
	WrappableContent: FC;
	communicationCode?: string;
}
export default function WrapperEmailTemplate({ title, WrappableContent, communicationCode }: WrapperEmailTemplateProps) {
	return (
		<html dir="ltr" lang="en">
			<head>
				<meta content="text/html; charset=UTF-8" httpEquiv="Content-Type" />
				<meta name="x-apple-disable-message-reformatting" />
			</head>
			<body
				style={{
					backgroundColor: '#ffffff',
					fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
				}}
			>
				<table
					align="center"
					width="100%"
					border={0}
					cellPadding={0}
					cellSpacing={0}
					role="presentation"
					style={{ maxWidth: '37.5em', margin: '0 auto', padding: '20px 25px 48px' }}
				>
					<tbody>
						<tr style={{ width: '100%' }}>
							<td>
								<p
									style={{
										fontSize: '14px',
										color: '#999999',
										fontWeight: 400,
										letterSpacing: '0.5px',
										padding: '0 0 8px 0',
										margin: 0,
									}}
								>
									Schnl
								</p>

								{communicationCode ? (
									<p
										style={{
											fontSize: '16px',
											margin: '12px 0 0 0',
											fontStyle: 'italic',
											fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
										}}
									>
										Communication code: {communicationCode}
									</p>
								) : null}

								{title ? (
									<h1 style="font-size:28px;font-weight:500;margin-top:32px;margin-bottom:0;color:#666666;letter-spacing:-0.5px;">
										{title}
									</h1>
								) : null}

								<table
									align="center"
									width="100%"
									border={0}
									cellPadding={0}
									cellSpacing={0}
									role="presentation"
									style={{ margin: '24px 0' }}
								>
									<tbody>
										<tr>
											<td>
												<WrappableContent />
											</td>
										</tr>
									</tbody>
								</table>

								<p
									style={{
										fontSize: '13px',
										color: '#999999',
										padding: '0 0 4px 0',
										margin: '40px 0 0 0',
										lineHeight: 1.5,
									}}
								>
									Schnl Team
								</p>

								<table width="100%" role="presentation" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
									<tr>
										<td style={{ fontSize: '12px', color: '#999999', padding: 0 }}>
											<a href="https://schnl.com" target="_blank" style="color:#999999;text-decoration:none;margin-right:16px;">
												Website
											</a>
											<a href="https://schnl.com/terms" target="_blank" style="color:#999999;text-decoration:none;margin-right:16px;">
												Terms
											</a>
											<a href="https://schnl.com/privacy" target="_blank" style="color:#999999;text-decoration:none;">
												Privacy
											</a>
										</td>
									</tr>
								</table>
							</td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>
	);
}
