import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Burnt from 'burnt';
import * as StoreReview from 'expo-store-review';
import {
  Camera,
  Bell,
  Headset,
  FileText,
  ShieldCheck,
  CreditCard,
  Gauge,
  Globe,
  User,
  Users,
  Info,
  Wallet,
  Star,
  Bug,
  XCircle,
  LogOut,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/account/use-auth-store';
import { BackButton } from '@/components/ui/back-button';
import { useUser } from '@/network/users/use-user';
import React from 'react';
import { SealCheck } from 'phosphor-react-native';
import { Sheet, useSheetRef } from '@/components/ui/sheet';
import * as ImagePicker from 'expo-image-picker';
import { optimizeImage } from '@/lib/files/optimize-image';
import { useUpdateProfilePicture } from '@/network/users/use-update-profile-picture';
import { useCreateSupportChat } from '@/features/support/hooks/use-create-support-chat';
import { MenuSectionView } from '@/components/profile/menu-section-view';
import { CopyButton } from '@/components/profile/copy-button';

// Types
interface MenuItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function ProfileScreen() {
  const { data: user } = useUser();

  const createSupportChat = useCreateSupportChat();

  const sheetRef = useSheetRef();
  const snapPoints = React.useMemo(() => ['20%'], []);
  const onClose = () => sheetRef.current?.dismiss();

  const onLogout = async () => {
    Alert.alert('Are you sure?', 'You will be signed out of your account.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            useAuthStore.getState().signOut();
          } catch (error) {
            console.error('Error logging out:', error);
            Alert.alert('Logout Failed', 'Failed to log out. Please try again.', [{ text: 'OK' }]);
          }
        },
      },
    ]);
  };

  const onRateUs = async () => {
    try {
      const hasAction = await StoreReview.hasAction();
      if (hasAction) {
        await StoreReview.requestReview();
        return;
      }

      const url = StoreReview.storeUrl();
      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return;
        }
      }

      Burnt.alert({
        title: 'Rate Schnl',
        message: 'Unable to open the review page right now.',
        preset: 'error',
      });
    } catch (error: unknown) {
      let message = 'Unable to open the review page right now.';
      if (error instanceof Error) {
        message = error.message;
      }
      Burnt.alert({
        title: 'Rate Schnl',
        message,
        preset: 'error',
      });
    }
  };

  const iconColor = '#171717';
  const iconSize = 22;

  const menuSections: MenuSection[] = [
    {
      title: 'Your account',
      items: [
        {
          id: 'inbox',
          icon: <Bell size={iconSize} color={iconColor} />,
          title: 'Inbox',
          onPress: () => {
            router.push('/profile/inbox');
          },
        },
        {
          id: 'help',
          icon: <Headset size={iconSize} color={iconColor} />,
          title: 'Customer support',
          subtitle: 'Chat with our team',
          onPress: () => {
            createSupportChat();
          },
        },
        {
          id: 'statements',
          icon: <FileText size={iconSize} color={iconColor} />,
          title: 'Statements and reports',
          onPress: () => router.push('/bank-statements'),
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          id: 'security',
          icon: <ShieldCheck size={iconSize} color={iconColor} />,
          title: 'Security and privacy',
          subtitle: 'Change your security and privacy settings',
          onPress: () => {
            router.push('/profile/security');
          },
        },
        {
          id: 'notifications',
          icon: <Bell size={iconSize} color={iconColor} />,
          title: 'Notifications',
          subtitle: 'Customise how you get updates',
          onPress: () => {
            router.push('/profile/notifications');
          },
        },
        {
          id: 'payment',
          icon: <CreditCard size={iconSize} color={iconColor} />,
          title: 'Payment methods',
          subtitle: 'Manage saved cards and bank accounts that are linked to this account',
          onPress: () => {},
        },
        {
          id: 'limits',
          icon: <Gauge size={iconSize} color={iconColor} />,
          title: 'Limits',
          subtitle: 'Manage your transfer and card limits',
          onPress: () => {
            router.push({ pathname: '/profile/limits' });
          },
        },
        {
          id: 'language',
          icon: <Globe size={iconSize} color={iconColor} />,
          title: 'Language and appearance',
          subtitle: 'Customise language settings and which theme is used',
          onPress: () => {
            router.push('/profile/language-and-appearance');
          },
        },
        {
          id: 'personal',
          icon: <User size={iconSize} color={iconColor} />,
          title: 'Personal details',
          subtitle: 'View your legal name and address',
          onPress: () => {
            router.push('/profile/personal-details');
          },
        },
        {
          id: 'communication-code',
          icon: <ShieldCheck size={iconSize} color={iconColor} />,
          title: 'Communication code',
          subtitle: 'Set a code to verify emails from Schnl',
          onPress: () => {
            router.push('/profile/communication-code');
          },
        },
      ],
    },
    {
      title: 'Actions and agreements',
      items: [
        {
          id: 'agreements',
          icon: <Info size={iconSize} color={iconColor} />,
          title: 'Our agreements',
          onPress: () => {
            router.push({ pathname: '/profile/our-agreements' });
          },
        },
        {
          id: 'manage-wallet',
          icon: <Wallet size={iconSize} color={iconColor} />,
          title: 'Manage wallet',
          subtitle: 'View addresses and wallet options',
          onPress: () => {
            // TODO: Brioela wallet navigation
          },
        },
        {
          id: 'rate',
          icon: <Star size={iconSize} color={iconColor} />,
          title: 'Rate us',
          subtitle: 'Write a review in the app store',
          onPress: onRateUs,
        },
        {
          id: 'bug',
          icon: <Bug size={iconSize} color={iconColor} />,
          title: 'Report a bug',
          onPress: () => {},
        },
        {
          id: 'close',
          icon: <XCircle size={iconSize} color={iconColor} />,
          title: 'Delete account',
          subtitle: 'Permanently delete your account',
          onPress: () => {
            router.push({
              pathname: '/profile/delete-account',
            });
          },
        },
        {
          id: 'logout',
          icon: <LogOut size={iconSize} color={iconColor} />,
          title: 'Log out',
          onPress: onLogout,
        },
      ],
    },
  ];

  // Display helper - formats tag with @ if present
  const displaySchnlTag = user?.brioelaTag
    ? user.brioelaTag.startsWith('@')
      ? user.brioelaTag
      : `@${user.brioelaTag}`
    : '@set-schnl-tag';

  const { mutateAsync: updateProfilePicture, isPending: isUpdatingProfilePicture } =
    useUpdateProfilePicture();

  const onSelectAndUploadProfilePicture = async (): Promise<void> => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to change your photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset?.uri) {
        throw new Error('No image selected');
      }

      const optimized = await optimizeImage(asset.uri, { maxWidth: 250, compression: 0.6 });

      const formData = new FormData();
      formData.append('file', {
        uri: optimized.uri,
        name: 'profile-picture.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);

      await updateProfilePicture(formData);

      Burnt.toast({
        title: 'Profile photo updated',
        preset: 'done',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile photo';
      Alert.alert('Upload Failed', message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}

      <View className="flex-row items-center justify-between">
        <BackButton />
        {user?.bankingKycStatus === 'pending' && (
          <View className="flex-row items-center justify-end px-5 py-3">
            <TouchableOpacity
              onPress={() => {
                router.push('/kyc');
              }}
              className="rounded-full border border-neutral-200 px-5 py-3"
              activeOpacity={0.7}>
              <Text className="text-base font-medium text-neutral-900">Verify your account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10"
        showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="mb-2 mt-4 items-center">
          {/* Avatar with camera button */}
          <View className="relative">
            <Image
              source={{ uri: user?.profilePicture || 'https://i.pravatar.cc/150?img=68' }}
              style={{ width: 112, height: 112, borderRadius: 56 }}
            />
            <TouchableOpacity
              onPress={onSelectAndUploadProfilePicture}
              disabled={isUpdatingProfilePicture}
              className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-lime-400"
              activeOpacity={0.8}>
              <Camera size={18} color="#171717" />
            </TouchableOpacity>
          </View>

          {/* Name - using font-parafina */}
          <Text className="mt-5 text-center font-parafina text-3xl tracking-wide text-neutral-900">
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`.toUpperCase()
              : 'NO NAME'}
          </Text>

          {/* Account type - dynamic based on customer type */}
          <View className="flex-row items-center gap-2">
            <Text className="mt-1 text-base text-neutral-500">Personal account</Text>
            <Pressable onPress={() => sheetRef.current?.present()}>
              <SealCheck size={20} color="#171717" />
            </Pressable>
          </View>

          {/* SchnlTag badge */}
          <Pressable
            onPress={() => {
              if (user?.brioelaTag) {
                router.push('/profile/schnl-tag');
              } else {
                router.push('/profile/create-schnl-tag');
              }
            }}
            className="mt-4 flex-row items-center rounded-full bg-neutral-100 px-4 py-2.5">
            <Image source={require('@/assets/media/favicon.png')} className="h-5 w-5" />
            <Text className="ml-2 text-sm font-medium text-neutral-900">{displaySchnlTag}</Text>
          </Pressable>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <MenuSectionView key={section.title} section={section} />
        ))}

        {/* Footer Info */}
        <View className="mt-10 border-t border-neutral-100 pt-6">
          {/* Membership number */}
          <View className="mb-6 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium text-neutral-900">Your membership ID</Text>
              <Text className="mt-0.5 text-sm text-neutral-500">
                {user?.membershipNumber || 'Not assigned'}
              </Text>
            </View>
            <CopyButton value={user?.membershipNumber} />
          </View>

          <View className="mb-8 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium text-neutral-900">Email</Text>
              <Text className="mt-0.5 text-sm text-neutral-500">
                {user?.email || 'Not available'}
              </Text>
            </View>
            <CopyButton value={user?.email} />
          </View>
        </View>
      </ScrollView>

      <Sheet ref={sheetRef} snapPoints={snapPoints} onDismiss={onClose} enablePanDownToClose>
        <View className="flex-1 items-center px-6">
          <Text className="mt-2 text-center font-parafina text-2xl font-bold text-[#1D1D1D]">
            KYC verification
          </Text>
          <View className="mt-6">
            <Text className="text-base font-medium text-neutral-900">
              Your account is verified and ready to use.
            </Text>
          </View>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
