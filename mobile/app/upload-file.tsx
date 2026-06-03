import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, PaperPlaneTilt, File } from 'phosphor-react-native';
import { usePostLabWork } from '@/network/lab-work/use-post-lab-work';
import * as Burnt from 'burnt';
export default function UploadFileScreen() {
  const navigation = useNavigation();

  const { mutateAsync: postLabWork, isPending: isPosting } = usePostLabWork();

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

    try {
      const asset = selectedFile.assets[0];

      const formData = new FormData();
      const mimeType = asset.mimeType ?? 'application/pdf';

      formData.append('files', {
        uri: asset.uri,
        name: asset.name ?? 'upload.pdf',
        type: mimeType,
      } as unknown as Blob);

      const recordType = 'lab_work' as const;
      formData.append('recordType', recordType);
      formData.append('sourceName', 'File');
      // formData.append('notes', 'Imported from device gallery');
      // formData.append('language', 'en')

      await postLabWork({ payload: formData });

      navigation.goBack();
      Burnt.toast({
        title: 'Sent',
        preset: 'done',
        haptic: 'success',
        duration: 3,
      });
    } catch (error) {
      console.error('Upload failed:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Upload was aborted by user');
        return;
      }

      Alert.alert('Upload Failed', 'Failed to upload file. Please try again.');
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
        <Text className="font-parafina text-2xl text-[#1E2A3B]">Files</Text>
        <View className="w-16" />
      </View>

      {/* Content */}
      <View className="flex-1 justify-center p-6">
        <Text className="mb-8 text-center text-lg text-gray-600">
          Upload securely—your data is encrypted and always under your control
        </Text>

        {/* File Selection */}
        <TouchableOpacity
          className="mb-6 items-center justify-center rounded-xl border border-dashed border-gray-300 p-10"
          onPress={handleSelectFile}
          disabled={isPosting}>
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
            !selectedFile || selectedFile.canceled || isPosting
              ? 'border-gray-300 bg-gray-100'
              : 'border-gray-800 bg-gray-900'
          }`}
          onPress={handleUploadFile}
          disabled={!selectedFile || selectedFile.canceled || isPosting}>
          <View className="flex-row items-center">
            <View className="mr-2">
              <PaperPlaneTilt
                size={16}
                color={!selectedFile || selectedFile.canceled || isPosting ? '#9CA3AF' : 'white'}
              />
            </View>
            <Text
              className={`font-semibold ${
                !selectedFile || selectedFile.canceled || isPosting ? 'text-gray-400' : 'text-white'
              }`}>
              {isPosting ? <ActivityIndicator /> : 'Send'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
