import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import dayjs from 'dayjs';

interface StatementPDFProps {
	transactions: any[];
	startDate: Date;
	endDate: Date;
	user: {
		email: string | null;
	};
}

export async function generateStatementPDF({ transactions, startDate, endDate, user }: StatementPDFProps): Promise<Uint8Array> {
	const totalInflow = transactions.filter((t) => t.direction === 'in').reduce((sum, t) => sum + Number(t.amountAtomic), 0);

	const totalOutflow = transactions.filter((t) => t.direction === 'out').reduce((sum, t) => sum + Number(t.amountAtomic), 0);

	const pdfDoc = await PDFDocument.create();
	let page = pdfDoc.addPage([595, 842]);
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	const { width, height } = page.getSize();
	let yPos = height - 60;

	const black = rgb(0.067, 0.094, 0.153);
	const gray = rgb(0.42, 0.45, 0.5);
	const green = rgb(0.02, 0.588, 0.412);
	const red = rgb(0.863, 0.149, 0.149);
	const lightGray = rgb(0.898, 0.906, 0.922);

	// Header
	page.drawText('Bank Statement', { x: 40, y: yPos, size: 24, font: fontBold, color: black });
	yPos -= 25;

	page.drawText(`Email: ${user.email || 'N/A'}`, { x: 40, y: yPos, size: 12, font: font, color: gray });
	yPos -= 18;

	page.drawText(`Period: ${dayjs(startDate).format('MMM DD, YYYY')} - ${dayjs(endDate).format('MMM DD, YYYY')}`, {
		x: 40,
		y: yPos,
		size: 12,
		font: font,
		color: gray,
	});
	yPos -= 30;

	page.drawLine({ start: { x: 40, y: yPos }, end: { x: width - 40, y: yPos }, thickness: 1, color: lightGray });
	yPos -= 30;

	// Summary
	page.drawText('Summary', { x: 40, y: yPos, size: 16, font: fontBold, color: black });
	yPos -= 25;

	page.drawText('Total Inflow', { x: 40, y: yPos, size: 12, font: fontBold, color: black });
	page.drawText(`$${(totalInflow / 100).toFixed(2)}`, { x: width - 150, y: yPos, size: 14, font: fontBold, color: green });
	yPos -= 20;

	page.drawText('Total Outflow', { x: 40, y: yPos, size: 12, font: fontBold, color: black });
	page.drawText(`$${(totalOutflow / 100).toFixed(2)}`, { x: width - 150, y: yPos, size: 14, font: fontBold, color: red });
	yPos -= 20;

	const netChange = totalInflow - totalOutflow;
	page.drawText('Net Change', { x: 40, y: yPos, size: 12, font: fontBold, color: black });
	page.drawText(`$${(netChange / 100).toFixed(2)}`, {
		x: width - 150,
		y: yPos,
		size: 14,
		font: fontBold,
		color: netChange >= 0 ? green : red,
	});
	yPos -= 40;

	// Transactions
	page.drawText(`Transactions (${transactions.length})`, { x: 40, y: yPos, size: 16, font: fontBold, color: black });
	yPos -= 25;

	for (const transaction of transactions) {
		if (yPos < 100) {
			page = pdfDoc.addPage([595, 842]);
			yPos = height - 60;
		}

		const amount = Number(transaction.amountAtomic) / 100;
		const isInflow = transaction.direction === 'in';

		page.drawText(transaction.displayTitle || transaction.description || 'Transaction', {
			x: 40,
			y: yPos,
			size: 11,
			font: fontBold,
			color: black,
			maxWidth: 350,
		});

		page.drawText(`${isInflow ? '+' : '-'}$${amount.toFixed(2)}`, {
			x: width - 150,
			y: yPos,
			size: 12,
			font: fontBold,
			color: isInflow ? green : red,
		});
		yPos -= 15;

		page.drawText(dayjs(transaction.createdAt).format('MMM DD, YYYY HH:mm'), {
			x: 40,
			y: yPos,
			size: 9,
			font: font,
			color: gray,
		});
		yPos -= 20;

		page.drawLine({ start: { x: 40, y: yPos }, end: { x: width - 40, y: yPos }, thickness: 0.5, color: lightGray });
		yPos -= 15;
	}

	// Footer on last page
	page.drawText(`This is an official statement generated on ${dayjs().format('MMM DD, YYYY HH:mm')}`, {
		x: 40,
		y: 40,
		size: 9,
		font: font,
		color: rgb(0.612, 0.639, 0.686),
	});

	return await pdfDoc.save();
}
