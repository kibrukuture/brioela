import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, PaperPlaneTilt, File } from 'phosphor-react-native';
import { useCameraProcessingStore } from '@/stores/hardware/use-camera-processing';
import ProcessingModal from '@/components/camera/processing-modal';
// import { useSyllabusProcessing } from '@/lib/hooks/use-syllabus-processing';

export default function AddMedicationsScreen() {
  const navigation = useNavigation();
  // const { processImages } = useSyllabusProcessing();
  const { isProcessing, startProcessing, stopProcessing } = useCameraProcessingStore();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(
    null
  );

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile || selectedFile.canceled || !selectedFile.assets) {
      Alert.alert('No File', 'Please select a file first.');
      return;
    }

    setIsUploading(true);
    startProcessing();

    try {
      // Convert file to image format expected by processing utility
      const file = selectedFile.assets[0];

      console.log('Processing file:', file);

      // Use the same processing logic as camera
      // await processImages([{ id: `file_${now().getTime()}`, uri: file.uri }], undefined);

      navigation.goBack();
    } catch (error) {
      console.error('Upload failed:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Upload was aborted by user');
        return;
      }

      Alert.alert('Upload Failed', 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      stopProcessing();
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-200 px-5 pb-5 pt-16">
        <TouchableOpacity onPress={handleGoBack} className="p-2">
          <Text className="text-base font-semibold text-blue-600">← Back</Text>
        </TouchableOpacity>
        <Text className="font-parafina text-2xl text-[#1E2A3B]">Meds</Text>
        <View className="w-16" />
      </View>

      {/* Content */}
      <View className="flex-1 justify-center p-6">
        <Text className="mb-8 text-center text-lg text-gray-600">
          {/* Upload your syllabus and we'll automatically add all your classes  */}
        </Text>

        {/* File Selection */}
        <TouchableOpacity
          className="mb-6 items-center justify-center rounded-xl border border-dashed border-gray-300 p-10"
          onPress={handleSelectFile}
          disabled={isUploading || isProcessing}>
          <View className="flex-row items-center">
            <View className="mr-3">
              <Upload size={20} color="#6B7280" />
            </View>
            <Text className="font-semibold text-gray-600">
              {selectedFile && !selectedFile.canceled ? 'Change File' : 'Select File'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Selected File Info */}
        {selectedFile && !selectedFile.canceled && selectedFile.assets && (
          <View className="mb-6 rounded-xl border border-gray-100 bg-white p-5">
            <View className="flex-row items-center">
              <View className="mr-3">
                <File size={16} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-[#1E2A3B]">
                  {selectedFile.assets[0].name}
                </Text>
                <Text className="text-sm text-gray-600">
                  {(selectedFile.assets[0].size! / 1024 / 1024).toFixed(2)} MB
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Upload Button */}
        <TouchableOpacity
          className={`items-center justify-center rounded-full border px-4 py-3 ${
            !selectedFile || selectedFile.canceled || isUploading || isProcessing
              ? 'border-gray-300 bg-gray-100'
              : 'border-gray-800 bg-gray-900'
          }`}
          onPress={handleUploadFile}
          disabled={!selectedFile || selectedFile.canceled || isUploading || isProcessing}>
          <View className="flex-row items-center">
            <View className="mr-2">
              <PaperPlaneTilt
                size={16}
                color={
                  !selectedFile || selectedFile.canceled || isUploading || isProcessing
                    ? '#9CA3AF'
                    : 'white'
                }
              />
            </View>
            <Text
              className={`font-semibold ${
                !selectedFile || selectedFile.canceled || isUploading || isProcessing
                  ? 'text-gray-400'
                  : 'text-white'
              }`}>
              {isUploading ? <ActivityIndicator /> : 'Send'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Processing Modal */}
      {isProcessing && (
        <ProcessingModal
          visible={isProcessing}
          onCancel={() => {
            // Cancel processing logic will be handled by the store
          }}
        />
      )}
    </View>
  );
}
