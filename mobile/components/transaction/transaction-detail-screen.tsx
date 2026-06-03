'use client';

import type React from 'react';
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionHeader } from './transaction-header';
import { TabSelector } from './tab-selector';
import { Timeline } from './timeline';
import { TransactionDetailsSection } from './transaction-details-screen';
import { CardPaymentDetails } from './card-payment-details';
import { AddReceiptCard } from './add-receipt-card';
import { HowYouPaidSection } from './how-you-paid-section';
import { SplitTransactionCard } from './split-transaction-card';
import { BankDetailsSection } from './bank-details-section';
import { PartnershipFooter } from './partnership-footer';
import { InfoBanner } from './info-banner';
import { ActionButton } from './action-button';
import { TransactionNumber } from './transaction-number';
import { HowSenderPaidSection } from './how-sender-paid-section';
// import { GridIcon, ForkKnifeIcon, DocumentIcon } from './icons';
import type {
  TransactionDetailScreenProps,
  MoneyAddedTransaction,
  MoneySentTransaction,
  MoneyReceivedTransaction,
  CardPaymentTransaction,
  CardCheckedTransaction,
} from './types';
import { FilePdf, ForkKnife } from 'phosphor-react-native';
import { GridIcon } from 'lucide-react-native';

export const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({
  transaction,
  onBack,
  onHelp,
  onMore,
  onRepeatTransfer,
  onRateApp,
  onGetConfirmation,
  onAddNote,
  onAddReceipt,
  onToggleRecurring,
  onSplitTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'Updates' | 'Details'>('Updates');

  const getCategoryIcon = () => {
    switch (transaction.category) {
      case 'Eating out':
        return <ForkKnife size={16} color="#666" />;
      case 'Bills':
        return <FilePdf size={16} color="#666" />;
      case 'General':
      default:
        return <GridIcon size={16} color="#666" />;
    }
  };

  const renderMoneyAddedContent = (tx: MoneyAddedTransaction) => {
    if (activeTab === 'Updates') {
      return (
        <>
          <Timeline steps={tx.timeline} />
          <ActionButton title="Rate the app" onPress={onRateApp} />
        </>
      );
    }

    return (
      <>
        <TransactionDetailsSection
          title="Transaction details"
          rows={[
            { label: 'You paid', value: `${tx.youPaid} ${tx.currency}` },
            { label: "Wise's fees", value: `${tx.wisesFees} ${tx.currency}` },
            {
              label: 'They would have received',
              value: `${tx.theyWouldReceive} ${tx.currency}`,
              valueStyle: 'large',
              showDashedBorder: true,
            },
            { label: 'Transaction number', value: `#${tx.transactionNumber}` },
          ]}
        />
        <ActionButton title="Get transfer confirmation" onPress={onGetConfirmation} />
        {tx.partnershipName && (
          <PartnershipFooter partnerName={tx.partnershipName} partnerLogo={tx.partnershipLogo} />
        )}
      </>
    );
  };

  const renderMoneySentContent = (tx: MoneySentTransaction) => {
    if (activeTab === 'Updates') {
      return (
        <>
          <Timeline steps={tx.timeline} />
          <ActionButton title="Repeat this transfer" onPress={onRepeatTransfer} />
          <ActionButton title="Rate the app" variant="secondary" onPress={onRateApp} />
        </>
      );
    }

    return (
      <>
        <TransactionDetailsSection
          title="Transaction details"
          rows={[
            { label: 'You sent', value: `${tx.youSent} ${tx.currency}` },
            { label: "Wise's fees", value: `${tx.wisesFees} ${tx.currency}` },
            {
              label: 'You received',
              value: tx.youReceived || '',
              valueStyle: 'large',
              showDashedBorder: true,
            },
            { label: 'Transaction number', value: `#${tx.transactionNumber}` },
          ]}
        />
        {tx.bankDetails && <BankDetailsSection bankDetails={tx.bankDetails} />}
        {tx.splitTransactionUsers && (
          <SplitTransactionCard users={tx.splitTransactionUsers} onPress={onSplitTransaction} />
        )}
        <ActionButton title="Get transfer confirmation" onPress={onGetConfirmation} />
      </>
    );
  };

  const renderMoneyReceivedContent = (tx: MoneyReceivedTransaction) => {
    return (
      <View className="-mt-4 flex-1 rounded-t-3xl bg-white pt-4">
        <TransactionDetailsSection
          title="Transaction details"
          rows={[
            { label: 'You were sent', value: `${tx.youWereSent} ${tx.currency}` },
            { label: "Wise's fees", value: `${tx.wisesFees} ${tx.currency}` },
            {
              label: 'You received',
              value: `${tx.youReceived} ${tx.currency}`,
              valueStyle: 'large',
              showDashedBorder: true,
            },
            { label: 'Received on', value: tx.receivedOn },
            { label: 'Reference', value: tx.reference },
            { label: 'Transaction number', value: `#${tx.transactionNumber}` },
          ]}
        />
        <HowSenderPaidSection senderName={tx.senderName} />
        {tx.partnershipName && (
          <PartnershipFooter partnerName={tx.partnershipName} partnerLogo={tx.partnershipLogo} />
        )}
      </View>
    );
  };

  const renderCardPaymentContent = (tx: CardPaymentTransaction) => {
    return (
      <View className="-mt-4 flex-1 rounded-t-3xl bg-white pt-4">
        {tx.splitTransactionUsers && tx.splitTransactionUsers.length > 0 && (
          <SplitTransactionCard users={tx.splitTransactionUsers} onPress={onSplitTransaction} />
        )}
        <CardPaymentDetails
          when={tx.when}
          where={tx.where}
          whichCard={tx.whichCard}
          authorisedVia={tx.authorisedVia}
          note={tx.note}
          isRecurringPayment={tx.isRecurringPayment}
          onAddNote={onAddNote}
          onToggleRecurring={onToggleRecurring}
        />
        <AddReceiptCard onPress={onAddReceipt} />
        <HowYouPaidSection
          currency={tx.howYouPaid.currency}
          currencyFlag={tx.howYouPaid.currencyFlag}
          amountTaken={tx.howYouPaid.amountTaken}
        />
        <TransactionNumber number={tx.transactionNumber} merchantName={tx.merchantName} />
      </View>
    );
  };

  const renderCardCheckedContent = (tx: CardCheckedTransaction) => {
    return (
      <View className="-mt-4 flex-1 rounded-t-3xl bg-white pt-4">
        <InfoBanner message={tx.infoMessage} />
        <CardPaymentDetails
          when={tx.when}
          where={tx.where}
          whichCard={tx.whichCard}
          authorisedVia={tx.authorisedVia}
          note={tx.note}
          isRecurringPayment={tx.isRecurringPayment}
          onAddNote={onAddNote}
          onToggleRecurring={onToggleRecurring}
        />
        <AddReceiptCard onPress={onAddReceipt} />
        <TransactionNumber number={tx.transactionNumber} merchantName={tx.merchantName} />
      </View>
    );
  };

  const renderContent = () => {
    switch (transaction.type) {
      case 'money_added':
        return renderMoneyAddedContent(transaction as MoneyAddedTransaction);
      case 'money_sent':
        return renderMoneySentContent(transaction as MoneySentTransaction);
      case 'money_received':
        return renderMoneyReceivedContent(transaction as MoneyReceivedTransaction);
      case 'card_payment':
        return renderCardPaymentContent(transaction as CardPaymentTransaction);
      case 'card_checked':
        return renderCardCheckedContent(transaction as CardCheckedTransaction);
      default:
        return null;
    }
  };

  const showTabs = transaction.type === 'money_added' || transaction.type === 'money_sent';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <TransactionHeader
          type={transaction.type}
          amount={transaction.amount}
          currency={transaction.currency}
          recipientOrSenderName={
            transaction.type === 'money_sent'
              ? (transaction as MoneySentTransaction).recipientName
              : transaction.type === 'money_received'
                ? (transaction as MoneyReceivedTransaction).senderName
                : undefined
          }
          merchantName={
            transaction.type === 'card_payment'
              ? (transaction as CardPaymentTransaction).merchantName
              : transaction.type === 'card_checked'
                ? (transaction as CardCheckedTransaction).merchantName
                : undefined
          }
          merchantLogo={
            transaction.type === 'card_payment'
              ? (transaction as CardPaymentTransaction).merchantLogo
              : undefined
          }
          category={transaction.category}
          categoryIcon={transaction.category ? getCategoryIcon() : undefined}
          onBack={onBack}
          onHelp={onHelp}
          onMore={onMore}
        />

        {showTabs && <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />}

        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TransactionDetailScreen;
