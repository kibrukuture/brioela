import React, { useState } from 'react';
import { View } from 'react-native';
import { BiomarkerCard } from '../components/biomarker-card/biomarker-card';
import { BiomarkerDetail } from '../components/biomarker-detail/biomarker-detail';
import { BiomarkerData } from '../types/biomarker-data.types';
import { allSampleBiomarkers } from './sample-biomarker-data';

/**
 * Demo screen showing biomarker cards with detail modal
 */
export function BiomarkerDetailDemo() {
  const [selectedBiomarker, setSelectedBiomarker] = useState<BiomarkerData | null>(null);

  const handleCardPress = (biomarker: BiomarkerData) => {
    setSelectedBiomarker(biomarker);
  };

  const handleCloseModal = () => {
    setSelectedBiomarker(null);
  };

  return (
    <View>
      <View className="p-4">
        <View className="gap-4">
          {allSampleBiomarkers.map((biomarker) => (
            <BiomarkerCard
              key={biomarker.id}
              data={biomarker}
              onPress={() => handleCardPress(biomarker)}
            />
          ))}
        </View>
      </View>

      {/* Detail Modal */}
      {selectedBiomarker && (
        <BiomarkerDetail
          data={selectedBiomarker}
          visible={!!selectedBiomarker}
          onClose={handleCloseModal}
        />
      )}
    </View>
  );
}
