import React from 'react';
import { View, Text } from 'react-native';
import { BiomarkerValue } from '@/biomarker/types/biomarker-data.types';
import { formatBiomarkerValue } from '@/biomarker/formatters/format-biomarker-value';
import { formatDate } from '@/biomarker/formatters/format-date';
import { STATUS_COLORS } from '@/biomarker/constants/colors';
import { getBiomarkerStatus } from '@/biomarker/formatters/get-biomarker-status';
import { ReferenceRange } from '@/biomarker/types/reference-range.types';

type HistoricalListProps = {
  /** Historical values to display */
  historicalValues: BiomarkerValue[];
  /** Reference range for status indicators */
  referenceRange?: ReferenceRange;
};

/**
 * Renders a list of historical biomarker values
 * Shows date, value, and status indicator
 */
export function HistoricalList({ historicalValues, referenceRange }: HistoricalListProps) {
  return (
    <View className="mt-6">
      <Text className="mb-4 text-lg font-semibold text-black">History</Text>

      <View className="overflow-hidden rounded-lg bg-white">
        {historicalValues.map((item, index) => {
          const status = getBiomarkerStatus(item.value, referenceRange);
          const statusColor = STATUS_COLORS[status];
          const formattedValue = formatBiomarkerValue(item.value, item.unit);
          const formattedDate = formatDate(item.date);

          return (
            <View
              key={index}
              className={`flex-row items-center justify-between p-4 ${
                index !== historicalValues.length - 1 ? 'border-b border-gray-100' : ''
              }`}>
              {/* Date */}
              <Text className="flex-1 text-sm text-gray-500">{formattedDate}</Text>

              {/* Value */}
              <Text className="flex-1 text-right text-base font-medium text-black">
                {formattedValue}
              </Text>

              {/* Status Indicator (dot) */}
              <View className="ml-3">
                <View className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
