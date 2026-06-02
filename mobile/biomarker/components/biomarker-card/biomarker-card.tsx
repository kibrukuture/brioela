import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BiomarkerData } from '@/biomarker/types/biomarker-data.types';
import { CardVisualization } from '@/biomarker/components/biomarker-card/card-visualization';
import { SPARKLINE_DIMENSIONS } from '@/biomarker/constants/chart-dimensions';
import { formatBiomarkerValue } from '@/biomarker/formatters/format-biomarker-value';
import { formatDate } from '@/biomarker/formatters/format-date';

type BiomarkerCardProps = {
  /** Complete biomarker data */
  data: BiomarkerData;
  /** Optional press handler for opening detail view */
  onPress?: () => void;
};

/**
 * Main biomarker card component
 * Displays name, value, date, and visualization (sparkline or single-value)
 */
export function BiomarkerCard({ data, onPress }: BiomarkerCardProps) {
  const formattedValue = formatBiomarkerValue(data.currentValue.value, data.currentValue.unit);
  const formattedDate = formatDate(data.currentValue.date);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between gap-2 rounded-lg   p-4">
      {/* Left: Visualization */}
      <View>
        <CardVisualization data={data} dimensions={SPARKLINE_DIMENSIONS} />
      </View>

      {/* Right: Text Info */}
      <View className="flex-1">
        <Text className="text-base font-medium text-black">{data.name}</Text>
        <Text className="mt-1 text-2xl font-semibold text-black">{formattedValue}</Text>
        <Text className="mt-1 text-sm text-gray-500">{formattedDate}</Text>
      </View>
    </TouchableOpacity>
  );
}
