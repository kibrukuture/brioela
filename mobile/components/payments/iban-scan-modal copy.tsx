import { useEffect, useRef, useState } from 'react';
import { Dimensions, Modal, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import { X } from 'phosphor-react-native';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { isValidIban } from '@schnl/shared/lib/banking/payments/iban';

type Props = {
  visible: boolean;
  onClose: () => void;
  onIbanDetected: (iban: string) => void;
};

type ScanState = 'idle' | 'scanning' | 'found' | 'error';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FRAME_WIDTH = Math.round(SCREEN_WIDTH * 0.82);
const FRAME_HEIGHT = 96;

const normalizeText = (text: string): string => {
  return text.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ');
};

const extractIbanCandidates = (rawText: string): string[] => {
  const text = normalizeText(rawText);
  const tokens = text
    .split(/\s+/g)
    .map((t) => t.trim())
    .filter(Boolean);

  const candidates = new Set<string>();

  for (const token of tokens) {
    const compact = token.replace(/\s+/g, '').toUpperCase();
    if (compact.length >= 15 && compact.length <= 34 && /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(compact)) {
      candidates.add(compact);
    }
  }

  const joined = tokens.join('');
  const matchAll = joined.matchAll(/[A-Z]{2}\d{2}[A-Z0-9]{11,30}/g);
  for (const match of matchAll) {
    candidates.add(match[0]);
  }

  return [...candidates].sort((a, b) => b.length - a.length);
};

export function IbanScanModal({ visible, onClose, onIbanDetected }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [torch, setTorch] = useState(false);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorText, setErrorText] = useState<string>('');
  const [cameraReady, setCameraReady] = useState(false);
  const [mountError, setMountError] = useState<string>('');

  const intervalMs = 900;
  const inFlightRef = useRef(false);
  const isActiveRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      isActiveRef.current = false;
      inFlightRef.current = false;
      setScanState('idle');
      setErrorText('');
      setTorch(false);
      setCameraReady(false);
      setMountError('');
      return;
    }

    isActiveRef.current = true;
    setScanState('scanning');

    const id = setInterval(() => {
      (async () => {
        if (!isActiveRef.current) return;
        if (inFlightRef.current) return;
        if (!permission?.granted) return;
        if (!cameraReady) return;
        if (mountError) return;

        const camera = cameraRef.current;
        if (!camera) return;

        inFlightRef.current = true;

        try {
          const photo = await camera.takePictureAsync({
            quality: 0.55,
            base64: false,
            skipProcessing: false,
          });

          if (!photo?.uri) return;

          const photoWidth = typeof photo.width === 'number' ? photo.width : undefined;
          const photoHeight = typeof photo.height === 'number' ? photo.height : undefined;

          // Crop roughly to the visible scan rectangle (center crop).
          // This is intentionally approximate; it dramatically speeds up OCR and reduces false positives.
          const cropWidth = photoWidth ? Math.round(photoWidth * 0.88) : undefined;
          const cropHeight = photoHeight ? Math.round(photoHeight * 0.22) : undefined;
          const originX =
            photoWidth && cropWidth ? Math.max(0, Math.round((photoWidth - cropWidth) / 2)) : 0;
          const originY =
            photoHeight && cropHeight ? Math.max(0, Math.round((photoHeight - cropHeight) / 2)) : 0;

          const processed = await manipulateAsync(
            photo.uri,
            [
              ...(cropWidth && cropHeight
                ? [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }]
                : []),
              { resize: { width: 1100 } },
            ],
            {
              compress: 0.8,
              format: SaveFormat.JPEG,
            }
          );

          const result = await TextRecognition.recognize(processed.uri);
          const text = result?.text ?? '';

          const candidates = extractIbanCandidates(text);

          const iban = candidates.find((c) => isValidIban(c)) ?? null;

          if (iban) {
            setScanState('found');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onIbanDetected(iban);
            onClose();

            try {
              await FileSystem.deleteAsync(photo.uri, { idempotent: true });
            } catch {
              // ignore
            }
            try {
              await FileSystem.deleteAsync(processed.uri, { idempotent: true });
            } catch {
              // ignore
            }
            return;
          }

          try {
            await FileSystem.deleteAsync(photo.uri, { idempotent: true });
          } catch {
            // ignore
          }

          try {
            await FileSystem.deleteAsync(processed.uri, { idempotent: true });
          } catch {
            // ignore
          }
        } catch {
          setScanState('error');
          setErrorText('Could not read text. Try again.');
        } finally {
          inFlightRef.current = false;
        }
      })();
    }, intervalMs);

    return () => {
      clearInterval(id);
      isActiveRef.current = false;
      inFlightRef.current = false;
    };
  }, [visible, permission?.granted, onClose, onIbanDetected, cameraReady, mountError]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" />

        {permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            facing="back"
            enableTorch={torch}
            onCameraReady={() => {
              setCameraReady(true);
              setErrorText('');
            }}
            onMountError={(e) => {
              setMountError(e.message ?? 'Camera failed to start');
              setScanState('error');
              setErrorText(e.message ?? 'Camera failed to start');
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-white px-8">
            <StatusBar barStyle="dark-content" />
            <Text className="mb-3 text-2xl font-semibold text-neutral-900">Camera Access</Text>
            <Text className="mb-8 text-center text-base leading-6 text-neutral-500">
              We need camera access to scan your IBAN.
            </Text>
            <TouchableOpacity
              className="mb-4 rounded-full bg-lime-300 px-12 py-4"
              onPress={requestPermission}
              activeOpacity={0.8}>
              <Text className="text-base font-semibold text-neutral-900">Allow Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-6 py-3" onPress={onClose} activeOpacity={0.7}>
              <Text className="text-base text-neutral-500">Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {permission?.granted && (
          <>
            {/* Subtle overlay so it never looks like a blank black screen */}
            <View className="absolute inset-0 border border-white/10" />

            <View className="absolute inset-0 items-center justify-center">
              <View className="absolute inset-0 bg-black/55" />
              <View
                style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT }}
                className="rounded-2xl border-2 border-white/90 bg-transparent"
              />
            </View>

            <View className="absolute left-0 right-0 top-14 flex-row items-center justify-between px-5">
              <TouchableOpacity
                className="h-12 w-12 items-center justify-center rounded-full bg-black/40"
                onPress={onClose}
                activeOpacity={0.7}>
                <X size={24} weight="bold" color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity
                className="h-12 items-center justify-center rounded-full bg-black/40 px-4"
                onPress={() => setTorch((prev) => !prev)}
                activeOpacity={0.7}>
                <Text className="text-sm font-semibold text-white">
                  {torch ? 'Torch On' : 'Torch Off'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="absolute bottom-0 left-0 right-0 items-center px-6 pb-10">
              <Text className="text-base font-medium text-white">
                Align the IBAN inside the frame
              </Text>
              {!cameraReady && !mountError && (
                <Text className="mt-2 text-sm text-white/80">Starting camera…</Text>
              )}
              {scanState === 'error' && errorText.length > 0 && (
                <Text className="mt-2 text-sm text-white/80">{errorText}</Text>
              )}
              {cameraReady && !mountError && scanState !== 'error' && (
                <Text className="mt-2 text-sm text-white/80">
                  Hold steady and use good lighting.
                </Text>
              )}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

// import { useEffect, useRef, useState } from 'react';
// import { Dimensions, Modal, StatusBar, Text, TouchableOpacity, View } from 'react-native';
// import { CameraView, useCameraPermissions } from 'expo-camera';
// import * as FileSystem from 'expo-file-system';
// import * as Haptics from 'expo-haptics';
// import { SaveFormat, manipulateAsync, useImageManipulator } from 'expo-image-manipulator';
// import { X } from 'phosphor-react-native';
// import MlkitOcr from 'react-native-mlkit-ocr';
// import { isValidIban } from '@schnl/shared/lib/banking/payments/iban';

// type Props = {
//   visible: boolean;
//   onClose: () => void;
//   onIbanDetected: (iban: string) => void;
// };

// type ScanState = 'idle' | 'scanning' | 'found' | 'error';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const FRAME_WIDTH = Math.round(SCREEN_WIDTH * 0.82);
// const FRAME_HEIGHT = 96;

// const normalizeText = (text: string): string => {
//   return text.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ');
// };

// const extractIbanCandidates = (rawText: string): string[] => {
//   const text = normalizeText(rawText);
//   const tokens = text
//     .split(/\s+/g)
//     .map((t) => t.trim())
//     .filter(Boolean);

//   const candidates = new Set<string>();

//   for (const token of tokens) {
//     const compact = token.replace(/\s+/g, '').toUpperCase();
//     if (compact.length >= 15 && compact.length <= 34 && /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(compact)) {
//       candidates.add(compact);
//     }
//   }

//   const joined = tokens.join('');
//   const matchAll = joined.matchAll(/[A-Z]{2}\d{2}[A-Z0-9]{11,30}/g);
//   for (const match of matchAll) {
//     candidates.add(match[0]);
//   }

//   return [...candidates].sort((a, b) => b.length - a.length);
// };

// export function IbanScanModal({ visible, onClose, onIbanDetected }: Props) {
//   const [permission, requestPermission] = useCameraPermissions();
//   const cameraRef = useRef<CameraView>(null);
//   const [torch, setTorch] = useState(false);
//   const [scanState, setScanState] = useState<ScanState>('idle');
//   const [errorText, setErrorText] = useState<string>('');
//   const [cameraReady, setCameraReady] = useState(false);
//   const [mountError, setMountError] = useState<string>('');

//   const intervalMs = 900;
//   const inFlightRef = useRef(false);
//   const isActiveRef = useRef(false);

//   useEffect(() => {
//     if (!visible) {
//       isActiveRef.current = false;
//       inFlightRef.current = false;
//       setScanState('idle');
//       setErrorText('');
//       setTorch(false);
//       setCameraReady(false);
//       setMountError('');
//       return;
//     }

//     isActiveRef.current = true;
//     setScanState('scanning');

//     const id = setInterval(() => {
//       (async () => {
//         if (!isActiveRef.current) return;
//         if (inFlightRef.current) return;
//         if (!permission?.granted) return;
//         if (!cameraReady) return;
//         if (mountError) return;

//         const camera = cameraRef.current;
//         if (!camera) return;

//         inFlightRef.current = true;

//         try {
//           const photo = await camera.takePictureAsync({
//             quality: 0.55,
//             base64: false,
//             skipProcessing: false,
//           });

//           if (!photo?.uri) return;

//           const photoWidth = typeof photo.width === 'number' ? photo.width : undefined;
//           const photoHeight = typeof photo.height === 'number' ? photo.height : undefined;

//           // Crop roughly to the visible scan rectangle (center crop).
//           // This is intentionally approximate; it dramatically speeds up OCR and reduces false positives.
//           const cropWidth = photoWidth ? Math.round(photoWidth * 0.88) : undefined;
//           const cropHeight = photoHeight ? Math.round(photoHeight * 0.22) : undefined;
//           const originX =
//             photoWidth && cropWidth ? Math.max(0, Math.round((photoWidth - cropWidth) / 2)) : 0;
//           const originY =
//             photoHeight && cropHeight ? Math.max(0, Math.round((photoHeight - cropHeight) / 2)) : 0;

//           const processed = await manipulateAsync(
//             photo.uri,
//             [
//               ...(cropWidth && cropHeight
//                 ? [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }]
//                 : []),
//               { resize: { width: 1100 } },
//             ],
//             {
//               compress: 0.8,
//               format: SaveFormat.JPEG,
//             }
//           );

//           const result = await MlkitOcr.detectFromUri(processed.uri);
//           const text = result?.map((block) => block.text).join(' ') ?? '';

//           const candidates = extractIbanCandidates(text);

//           const iban = candidates.find((c) => isValidIban(c)) ?? null;

//           if (iban) {
//             setScanState('found');
//             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//             onIbanDetected(iban);
//             onClose();

//             try {
//               await FileSystem.deleteAsync(photo.uri, { idempotent: true });
//             } catch {
//               // ignore
//             }
//             try {
//               await FileSystem.deleteAsync(processed.uri, { idempotent: true });
//             } catch {
//               // ignore
//             }
//             return;
//           }

//           try {
//             await FileSystem.deleteAsync(photo.uri, { idempotent: true });
//           } catch {
//             // ignore
//           }

//           try {
//             await FileSystem.deleteAsync(processed.uri, { idempotent: true });
//           } catch {
//             // ignore
//           }
//         } catch {
//           setScanState('error');
//           setErrorText('Could not read text. Try again.');
//         } finally {
//           inFlightRef.current = false;
//         }
//       })();
//     }, intervalMs);

//     return () => {
//       clearInterval(id);
//       isActiveRef.current = false;
//       inFlightRef.current = false;
//     };
//   }, [visible, permission?.granted, onClose, onIbanDetected, cameraReady, mountError]);

//   if (!visible) return null;

//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       presentationStyle="fullScreen"
//       onRequestClose={onClose}>
//       <View className="flex-1 bg-black">
//         <StatusBar barStyle="light-content" />

//         {permission?.granted ? (
//           <CameraView
//             ref={cameraRef}
//             style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
//             facing="back"
//             enableTorch={torch}
//             onCameraReady={() => {
//               setCameraReady(true);
//               setErrorText('');
//             }}
//             onMountError={(e) => {
//               setMountError(e.message ?? 'Camera failed to start');
//               setScanState('error');
//               setErrorText(e.message ?? 'Camera failed to start');
//             }}
//           />
//         ) : (
//           <View className="flex-1 items-center justify-center bg-white px-8">
//             <StatusBar barStyle="dark-content" />
//             <Text className="mb-3 text-2xl font-semibold text-neutral-900">Camera Access</Text>
//             <Text className="mb-8 text-center text-base leading-6 text-neutral-500">
//               We need camera access to scan your IBAN.
//             </Text>
//             <TouchableOpacity
//               className="mb-4 rounded-full bg-lime-300 px-12 py-4"
//               onPress={requestPermission}
//               activeOpacity={0.8}>
//               <Text className="text-base font-semibold text-neutral-900">Allow Camera</Text>
//             </TouchableOpacity>
//             <TouchableOpacity className="px-6 py-3" onPress={onClose} activeOpacity={0.7}>
//               <Text className="text-base text-neutral-500">Cancel</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {permission?.granted && (
//           <>
//             {/* Subtle overlay so it never looks like a blank black screen */}
//             <View className="absolute inset-0 border border-white/10" />

//             <View className="absolute inset-0 items-center justify-center">
//               <View className="absolute inset-0 bg-black/55" />
//               <View
//                 style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT }}
//                 className="rounded-2xl border-2 border-white/90 bg-transparent"
//               />
//             </View>

//             <View className="absolute left-0 right-0 top-14 flex-row items-center justify-between px-5">
//               <TouchableOpacity
//                 className="h-12 w-12 items-center justify-center rounded-full bg-black/40"
//                 onPress={onClose}
//                 activeOpacity={0.7}>
//                 <X size={24} weight="bold" color="#ffffff" />
//               </TouchableOpacity>

//               <TouchableOpacity
//                 className="h-12 items-center justify-center rounded-full bg-black/40 px-4"
//                 onPress={() => setTorch((prev) => !prev)}
//                 activeOpacity={0.7}>
//                 <Text className="text-sm font-semibold text-white">
//                   {torch ? 'Torch On' : 'Torch Off'}
//                 </Text>
//               </TouchableOpacity>
//             </View>

//             <View className="absolute bottom-0 left-0 right-0 items-center px-6 pb-10">
//               <Text className="text-base font-medium text-white">
//                 Align the IBAN inside the frame
//               </Text>
//               {!cameraReady && !mountError && (
//                 <Text className="mt-2 text-sm text-white/80">Starting camera…</Text>
//               )}
//               {scanState === 'error' && errorText.length > 0 && (
//                 <Text className="mt-2 text-sm text-white/80">{errorText}</Text>
//               )}
//               {cameraReady && !mountError && scanState !== 'error' && (
//                 <Text className="mt-2 text-sm text-white/80">
//                   Hold steady and use good lighting.
//                 </Text>
//               )}
//             </View>
//           </>
//         )}
//       </View>
//     </Modal>
//   );
// }
