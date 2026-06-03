'use client';
import { useMemo, useState } from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator } from 'react-native';
import { Sheet, useSheetRef, BottomSheetView } from '@/components/ui/sheet';
import * as Burnt from 'burnt';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { X, FileText, EnvelopeSimple, Plus, UploadSimple } from 'phosphor-react-native';
import { TransactionAvatar } from './transaction-avatar';
import { DetailSection } from './detail-section';
import type { BankingTransactionListItem } from '@brioela/shared/validators/banking-transaction.validator';
import { formatBankingAmount } from '@brioela/shared/utils/format-banking-amount';
import type { BankingTransactionCategory } from '@brioela/shared/validators/banking-transaction-category.validator';
import { useGetBankingTransactionReceipt } from '@/network/banking/use-get-banking-transaction-receipt';
import { useEmailBankingTransactionReceipt } from '@/network/banking/use-email-banking-transaction-receipt';
import { useSetBankingTransactionCategory } from '@/network/banking/use-set-banking-transaction-category';
import { useSetBankingTransactionNote } from '@/network/banking/use-set-banking-transaction-note';
import { useUploadBankingTransactionAttachment } from '@/network/banking/use-upload-banking-transaction-attachment';
import { useDeleteBankingTransactionAttachment } from '@/network/banking/use-delete-banking-transaction-attachment';
import { TransactionCategorySheet } from '@/components/transaction/activ/transaction-category-sheet';
import { usePayRequest } from '@/network/banking/use-pay-request';
import { useCancelPayRequest } from '@/network/banking/use-cancel-pay-request';
import { useUser } from '@/network/users/use-user';

const toSentenceCase = (input: string) => {
  const trimmed = input.trim();
  if (trimmed.length === 0) return trimmed;
  return `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
};

interface TransactionDetailBottomSheetProps {
  transaction: BankingTransactionListItem | null;
  isVisible: boolean;
  onClose: () => void;
}

export function TransactionDetailBottomSheet({
  transaction,
  isVisible,
  onClose }: TransactionDetailBottomSheetProps) {
  const sheetRef = useSheetRef();
  const snapPoints = useMemo(() => ['90%'], []);

  const [localTransaction, setLocalTransaction] = useState<BankingTransactionListItem | null>(
    transaction
  );

  const [activeSection, setActiveSection] = useState<'note' | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [isCategorySheetVisible, setIsCategorySheetVisible] = useState(false);

  const getReceipt = useGetBankingTransactionReceipt();
  const emailReceipt = useEmailBankingTransactionReceipt();
  const setCategory = useSetBankingTransactionCategory();
  const setNote = useSetBankingTransactionNote();
  const uploadAttachment = useUploadBankingTransactionAttachment();
  const deleteAttachment = useDeleteBankingTransactionAttachment();

  const { data: userResponse } = useUser();

  const payRequestId =
    localTransaction?.referenceType === 'pay_request'
      ? (localTransaction.referenceId ?? null)
      : null;
  const payRequest = usePayRequest(payRequestId ?? undefined);
  const cancelPayRequest = useCancelPayRequest();

  useIsomorphicLayoutEffect(() => {
    if (isVisible && transaction) {
      setLocalTransaction(transaction);
      setDraftNote(transaction.note ?? '');
      setActiveSection(null);
      setIsCategorySheetVisible(false);
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [isVisible, transaction]);

  if (!localTransaction) return null;

  const merchantName = localTransaction.displayTitle ?? localTransaction.description ?? 'Unknown';
  const subtitle = localTransaction.displaySubtitle ?? '';

  const amount = formatBankingAmount({
    amountAtomic: localTransaction.amountAtomic,
    currency: localTransaction.currency });

  const isFailed = localTransaction.status === 'failed';

  const payRequestStatus = payRequest.data?.payRequest?.status ?? null;
  const isPayRequestWaitingForClaim = payRequestStatus === 'waiting_for_claim';
  const isPayRequestExpired = Boolean(
    payRequest.data?.payRequest?.expiresAt &&
    new Date(payRequest.data.payRequest.expiresAt).getTime() < Date.now()
  );
  const isPayRequestSender =
    Boolean(userResponse?.id) && payRequest.data?.payRequest?.senderUserId === userResponse?.id;
  const canCancelPayRequest =
    Boolean(payRequestId) &&
    isPayRequestSender &&
    isPayRequestWaitingForClaim &&
    !isPayRequestExpired;

  const onCancelPayRequest = async () => {
    if (!payRequestId) return;
    try {
      const result = await cancelPayRequest.mutateAsync({ id: payRequestId });
      if (!result.cancelled) {
        Burnt.toast({ title: 'Cannot cancel', preset: 'error' });
        return;
      }
      setLocalTransaction((prev) => {
        if (!prev) return prev;
        return { ...prev, status: 'failed' };
      });
      Burnt.toast({ title: 'Cancelled', preset: 'done' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel';
      Burnt.toast({ title: message, preset: 'error' });
    }
  };

  const onViewReceipt = async () => {
    try {
      const response = await getReceipt.mutateAsync(localTransaction.id);
      const blob = response.data;

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result !== 'string') {
            reject(new Error('Failed to read receipt'));
            return;
          }

          const commaIndex = result.indexOf(',');
          if (commaIndex === -1) {
            reject(new Error('Invalid receipt data'));
            return;
          }

          resolve(result.slice(commaIndex + 1));
        };
        reader.onerror = () => reject(new Error('Failed to read receipt'));
        reader.readAsDataURL(blob);
      });

      const fileName = `receipt-${localTransaction.id}.pdf`;
      const fileUri = (FileSystem.documentDirectory ?? '') + fileName;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64 });

      await shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Receipt' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open receipt';
      Burnt.toast({ title: message, preset: 'error' });
    }
  };

  const onEmailReceipt = async () => {
    try {
      await emailReceipt.mutateAsync(localTransaction.id);
      Burnt.toast({ title: 'Receipt emailed', preset: 'done' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to email receipt';
      Burnt.toast({ title: message, preset: 'error' });
    }
  };

  const onPickAttachment = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset) return;

    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: asset.name ?? 'attachment',
      type: asset.mimeType ?? 'application/octet-stream' } as unknown as Blob);

    try {
      const result = await uploadAttachment.mutateAsync({
        id: localTransaction.id,
        payload: formData });
      setLocalTransaction((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attachments: [...(prev.attachments ?? []), result.attachment] };
      });
      Burnt.toast({ title: 'Uploaded', preset: 'done' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload attachment';
      Burnt.toast({ title: message, preset: 'error' });
    }
  };

  const onDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment.mutateAsync({ id: localTransaction.id, attachmentId });
      setLocalTransaction((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attachments: (prev.attachments ?? []).filter((a) => a.id !== attachmentId) };
      });
      Burnt.toast({ title: 'Deleted', preset: 'done' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete attachment';
      Burnt.toast({ title: message, preset: 'error' });
    }
  };

  const onSelectCategory = async (category: BankingTransactionCategory) => {
    try {
      await setCategory.mutateAsync({ id: localTransaction.id, input: { category } });
      setLocalTransaction((prev) => {
        if (!prev) return prev;
        return { ...prev, category };
      });
      Burnt.toast({ title: 'Category updated', preset: 'done' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update category';
      Burnt.toast({ title: message, preset: 'error' });
    }
  };

  const onConfirmCategory = async (category: BankingTransactionCategory) => {
    await onSelectCategory(category);
  };

  const onSaveNote = async () => {
    try {
      const nextNote = draftNote.trim();
      const note = nextNote.length ? nextNote : null;
      await setNote.mutateAsync({ id: localTransaction.id, input: { note } });
      setLocalTransaction((prev) => {
        if (!prev) return prev;
        return { ...prev, note };
      });
      Burnt.toast({ title: 'Note saved', preset: 'done' });
      setActiveSection(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save note';
      Burnt.toast({ title: message, preset: 'error' });
    }
  };

  return (
    <>
      <Sheet ref={sheetRef} snapPoints={snapPoints} onDismiss={onClose} enablePanDownToClose>
        <BottomSheetView style={{ flex: 1 }}>
          <ScrollView className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-4">
              <Text className="flex-1 text-lg font-semibold text-gray-900">{subtitle}</Text>
              <TouchableOpacity onPress={onClose} className="ml-2">
                <X size={24} color="#111827" weight="regular" />
              </TouchableOpacity>
            </View>

            {/* Avatar and Amount */}
            <View className="items-center py-6">
              <TransactionAvatar
                merchantName={merchantName}
                merchantIcon={undefined}
                merchantInitial={localTransaction.merchantInitial ?? undefined}
                size="large"
              />
              <Text className="mb-1 mt-4 text-xl font-semibold text-gray-900">{merchantName}</Text>
              {payRequestId && payRequestStatus ? (
                <View className="mt-2 rounded-full bg-gray-100 px-4 py-2">
                  <Text className="text-xs font-semibold text-gray-700">
                    {payRequestStatus.replace(/_/g, ' ')}
                  </Text>
                </View>
              ) : null}
              <Text
                className={`font-parafina text-4xl font-bold ${isFailed ? 'text-gray-400' : 'text-gray-900'}`}>
                {amount.display}
              </Text>
            </View>

            {/* Primary Actions */}
            <View className="mb-4 flex-row gap-2 px-4">
              <TouchableOpacity
                onPress={onViewReceipt}
                disabled={getReceipt.isPending}
                activeOpacity={0.85}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-neutral-900 px-4 py-3">
                {getReceipt.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <FileText size={18} color="#ffffff" weight="regular" />
                    <Text className="text-sm font-semibold text-white">View receipt</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onEmailReceipt}
                disabled={emailReceipt.isPending}
                activeOpacity={0.85}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-neutral-900 px-4 py-3">
                {emailReceipt.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <EnvelopeSimple size={18} color="#ffffff" weight="regular" />
                    <Text className="text-sm font-semibold text-white">Email receipt</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View className="px-4">
              {/* Failure Reason */}
              {isFailed && (
                <DetailSection title="Failure reason">
                  <Text className="text-base text-gray-900">Transaction failed</Text>
                </DetailSection>
              )}

              {/* Category */}
              <DetailSection title="Category">
                <TouchableOpacity
                  onPress={() => setIsCategorySheetVisible(true)}
                  activeOpacity={0.85}
                  className="flex-row items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <View className="flex-row items-center gap-2">
                    {!localTransaction.category && (
                      <Plus size={18} color="#111827" weight="regular" />
                    )}
                    <Text className="text-base font-medium text-neutral-900">
                      {localTransaction.category
                        ? toSentenceCase(localTransaction.category.replace(/_/g, ' '))
                        : 'Add category'}
                    </Text>
                  </View>
                  {setCategory.isPending ? <ActivityIndicator size="small" /> : null}
                </TouchableOpacity>
              </DetailSection>

              {/* Notes */}
              <DetailSection title="Notes">
                <TouchableOpacity
                  onPress={() => setActiveSection('note')}
                  className="flex-row items-center self-start rounded-full bg-blue-100 px-4 py-2.5">
                  <Plus size={18} color="#2563EB" weight="regular" />
                  <Text className="ml-2 text-sm font-medium text-blue-600">
                    {localTransaction.note ? 'Edit Note' : 'Add a Note'}
                  </Text>
                </TouchableOpacity>

                {activeSection === 'note' && (
                  <View className="mt-4">
                    <View className="rounded-2xl bg-gray-100 px-4 py-4">
                      <Text className="text-xs text-gray-500">Note</Text>
                      <TextInput
                        value={draftNote}
                        onChangeText={setDraftNote}
                        placeholder="Add a note"
                        multiline
                        className="mt-2 text-base text-gray-900"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <TouchableOpacity
                      onPress={onSaveNote}
                      disabled={setNote.isPending}
                      className="mt-3 items-center justify-center rounded-full bg-neutral-900 py-3">
                      {setNote.isPending ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-sm font-semibold text-white">Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </DetailSection>

              {/* Attachments */}
              <DetailSection title="Attachments">
                {(localTransaction.attachments ?? []).length > 0 && (
                  <View className="mb-2">
                    {(localTransaction.attachments ?? []).map((a) => (
                      <View key={a.id} className="mb-2 rounded-2xl bg-gray-100 px-4 py-3">
                        <TouchableOpacity
                          onPress={async () => {
                            try {
                              await WebBrowser.openBrowserAsync(a.url);
                            } catch {
                              Burnt.toast({ title: 'Failed to open attachment', preset: 'error' });
                            }
                          }}
                          className="flex-row items-center justify-between">
                          <Text
                            className="flex-1 text-sm font-medium text-gray-900"
                            numberOfLines={1}>
                            {a.name}
                          </Text>
                          <Text className="ml-3 text-sm font-semibold text-blue-600">Open</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => onDeleteAttachment(a.id)}
                          disabled={deleteAttachment.isPending}
                          className="mt-2 self-start">
                          <Text className="text-sm font-semibold text-red-600">Delete</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  onPress={onPickAttachment}
                  disabled={uploadAttachment.isPending}
                  className="flex-row items-center justify-center py-3">
                  <UploadSimple size={20} color="#2563EB" weight="regular" />
                  <Text className="ml-2 text-base font-medium text-blue-600">
                    {uploadAttachment.isPending ? 'Uploading...' : 'Upload'}
                  </Text>
                </TouchableOpacity>
              </DetailSection>

              {/* Bank Description */}
              {localTransaction.description && (
                <DetailSection title="Bank description">
                  <Text className="text-base text-gray-900">{localTransaction.description}</Text>
                </DetailSection>
              )}

              {payRequestId && (
                <DetailSection title="Transfer">
                  {canCancelPayRequest && (
                    <TouchableOpacity
                      onPress={onCancelPayRequest}
                      disabled={cancelPayRequest.isPending}
                      className="mt-1 items-center justify-center rounded-full bg-neutral-900 py-3">
                      {cancelPayRequest.isPending ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-sm font-semibold text-white">Cancel transfer</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {!canCancelPayRequest && isPayRequestSender && isPayRequestWaitingForClaim ? (
                    <Text className="text-sm text-gray-600">
                      This transfer can no longer be cancelled.
                    </Text>
                  ) : null}
                </DetailSection>
              )}

              {/* Recipient Memo */}
            </View>
          </ScrollView>
        </BottomSheetView>
      </Sheet>

      <TransactionCategorySheet
        isVisible={isCategorySheetVisible}
        value={(localTransaction.category ?? null) as BankingTransactionCategory | null}
        onConfirm={onConfirmCategory}
        onClose={() => setIsCategorySheetVisible(false)}
      />
    </>
  );
}
