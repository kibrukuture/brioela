// import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
// import dayjs from 'dayjs';

// Font.register({
// 	family: 'Inter',
// 	src: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
// });

// const styles = StyleSheet.create({
// 	page: {
// 		fontFamily: 'Inter',
// 		fontSize: 12,
// 		padding: 40,
// 		backgroundColor: '#FFFFFF',
// 	},
// 	header: {
// 		marginBottom: 30,
// 		borderBottomWidth: 1,
// 		borderBottomColor: '#E5E7EB',
// 		borderBottomStyle: 'solid',
// 		paddingBottom: 20,
// 	},
// 	title: {
// 		fontSize: 24,
// 		fontWeight: 'bold',
// 		marginBottom: 8,
// 		color: '#111827',
// 	},
// 	subtitle: {
// 		fontSize: 14,
// 		color: '#6B7280',
// 		marginBottom: 4,
// 	},
// 	section: {
// 		marginBottom: 20,
// 	},
// 	sectionTitle: {
// 		fontSize: 16,
// 		fontWeight: '600',
// 		marginBottom: 10,
// 		color: '#111827',
// 	},
// 	transaction: {
// 		flexDirection: 'row',
// 		justifyContent: 'space-between',
// 		alignItems: 'center',
// 		paddingVertical: 8,
// 		borderBottomWidth: 1,
// 		borderBottomColor: '#F3F4F6',
// 		borderBottomStyle: 'solid',
// 	},
// 	transactionLeft: {
// 		flex: 1,
// 	},
// 	transactionTitle: {
// 		fontSize: 12,
// 		fontWeight: '500',
// 		color: '#111827',
// 		marginBottom: 2,
// 	},
// 	transactionDate: {
// 		fontSize: 10,
// 		color: '#6B7280',
// 	},
// 	transactionAmount: {
// 		fontSize: 14,
// 		fontWeight: '600',
// 	},
// 	amountPositive: {
// 		color: '#059669',
// 	},
// 	amountNegative: {
// 		color: '#DC2626',
// 	},
// 	footer: {
// 		position: 'absolute',
// 		bottom: 40,
// 		left: 40,
// 		right: 40,
// 		fontSize: 10,
// 		color: '#9CA3AF',
// 		textAlign: 'center',
// 	},
// });

// interface StatementDocumentProps {
// 	transactions: any[];
// 	startDate: Date;
// 	endDate: Date;
// 	user: {
// 		email: string | null;
// 	};
// }

// export default function StatementDocument({ transactions, startDate, endDate, user }: StatementDocumentProps) {
// 	const totalInflow = transactions.filter((t) => t.direction === 'in').reduce((sum, t) => sum + Number(t.amountAtomic), 0);

// 	const totalOutflow = transactions.filter((t) => t.direction === 'out').reduce((sum, t) => sum + Number(t.amountAtomic), 0);

// 	return (
// 		<Document>
// 			<Page size="A4" style={styles.page}>
// 				<View style={styles.header}>
// 					<Text style={styles.title}>Bank Statement</Text>
// 					<Text style={styles.subtitle}>Email: {user.email || 'N/A'}</Text>
// 					<Text style={styles.subtitle}>
// 						Period: {dayjs(startDate).format('MMM DD, YYYY')} - {dayjs(endDate).format('MMM DD, YYYY')}
// 					</Text>
// 				</View>

// 				<View style={styles.section}>
// 					<Text style={styles.sectionTitle}>Summary</Text>
// 					<View style={styles.transaction}>
// 						<View style={styles.transactionLeft}>
// 							<Text style={styles.transactionTitle}>Total Inflow</Text>
// 						</View>
// 						<Text style={[styles.transactionAmount, styles.amountPositive]}>${(totalInflow / 100).toFixed(2)}</Text>
// 					</View>
// 					<View style={styles.transaction}>
// 						<View style={styles.transactionLeft}>
// 							<Text style={styles.transactionTitle}>Total Outflow</Text>
// 						</View>
// 						<Text style={[styles.transactionAmount, styles.amountNegative]}>${(totalOutflow / 100).toFixed(2)}</Text>
// 					</View>
// 					<View style={styles.transaction}>
// 						<View style={styles.transactionLeft}>
// 							<Text style={styles.transactionTitle}>Net Change</Text>
// 						</View>
// 						<Text style={[styles.transactionAmount, totalInflow - totalOutflow >= 0 ? styles.amountPositive : styles.amountNegative]}>
// 							${((totalInflow - totalOutflow) / 100).toFixed(2)}
// 						</Text>
// 					</View>
// 				</View>

// 				<View style={styles.section}>
// 					<Text style={styles.sectionTitle}>Transactions ({transactions.length})</Text>
// 					{transactions.map((transaction, index) => (
// 						<View key={transaction.id} style={styles.transaction}>
// 							<View style={styles.transactionLeft}>
// 								<Text style={styles.transactionTitle}>{transaction.displayTitle || transaction.description || 'Transaction'}</Text>
// 								<Text style={styles.transactionDate}>{dayjs(transaction.createdAt).format('MMM DD, YYYY HH:mm')}</Text>
// 							</View>
// 							<Text style={[styles.transactionAmount, transaction.direction === 'in' ? styles.amountPositive : styles.amountNegative]}>
// 								{transaction.direction === 'in' ? '+' : '-'}${(Number(transaction.amountAtomic) / 100).toFixed(2)}
// 							</Text>
// 						</View>
// 					))}
// 				</View>

// 				<Text style={styles.footer}>This is an official statement generated on {dayjs().format('MMM DD, YYYY HH:mm')}</Text>
// 			</Page>
// 		</Document>
// 	);
// }
