import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import dayjs from 'dayjs';
import { atomicToDecimalString } from '@schnl/shared/utils/money';
import type { BankingCurrencyCode } from '@schnl/shared/constants/banking-currency-decimals';

interface TransactionReceiptPDFProps {
	transaction: {
		id: string;
		displayTitle: string | null;
		description: string | null;
		createdAt: Date;
		amountAtomic: bigint;
		currency: BankingCurrencyCode;
		category: string | null;
		note: string | null;
	};
	user: { email: string | null };
}

export async function generateTransactionReceiptPDF({ transaction, user }: TransactionReceiptPDFProps): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([595, 842]);
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	const { width, height } = page.getSize();
	let yPos = height - 60;

	const black = rgb(0.067, 0.094, 0.153);
	const gray = rgb(0.42, 0.45, 0.5);
	const lightGray = rgb(0.898, 0.906, 0.922);

	page.drawText('Transaction Receipt', { x: 40, y: yPos, size: 24, font: fontBold, color: black });
	yPos -= 25;

	page.drawText(`Email: ${user.email || 'N/A'}`, { x: 40, y: yPos, size: 12, font: font, color: gray });
	yPos -= 18;

	page.drawText(`Date: ${dayjs(transaction.createdAt).format('MMM DD, YYYY HH:mm')}`, {
		x: 40,
		y: yPos,
		size: 12,
		font,
		color: gray,
	});
	yPos -= 18;

	page.drawText(`Transaction ID: ${transaction.id}`, { x: 40, y: yPos, size: 9, font: font, color: gray });
	yPos -= 20;

	page.drawLine({ start: { x: 40, y: yPos }, end: { x: width - 40, y: yPos }, thickness: 1, color: lightGray });
	yPos -= 30;

	const title = transaction.displayTitle || transaction.description || 'Transaction';
	page.drawText(title, { x: 40, y: yPos, size: 16, font: fontBold, color: black, maxWidth: 420 });
	yPos -= 25;

	const amountDecimal = atomicToDecimalString(transaction.amountAtomic, transaction.currency);
	const amountText = `${amountDecimal} ${transaction.currency.toUpperCase()}`;
	page.drawText(amountText, { x: 40, y: yPos, size: 14, font: fontBold, color: black });
	yPos -= 30;

	if (transaction.category) {
		page.drawText('Category', { x: 40, y: yPos, size: 12, font: fontBold, color: black });
		yPos -= 16;
		page.drawText(transaction.category, { x: 40, y: yPos, size: 12, font: font, color: gray });
		yPos -= 24;
	}

	if (transaction.note) {
		page.drawText('Note', { x: 40, y: yPos, size: 12, font: fontBold, color: black });
		yPos -= 16;
		page.drawText(transaction.note, { x: 40, y: yPos, size: 12, font: font, color: gray, maxWidth: width - 80 });
		yPos -= 24;
	}

	page.drawText(`Generated on ${dayjs().format('MMM DD, YYYY HH:mm')}`, {
		x: 40,
		y: 40,
		size: 9,
		font,
		color: rgb(0.612, 0.639, 0.686),
	});

	return await pdfDoc.save();
}
