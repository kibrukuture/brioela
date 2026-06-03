import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Images, PaperPlaneTilt, X } from 'phosphor-react-native';
import { now } from '@/lib/date-time-utils';
import { optimizeImage } from '@/lib/files/optimize-image';
import { usePostLabWork } from '@/hooks/lab-work/use-post-lab-work';
import { HealthRecordType } from '@brioela/shared/drizzle/schema/health-records.schema';
import * as Burnt from 'burnt';

interface SelectedImage {
  id: string;
  uri: string;
  name: string;
  mimeType?: string;
}

export default function SelectPicturesScreen() {
  const navigation = useNavigation();
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const { mutateAsync: postLabWork, isPending: isPosting } = usePostLabWork();

  const handleSelectImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages: SelectedImage[] = result.assets.map((asset, index) => ({
          id: `selected_${now().getTime()}_${index}`,
          uri: asset.uri,
          name: asset.fileName || `image_${index + 1}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
        }));

        setSelectedImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error selecting images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const onSend = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Images', 'Please select at least one image.');
      return;
    }

    try {
      const optimized = await Promise.all(selectedImages.map((img) => optimizeImage(img.uri)));

      const formData = new FormData();

      optimized.forEach((opt, index) => {
        const original = selectedImages[index];
        formData.append('files', {
          uri: opt.uri,
          name: original.name ?? `image_${index + 1}.jpg`,
          type: original.mimeType || 'image/jpeg',
        } as unknown as Blob);
      });
      const recordType: (typeof HealthRecordType.enumValues)[number] = 'lab_work';
      formData.append('recordType', recordType);
      formData.append('sourceName', 'Gallery');
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
      console.error('Processing failed:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Processing was aborted by user');
        return;
      }
      Alert.alert('Processing Failed', 'Failed to process images. Please try again.');
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderImageItem = ({ item }: { item: SelectedImage }) => (
    <View className="relative m-1 flex-1 overflow-hidden rounded-xl border border-gray-100 bg-white">
      <Image source={{ uri: item.uri }} className="h-30 w-full" resizeMode="cover" />
      <View className="p-2">
        <Text className="text-xs text-gray-600" numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <TouchableOpacity
        className="absolute right-2 top-2 h-6 w-6 items-center justify-center rounded-xl bg-black/60"
        onPress={() => handleRemoveImage(item.id)}>
        <X size={12} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-200 px-5 pb-5 pt-16">
        <TouchableOpacity onPress={handleGoBack} className="p-2">
          <Text className="text-base font-semibold text-blue-600">← Back</Text>
        </TouchableOpacity>
        <Text className="font-parafina text-2xl text-[#1E2A3B]">Images</Text>
        <View className="w-16" />
      </View>

      {/* Content */}
      <View className="flex-1 justify-center p-6">
        <Text className="mb-8 text-center text-lg text-gray-600">
          Upload securely—your data is encrypted and always under your control
        </Text>

        {/* Select Images Button */}
        <TouchableOpacity
          className="mb-6 items-center justify-center rounded-xl border border-dashed border-gray-300 p-10"
          onPress={handleSelectImages}
          disabled={isPosting}>
          <View className="flex-row items-center">
            <View className="mr-3">
              <Images size={20} color="#6B7280" />
            </View>
            <Text className="font-semibold text-gray-600">
              {selectedImages.length > 0 ? 'Add More Images' : 'Select Images'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Selected Images List */}
        {selectedImages.length > 0 && (
          <View className="mb-6 rounded-xl border border-gray-100 bg-white p-5">
            <Text className="mb-3 font-parafina text-lg text-[#1E2A3B]">
              Selected Images ({selectedImages.length})
            </Text>
            <FlatList
              data={selectedImages}
              renderItem={renderImageItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        )}

        {/* Process Button */}
        <TouchableOpacity
          className={`items-center justify-center rounded-full border px-4 py-3 ${
            selectedImages.length === 0 || isPosting
              ? 'border-gray-300 bg-gray-100'
              : 'border-gray-800 bg-gray-900'
          }`}
          onPress={onSend}
          disabled={selectedImages.length === 0 || isPosting}>
          <View className="flex-row items-center">
            <View className="mr-2">
              <PaperPlaneTilt
                size={16}
                color={selectedImages.length === 0 || isPosting ? '#9CA3AF' : 'white'}
              />
            </View>
            <Text
              className={`font-semibold ${
                selectedImages.length === 0 || isPosting ? 'text-gray-400' : 'text-white'
              }`}>
              {isPosting ? <ActivityIndicator /> : 'Send'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
