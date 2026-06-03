export type EmailOptions = {
	to: string | string[] | { name: string; address: string } | Array<{ name: string; address: string }>;
	from?: string | { name: string; address: string };
	subject: string;
	html?: string;
	text?: string;
	replyTo?: string | { name: string; address: string };
	cc?: string | string[] | { name: string; address: string } | Array<{ name: string; address: string }>;
	bcc?: string | string[] | { name: string; address: string } | Array<{ name: string; address: string }>;
};

export type EmailResult = {
	success: boolean;
	messageId?: string;
	error?: string;
};

export type EmailTemplate = {
	subject: string;
	html: string;
	text?: string;
};

export type EmailTemplateData = Record<string, string | number | boolean>;

export type ZeptoEmailAddress = {
	address: string;
	name?: string;
};

export type ZeptoCcBccItem = {
	email_address: ZeptoEmailAddress;
};

export type ZeptoAttachment = {
	name: string;
	mime_type?: string;
	file_cache_key?: string;
	content?: string; // base64
};

export type ZeptoInlineImage = {
	cid: string;
	mime_type?: string;
	file_cache_key?: string;
	content?: string; // base64
};

export type ZeptoSendMail = {
	from: ZeptoEmailAddress;
	to: ZeptoCcBccItem[];
	subject: string;
	textbody?: string;
	htmlbody?: string;
	reply_to?: ZeptoEmailAddress[];
	cc?: ZeptoCcBccItem[];
	bcc?: ZeptoCcBccItem[];
	track_clicks?: boolean;
	track_opens?: boolean;
	client_reference?: string;
	mime_headers?: Record<string, string>;
	attachments?: ZeptoAttachment[];
	inline_images?: ZeptoInlineImage[];
};

export type ZeptoSuccessResponse = {
	data: Array<{
		code: string;
		additional_info?: unknown;
		message: string;
	}>;
	message: string;
	request_id: string;
	object: 'email';
};

export type ZeptoErrorResponse = {
	error: {
		code: string;
		details: Array<{ code: string; message: string; target?: string }>;
		message: string;
		request_id: string;
	};
};

export type ZeptoClientConfig = {
	url: string;
	token: string;
};
