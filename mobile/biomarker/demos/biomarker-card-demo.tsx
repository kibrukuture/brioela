import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { BiomarkerCard } from '@/biomarker/components/biomarker-card/biomarker-card';
import { allSampleBiomarkers } from '@/biomarker/demos/sample-biomarker-data';

/**
 * Demo screen showing all biomarker card variations
 */
export function BiomarkerCardDemo() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="mb-6 text-2xl font-bold text-black">Biomarker Cards Demo</Text>

        <View className="gap-4">
          {allSampleBiomarkers.map((biomarker) => (
            <BiomarkerCard
              key={biomarker.id}
              data={biomarker}
              onPress={() => console.log('Pressed:', biomarker.name)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
