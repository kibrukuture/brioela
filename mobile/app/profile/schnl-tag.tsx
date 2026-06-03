'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Switch,
  Linking,
  Alert,
  ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  SlidersHorizontal,
  Info,
  Link as LinkIcon,
  Upload,
  Download,
  QrCode,
  X } from 'lucide-react-native';
import { Sheet, useSheetRef, BottomSheetView } from '@/components/ui/sheet';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useUser } from '@/network/users/use-user';
import { useUpdatePrivacy } from '@/network/users/use-update-user';

export default function SchnltagScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: user } = useUser();
  const updatePrivacyMutation = useUpdatePrivacy();

  const [copied, setCopied] = useState<boolean>(false);
  const [isInfoSheetVisible, setIsInfoSheetVisible] = useState(false);
  const [isPrivacySheetVisible, setIsPrivacySheetVisible] = useState(false);

  const infoSheetRef = useSheetRef();
  const privacySheetRef = useSheetRef();
  const qrRef = useRef<any>(null);

  const infoSnapPoints = useMemo(() => ['45%'], []);
  const privacySnapPoints = useMemo(() => ['42%'], []);

  // Construct real payment link
  const schnlTag = user?.schnlTag?.replace('@', '') || '';
  const fullPaymentUrl = `https://schnl.com/pay/${schnlTag}`;

  useIsomorphicLayoutEffect(() => {
    if (isInfoSheetVisible) {
      infoSheetRef.current?.present();
    } else {
      infoSheetRef.current?.dismiss();
    }
  }, [isInfoSheetVisible]);

  useIsomorphicLayoutEffect(() => {
    if (isPrivacySheetVisible) {
      privacySheetRef.current?.present();
    } else {
      privacySheetRef.current?.dismiss();
    }
  }, [isPrivacySheetVisible]);

  const openInfoSheet = (): void => {
    setIsInfoSheetVisible(true);
  };

  const openPrivacySheet = (): void => {
    setIsPrivacySheetVisible(true);
  };

  const closeInfoSheet = (): void => {
    setIsInfoSheetVisible(false);
  };

  const closePrivacySheet = (): void => {
    setIsPrivacySheetVisible(false);
  };

  const handleOpenLink = (): void => {
    Linking.openURL(fullPaymentUrl);
  };

  const handleCopyLink = async (): Promise<void> => {
    await Clipboard.setStringAsync(fullPaymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (): Promise<void> => {
    if (!qrRef.current) return;

    try {
      qrRef.current.toDataURL(async (data: string) => {
        const filename = `${FileSystem.cacheDirectory}schnltag-${schnlTag}.png`;
        await FileSystem.writeAsStringAsync(filename, data, {
          encoding: FileSystem.EncodingType.Base64 });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(filename, {
            mimeType: 'image/png',
            dialogTitle: 'Share your SchnlTag' });
        } else {
          Alert.alert('Sharing not available', 'Sharing is not available on this device.');
        }
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share QR code.');
    }
  };

  const handleDownload = async (): Promise<void> => {
    if (!qrRef.current) return;

    try {
      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save the QR code to your photos.');
        return;
      }

      qrRef.current.toDataURL(async (data: string) => {
        const filename = `${FileSystem.cacheDirectory}schnltag-${schnlTag}.png`;
        await FileSystem.writeAsStringAsync(filename, data, {
          encoding: FileSystem.EncodingType.Base64 });

        // Save directly to gallery
        await MediaLibrary.saveToLibraryAsync(filename);
        Alert.alert('Saved', 'QR code saved to your photos.');
      });
    } catch (error) {
      console.error('Error downloading:', error);
      Alert.alert('Error', 'Failed to save QR code.');
    }
  };

  const handleScan = (): void => {
    router.push('/profile/scan');
  };

  if (!user) return <View className="flex-1 bg-stone-100" />;

  return (
    <View className="flex-1 bg-stone-100">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-full bg-white">
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={openPrivacySheet}
              className="h-12 w-12 items-center justify-center rounded-full bg-white">
              <SlidersHorizontal size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openInfoSheet}
              className="h-12 w-12 items-center justify-center rounded-full bg-white">
              <Info size={22} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Section */}
        <View className="mt-4 items-center">
          <Image
            source={{ uri: user.profilePicture || 'https://i.pravatar.cc/150?img=68' }}
            className="h-24 w-24 rounded-full"
          />

          <Text className="mt-4 px-6 text-center text-3xl font-bold uppercase">
            {user.firstName} {user.lastName}
          </Text>

          {/* Payment Link */}
          <TouchableOpacity onPress={handleOpenLink} className="mt-4 flex-row items-center gap-2">
            <LinkIcon size={18} color="#666" />
            <Text className="text-base text-neutral-600 underline">schnl.com/pay/{schnlTag}</Text>
          </TouchableOpacity>
        </View>

        {/* QR Code Card */}
        <TouchableOpacity
          onPress={handleCopyLink}
          activeOpacity={0.8}
          className="mx-6 mt-6 items-center rounded-3xl bg-stone-200/60 p-6">
          <View className="rounded-2xl bg-white p-4">
            <QRCode
              value={fullPaymentUrl}
              size={220}
              color="#14532d"
              backgroundColor="#ffffff"
              logo={require('@/assets/media/slogo.png')}
              logoSize={50}
              logoBackgroundColor="#ffffff"
              logoMargin={4}
              logoBorderRadius={25}
              ecl="H"
              getRef={(ref: any) => (qrRef.current = ref)}
            />
          </View>

          {/* Handle Badge */}
          <View className={`mt-4 rounded-full px-6 py-2 ${copied ? 'bg-lime-400' : 'bg-white'}`}>
            <Text className="text-base text-neutral-700">
              {copied ? 'Copied!' : `@${schnlTag}`}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View className="mt-8 flex-row justify-center gap-8">
          <TouchableOpacity onPress={handleShare} className="items-center">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-lime-300">
              <Upload size={24} color="#000" />
            </View>
            <Text className="mt-2 text-sm text-neutral-700">Share</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDownload} className="items-center">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-lime-300">
              <Download size={24} color="#000" />
            </View>
            <Text className="mt-2 text-sm text-neutral-700">Download</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleScan} className="items-center">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-lime-300">
              <QrCode size={24} color="#000" />
            </View>
            <Text className="mt-2 text-sm text-neutral-700">Scan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Info Bottom Sheet */}
      <Sheet
        ref={infoSheetRef}
        snapPoints={infoSnapPoints}
        enablePanDownToClose
        onDismiss={closeInfoSheet}>
        <BottomSheetView className="flex-1 px-6 pt-2">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-2xl font-semibold">Your SchnlTag</Text>
            <TouchableOpacity
              onPress={closeInfoSheet}
              className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
              <X size={20} color="#000" />
            </TouchableOpacity>
          </View>

          <Text className="mb-3 text-base leading-6 text-neutral-600">
            Let friends send money to you by sharing your SchnlTag, link or QR code.
          </Text>
          <Text className="mb-3 text-base leading-6 text-neutral-600">
            Your SchnlTag is unique to your account and appears in your link. People can also search
            for you on Schnl by your SchnlTag.
          </Text>
        </BottomSheetView>
      </Sheet>

      {/* Privacy Bottom Sheet */}
      <Sheet
        ref={privacySheetRef}
        snapPoints={privacySnapPoints}
        enablePanDownToClose
        onDismiss={closePrivacySheet}>
        <BottomSheetView className="flex-1 px-6 pt-2">
          {/* Header */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-2xl font-semibold">Let others find me</Text>
            <TouchableOpacity
              onPress={closePrivacySheet}
              className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
              <X size={20} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Text className="mb-6 text-base leading-6 text-neutral-600">
            Choose if people on Schnl can find you by your SchnlTag
          </Text>

          {/* Toggle Row */}
          <View className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center gap-4">
              <Image
                source={{ uri: user.profilePicture || 'https://i.pravatar.cc/150?img=68' }}
                className="h-14 w-14 rounded-full"
              />
              <View>
                <Text className="text-base font-medium">SchnlTag</Text>
                <Text className="text-sm text-neutral-500">@{schnlTag}</Text>
              </View>
            </View>
            <View className={updatePrivacyMutation.isPending ? 'relative opacity-60' : 'relative'}>
              <Switch
                value={user?.isDiscoverable ?? true}
                onValueChange={(val) => updatePrivacyMutation.mutate({ isDiscoverable: val })}
                trackColor={{ false: '#d4d4d4', true: '#166534' }}
                thumbColor="#fff"
                disabled={updatePrivacyMutation.isPending}
              />
              {updatePrivacyMutation.isPending && (
                <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
                  <ActivityIndicator size="small" color="#166534" className="scale-75" />
                </View>
              )}
            </View>
          </View>
        </BottomSheetView>
      </Sheet>
    </View>
  );
}
