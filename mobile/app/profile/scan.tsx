import { useState, useEffect, type ReactElement } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  StyleSheet,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { ArrowLeft, Flashlight, FlashlightOff, Send, UserPlus } from 'lucide-react-native';
import { Sheet, useSheetRef } from '@/components/ui/sheet';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

interface ScannedData {
  type: string;
  data: string;
}

interface ScannedUser {
  handle: string;
  name: string;
  avatar: string;
  paymentUrl: string;
}

const parseScannedData = (data: string): ScannedUser | null => {
  // Parse schnl.com/pay/me/handle format
  const match = data.match(/schnl\.com\/pay\/me\/(\w+)/);
  if (match) {
    const handle = match[1];
    // Mock user data - replace with API call
    return {
      handle: `@${handle}`,
      name: 'Kibru Joba Kuture', // Would come from API
      avatar: 'https://i.pravatar.cc/150?img=3',
      paymentUrl: data,
    };
  }
  return null;
};

export default function ScanScreen(): ReactElement {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState<boolean>(false);
  const [scanned, setScanned] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);

  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const sheetRef = useSheetRef();

  // Animated values
  const scanLinePosition = useSharedValue<number>(0);
  const cornerScale = useSharedValue<number>(1);
  const successProgress = useSharedValue<number>(0);

  // Scanning line animation
  useEffect(() => {
    scanLinePosition.value = withRepeat(
      withSequence(
        withTiming(SCAN_AREA_SIZE - 4, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  }, []);

  // Corner pulse animation
  useEffect(() => {
    cornerScale.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      false
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLinePosition.value }],
  }));

  const cornerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cornerScale.value }],
  }));

  const cornerColorStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(successProgress.value, [0, 1], ['#ffffff', '#22c55e']);
    return { borderColor };
  });

  const handleBarCodeScanned = ({ data }: ScannedData): void => {
    if (scanned) return;

    setScanned(true);
    setScanSuccess(true);
    successProgress.value = withTiming(1, { duration: 200 });

    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Parse scanned data and show bottom sheet
    const user = parseScannedData(data);
    if (user) {
      setScannedUser(user);
      setTimeout(() => {
        setIsSheetVisible(true);
      }, 300);
    } else {
      // Invalid QR - go back
      setTimeout(() => {
        router.back();
      }, 400);
    }
  };

  const handleBack = (): void => {
    router.back();
  };

  const toggleTorch = (): void => {
    setTorch((prev) => !prev);
  };

  const handlePay = (): void => {
    if (!scannedUser) return;
    setIsSheetVisible(false);
    // Navigate to payment screen with user data
    router.replace({
      pathname: '/tabs/transactions',
      params: {
        handle: scannedUser?.handle,
        name: scannedUser?.name,
      },
    });
  };

  const handleAddContact = (): void => {
    setIsSheetVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Add contact logic here
    router.back();
  };

  const handleCloseSheet = (): void => {
    setIsSheetVisible(false);
    // Reset scanner to scan again
    setTimeout(() => {
      setScanned(false);
      setScanSuccess(false);
      setScannedUser(null);
      successProgress.value = withTiming(0, { duration: 200 });
    }, 300);
  };

  useEffect(() => {
    if (isSheetVisible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [isSheetVisible]);

  // Permission loading
  if (!permission) {
    return (
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <StatusBar barStyle="dark-content" />
        <View className="items-center px-8">
          <Text className="mb-3 text-2xl font-semibold text-neutral-900">Camera Access</Text>
          <Text className="mb-8 text-center text-base leading-6 text-neutral-500">
            We need camera access to scan QR codes
          </Text>
          <TouchableOpacity
            className="mb-4 rounded-full bg-lime-300 px-12 py-4"
            onPress={requestPermission}
            activeOpacity={0.8}>
            <Text className="text-base font-semibold text-neutral-900">Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-6 py-3" onPress={handleBack} activeOpacity={0.7}>
            <Text className="text-base text-neutral-500">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top overlay */}
        <View className="flex-1 bg-black/60" />

        {/* Middle section with cutout */}
        <View className="flex-row" style={{ height: SCAN_AREA_SIZE }}>
          <View className="flex-1 bg-black/60" />

          {/* Scan area */}
          <View style={{ width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE }} className="relative">
            {/* Corner brackets - Top Left */}
            <Animated.View
              className="absolute left-0 top-0 h-6 w-6 rounded-tl-xl border-l-4 border-t-4"
              style={[cornerAnimatedStyle, cornerColorStyle]}
            />
            {/* Corner brackets - Top Right */}
            <Animated.View
              className="absolute right-0 top-0 h-6 w-6 rounded-tr-xl border-r-4 border-t-4"
              style={[cornerAnimatedStyle, cornerColorStyle]}
            />
            {/* Corner brackets - Bottom Left */}
            <Animated.View
              className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-xl border-b-4 border-l-4"
              style={[cornerAnimatedStyle, cornerColorStyle]}
            />
            {/* Corner brackets - Bottom Right */}
            <Animated.View
              className="absolute bottom-0 right-0 h-6 w-6 rounded-br-xl border-b-4 border-r-4"
              style={[cornerAnimatedStyle, cornerColorStyle]}
            />

            {/* Scanning line */}
            {!scanSuccess && (
              <Animated.View
                className="absolute left-2 right-2 h-0.5 bg-lime-300"
                style={[
                  scanLineStyle,
                  {
                    shadowColor: '#bef264',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    elevation: 8,
                  },
                ]}
              />
            )}
          </View>

          <View className="flex-1 bg-black/60" />
        </View>

        {/* Bottom overlay */}
        <View className="flex-1 items-center bg-black/60 pt-10">
          <Text className="text-base font-medium text-white">Point camera at QR code</Text>
        </View>
      </View>

      {/* Header */}
      <View className="absolute left-0 right-0 top-14 flex-row justify-between px-5">
        <TouchableOpacity
          className="h-12 w-12 items-center justify-center rounded-full bg-black/40"
          onPress={handleBack}
          activeOpacity={0.7}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          className="h-12 w-12 items-center justify-center rounded-full bg-black/40"
          onPress={toggleTorch}
          activeOpacity={0.7}>
          {torch ? (
            <Flashlight size={24} color="#ffffff" />
          ) : (
            <FlashlightOff size={24} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      <Sheet ref={sheetRef} snapPoints={[340]} enablePanDownToClose onDismiss={handleCloseSheet}>
        <View className="flex-1 px-6 pb-8 pt-2">
          {/* User info */}
          <View className="mt-2 items-center">
            <Image
              source={{ uri: scannedUser?.avatar }}
              className="h-20 w-20 rounded-full bg-stone-200"
            />
            <Text className="mt-4 text-xl font-semibold text-neutral-900">{scannedUser?.name}</Text>
            <Text className="mt-1 text-base text-neutral-500">{scannedUser?.handle}</Text>
          </View>

          {/* Action buttons */}
          <View className="mt-8 flex-row gap-3">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-lime-300 py-4"
              onPress={handlePay}
              activeOpacity={0.8}>
              <Send size={20} color="#171717" />
              <Text className="text-base font-semibold text-neutral-900">Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-stone-100 py-4"
              onPress={handleAddContact}
              activeOpacity={0.8}>
              <UserPlus size={20} color="#171717" />
              <Text className="text-base font-semibold text-neutral-900">Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
