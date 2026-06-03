import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Download } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import * as Burnt from 'burnt';
import dayjs from 'dayjs';
import { BackButton } from '@/components/ui/back-button';
import { useGenerateStatement } from '@/network/banking/use-generate-statement';
import { useForm } from 'react-hook-form';
import { generateStatementRequestSchema } from '@brioela/shared/validators/statement.validator';
import { zodResolver } from '@/lib/forms/zod-resolver';

const PRESET_MONTHS = [3, 6, 12] as const;
type PresetMonths = (typeof PRESET_MONTHS)[number];
type RangeMode = 'preset' | 'custom';
type DateField = 'start' | 'end';

export default function BankStatementsScreen(): React.ReactElement {
  const generateStatement = useGenerateStatement();

  const [rangeMode, setRangeMode] = useState<RangeMode>('preset');
  const [presetMonths, setPresetMonths] = useState<PresetMonths>(3);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activeField, setActiveField] = useState<DateField>('start');

  const statementFormSchema = useMemo(() => {
    return generateStatementRequestSchema.refine(
      (value) => {
        const start = Date.parse(value.startDate);
        const end = Date.parse(value.endDate);
        if (Number.isNaN(start) || Number.isNaN(end)) return false;
        return start <= end;
      },
      {
        message: 'End date must be the same as or after the start date',
        path: ['endDate'],
      }
    );
  }, []);

  const { handleSubmit, setValue, formState } = useForm<{
    startDate: string;
    endDate: string;
  }>({
    defaultValues: { startDate: '', endDate: '' },
    resolver: zodResolver(statementFormSchema),
    mode: 'onSubmit',
  });

  const resolvedRange = useMemo(() => {
    if (rangeMode === 'custom') {
      return null;
    }
    const end = dayjs();
    const start = end.subtract(presetMonths, 'month');
    return { start, end };
  }, [presetMonths, rangeMode]);

  const openPicker = (field: DateField) => {
    setActiveField(field);
    setIsPickerOpen(true);
  };

  const closePicker = () => {
    setIsPickerOpen(false);
  };

  const onDownload = async () => {
    if (generateStatement.isPending) return;

    const submit = handleSubmit(
      async (values) => {
        try {
          const response = await generateStatement.mutateAsync({
            startDate: values.startDate,
            endDate: values.endDate,
          });

          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(response.data);
          });

          const start = dayjs(values.startDate);
          const end = dayjs(values.endDate);
          const fileName = `statement-${start.format('YYYY-MM-DD')}-to-${end.format('YYYY-MM-DD')}.pdf`;
          const fileUri = FileSystem.documentDirectory + fileName;

          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          await shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Bank Statement',
          });

          Burnt.toast({ title: 'Statement ready', preset: 'done' });
        } catch (error) {
          console.error('Failed to generate statement:', error);
          const message = error instanceof Error ? error.message : 'Failed to generate statement';
          Burnt.alert({ title: 'Error', message, preset: 'error' });
        }
      },
      (errors) => {
        const startMessage = errors.startDate?.message;
        const endMessage = errors.endDate?.message;
        let message = 'Invalid date range';
        if (startMessage) {
          message = startMessage;
        }
        if (!startMessage && endMessage) {
          message = endMessage;
        }
        Burnt.alert({ title: 'Error', message, preset: 'error' });
      }
    );

    await submit();
  };

  let datePickerValue = new Date();
  if (activeField === 'start' && customStartDate) {
    datePickerValue = customStartDate;
  }
  if (activeField === 'end' && customEndDate) {
    datePickerValue = customEndDate;
  }

  let datePickerTitle = 'Start date';
  if (activeField === 'end') {
    datePickerTitle = 'End date';
  }

  let datePickerDisplay: 'spinner' | 'default' = 'default';
  if (Platform.OS === 'ios') {
    datePickerDisplay = 'spinner';
  }

  let customControls: React.ReactElement | null = null;
  if (rangeMode === 'custom') {
    let startLabel = 'Start';
    if (customStartDate) {
      startLabel = dayjs(customStartDate).format('MMM DD, YYYY');
    }

    let endLabel = 'End';
    if (customEndDate) {
      endLabel = dayjs(customEndDate).format('MMM DD, YYYY');
    }

    customControls = (
      <View className="mt-4 flex-row gap-2">
        <TouchableOpacity
          onPress={() => openPicker('start')}
          activeOpacity={0.8}
          className="flex-1 items-center justify-center rounded-full bg-white py-3">
          <Text className="text-sm font-medium text-neutral-900">{startLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openPicker('end')}
          activeOpacity={0.8}
          className="flex-1 items-center justify-center rounded-full bg-white py-3">
          <Text className="text-sm font-medium text-neutral-900">{endLabel}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  let rangeError: React.ReactElement | null = null;
  const startError = formState.errors.startDate?.message;
  const endError = formState.errors.endDate?.message;
  let errorMessage = '';
  if (startError) {
    errorMessage = startError;
  }
  if (!errorMessage && endError) {
    errorMessage = endError;
  }
  if (errorMessage) {
    rangeError = <Text className="mt-3 text-sm text-red-500">{errorMessage}</Text>;
  }

  let isDownloadDisabled = generateStatement.isPending;
  if (rangeMode === 'custom') {
    if (!customStartDate || !customEndDate) {
      isDownloadDisabled = true;
    }
  }

  let downloadContent: React.ReactElement;
  if (generateStatement.isPending) {
    downloadContent = <ActivityIndicator color="#ffffff" />;
  } else {
    downloadContent = (
      <View className="flex-row items-center gap-2">
        <Download size={18} color="#ffffff" />
        <Text className="text-base font-semibold text-white">Download</Text>
      </View>
    );
  }

  let customChipClass = 'bg-neutral-100';
  let customTextClass = 'text-neutral-900';
  if (rangeMode === 'custom') {
    customChipClass = 'bg-neutral-900';
    customTextClass = 'text-white';
  }

  useEffect(() => {
    if (rangeMode === 'preset' && resolvedRange) {
      setValue('startDate', resolvedRange.start.toISOString());
      setValue('endDate', resolvedRange.end.toISOString());
    }
    if (rangeMode === 'custom') {
      setValue('startDate', '');
      setValue('endDate', '');
    }
  }, [rangeMode, resolvedRange, setValue]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-6 pb-10"
        keyboardDismissMode="interactive">
        <View className="mb-6">
          <Text className="font-parafina text-4xl font-semibold text-neutral-900">
            Bank statements
          </Text>
          <Text className="mt-3 text-base text-neutral-500">
            Download a PDF statement for a selected time period.
          </Text>
        </View>

        <View className="rounded-2xl bg-neutral-50 px-4 py-4">
          <Text className="text-sm font-medium text-neutral-900">Time period</Text>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {PRESET_MONTHS.map((months) => {
              const isActive = rangeMode === 'preset' && presetMonths === months;
              let chipClass = 'bg-neutral-100';
              let textClass = 'text-neutral-900';
              if (isActive) {
                chipClass = 'bg-neutral-900';
                textClass = 'text-white';
              }

              return (
                <TouchableOpacity
                  key={months}
                  onPress={() => {
                    setRangeMode('preset');
                    setPresetMonths(months);
                  }}
                  activeOpacity={0.8}
                  className={`rounded-full px-4 py-2 ${chipClass}`}>
                  <Text className={`text-sm font-medium ${textClass}`}>Last {months}m</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={() => {
                setRangeMode('custom');
              }}
              activeOpacity={0.8}
              className={`rounded-full px-4 py-2 ${customChipClass}`}>
              <Text className={`text-sm font-medium ${customTextClass}`}>Custom</Text>
            </TouchableOpacity>
          </View>

          {customControls}
        </View>

        <View className="mt-8">
          <TouchableOpacity
            onPress={onDownload}
            activeOpacity={0.8}
            disabled={isDownloadDisabled}
            className="w-full items-center justify-center rounded-full bg-neutral-900 py-4">
            {downloadContent}
          </TouchableOpacity>
          {rangeError}
        </View>
      </KeyboardAwareScrollView>

      <Modal visible={isPickerOpen} transparent animationType="slide" onRequestClose={closePicker}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-white px-5 pb-8 pt-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-neutral-900">{datePickerTitle}</Text>
              <TouchableOpacity onPress={closePicker} activeOpacity={0.8}>
                <Text className="text-sm font-semibold text-neutral-900">Done</Text>
              </TouchableOpacity>
            </View>

            <View className="mt-4">
              <DateTimePicker
                value={datePickerValue}
                mode="date"
                display={datePickerDisplay}
                onChange={(_, nextDate) => {
                  if (!nextDate) return;
                  if (activeField === 'start') {
                    setCustomStartDate(nextDate);
                    setValue('startDate', nextDate.toISOString());
                    return;
                  }
                  setCustomEndDate(nextDate);
                  setValue('endDate', nextDate.toISOString());
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
