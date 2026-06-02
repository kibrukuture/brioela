import React from 'react';
import { View, Text, Modal, ScrollView } from 'react-native';
import { BiomarkerData } from '@/biomarker/types/biomarker-data.types';
import { DetailChart } from '@/biomarker/components/biomarker-detail/detail-chart';
import { HistoricalList } from '@/biomarker/components/biomarker-detail/historical-list';
import { DETAIL_CHART_DIMENSIONS } from '@/biomarker/constants/chart-dimensions';
import { formatBiomarkerValue } from '@/biomarker/formatters/format-biomarker-value';
import { formatDate } from '@/biomarker/formatters/format-date';

type BiomarkerDetailProps = {
  /** Biomarker data to display */
  data: BiomarkerData;
  /** Whether modal is visible */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
};

/**
 * Modal view showing full biomarker details
 * Includes large chart and historical values list
 */
export function BiomarkerDetail({ data, visible, onClose }: BiomarkerDetailProps) {
  const hasHistoricalData = data.historicalValues && data.historicalValues.length > 0;

  const formattedValue = formatBiomarkerValue(data.currentValue.value, data.currentValue.unit);
  const formattedDate = formatDate(data.currentValue.date);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="border-b border-gray-200 bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-black">{data.name}</Text>
          </View>
        </View>

        <ScrollView className="flex-1">
          <View className="p-4">
            {/* Current Value Card */}
            <View className="mb-6 rounded-lg bg-white p-4">
              <Text className="mb-2 text-sm text-gray-500">Current Value</Text>
              <Text className="mb-1 text-4xl font-bold text-black">{formattedValue}</Text>
              <Text className="text-sm text-gray-500">{formattedDate}</Text>
            </View>

            {/* Chart (only if historical data exists) */}
            {hasHistoricalData && (
              <View className="mb-6 rounded-lg bg-white p-4">
                <Text className="mb-4 text-lg font-semibold text-black">Dynamics</Text>
                <DetailChart
                  historicalValues={data.historicalValues!}
                  referenceRange={data.referenceRange}
                  dimensions={DETAIL_CHART_DIMENSIONS}
                  status={data.status}
                />
              </View>
            )}

            {/* Historical List */}
            {hasHistoricalData && (
              <HistoricalList
                historicalValues={data.historicalValues!}
                referenceRange={data.referenceRange}
              />
            )}

            {/* No historical data message */}
            {!hasHistoricalData && (
              <View className="rounded-lg bg-white p-6">
                <Text className="text-center text-gray-500">No historical data available</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
