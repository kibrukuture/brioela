import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui/back-button';
import { useUser } from '@/network/users/use-user';
import { useRouter } from 'expo-router';
import * as Burnt from 'burnt';
import { useCheckSchnlTag } from '@/network/users/use-check-schnl-tag';
import { useSetSchnlTag } from '@/network/users/use-update-user';
import { validateSchnlTag } from '@brioela/shared/utils/schnl-tag';
import { useDebounce } from 'use-debounce';
import { TriangleAlert } from 'lucide-react-native';
import { PLACEHOLDERS } from '@brioela/shared/constants';

export default function CreateSchnlTagScreen() {
  const router = useRouter();
  const { data: user } = useUser();
  const setSchnlTagMutation = useSetSchnlTag();

  // Local state
  const [tag, setTag] = useState(user?.schnlTag || '');
  const [localError, setLocalError] = useState<string | undefined>(undefined);

  // Debounce tag for API check
  const [debouncedTag] = useDebounce(tag, 500);

  // Query for checking availability (only runs if tag changed & valid)
  const {
    data: checkResult,
    isLoading: isChecking,
    error: checkError,
  } = useCheckSchnlTag(debouncedTag);

  // Validation Effect
  useEffect(() => {
    // 1. Basic format check
    const validation = validateSchnlTag(tag);
    if (!validation.valid && tag.length > 0) {
      setLocalError(validation.error);
      return;
    }
    setLocalError(undefined);
  }, [tag]);

  const isTagValid =
    !localError && !checkError && tag.length >= 3 && checkResult?.available !== false;
  const isTagAvailable =
    checkResult?.available === true && !localError && !checkError && tag.length >= 3;

  const performSave = async () => {
    try {
      await setSchnlTagMutation.mutateAsync({ schnlTag: tag });
      Burnt.toast({ title: 'SchnlTag updated', preset: 'done' });
      router.back();
    } catch (e: unknown) {
      if (e instanceof Error) {
        setLocalError(e.message);
      } else {
        setLocalError('Failed to update tag');
      }
    }
  };

  const handleSave = () => {
    if (!isTagValid) return;

    Alert.alert(
      'Set SchnlTag?',
      'This is a one-time action. You cannot change your SchnlTag later. Please check for spelling errors.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          style: 'default',
          onPress: performSave,
        },
      ]
    );
  };

  const getSmartPlaceholder = () => {
    if (!user) return PLACEHOLDERS.FIRST_NAME.toLowerCase();

    // 1. Try first name (Usually the friendliest)
    const firstName = user.firstName?.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (firstName && firstName.length > 2) return firstName;

    // 2. Try email handle (if not private relay)
    if (user.email && !user.email.includes('privaterelay.appleid.com')) {
      const emailHandle = user.email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      if (emailHandle && emailHandle.length > 2) return emailHandle;
    }

    return 'schnl.user';
  };

  const placeholder = getSmartPlaceholder();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton />

      <KeyboardAwareScrollView className="flex-1" contentContainerClassName="px-5 pt-6 pb-10">
        {/* Header Description */}
        <Text className="mb-2 text-3xl font-bold text-neutral-900">Choose your SchnlTag</Text>
        <Text className="mb-8 text-base text-neutral-500">
          Your unique tag for sending and receiving money. Make it memorable.
        </Text>

        {/* Warning Banner */}
        <View className="mb-8 flex-row items-start rounded-xl bg-amber-50 p-4">
          <TriangleAlert size={20} color="#d97706" className="mt-0.5" />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-medium text-amber-800">One-time setup</Text>
            <Text className="mt-1 text-sm text-amber-700">
              You cannot change your SchnlTag once set. Please double-check for any typos before
              confirming.
            </Text>
          </View>
        </View>

        {/* Input Field */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-medium text-neutral-900">SchnlTag</Text>
          <View
            className={`h-14 flex-row items-center rounded-xl border px-4 ${localError || checkError || checkResult?.available === false ? 'border-red-500 bg-red-50' : 'border-neutral-200 bg-neutral-50'}`}>
            <Text className="mr-1 text-lg text-neutral-500">@</Text>
            <TextInput
              className="h-full flex-1 text-lg font-medium text-neutral-900"
              value={tag}
              onChangeText={(t) => {
                setTag(t.toLowerCase());
              }}
              placeholder={placeholder}
              placeholderTextColor="#a3a3a3"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isChecking && <ActivityIndicator size="small" color="#666" />}
            {!isChecking && isTagAvailable && (
              <View className="h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <Text className="text-xs text-green-600">✓</Text>
              </View>
            )}
          </View>

          {/* Error / Status Message */}
          {localError && <Text className="mt-2 text-sm text-red-500">{localError}</Text>}
          {checkError && !localError && (
            <Text className="mt-2 text-sm text-red-500">
              {(checkError as Error).message || 'Error checking availability'}
            </Text>
          )}
          {!localError && !checkError && tag === user?.schnlTag && tag.length > 0 && (
            <Text className="mt-2 text-sm text-neutral-400">This is your current tag</Text>
          )}
          {!localError &&
            !checkError &&
            checkResult?.available === false &&
            tag !== user?.schnlTag && (
              <Text className="mt-2 text-sm text-red-500">This tag is already taken</Text>
            )}
        </View>
      </KeyboardAwareScrollView>

      {/* Save Button Footer */}
      <KeyboardStickyView className="border-t border-neutral-100 bg-white p-5">
        <TouchableOpacity
          onPress={handleSave}
          disabled={
            setSchnlTagMutation.isPending ||
            !!localError ||
            tag.length < 3 ||
            checkResult?.available === false ||
            tag === user?.schnlTag
          }
          className={`w-full items-center justify-center rounded-full py-4 ${
            !localError &&
            tag.length >= 3 &&
            checkResult?.available !== false &&
            tag !== user?.schnlTag
              ? 'bg-neutral-900'
              : 'bg-neutral-200'
          }`}>
          {setSchnlTagMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              className={`text-base font-semibold ${
                !localError &&
                tag.length >= 3 &&
                checkResult?.available !== false &&
                tag !== user?.schnlTag
                  ? 'text-white'
                  : 'text-neutral-400'
              }`}>
              Save SchnlTag
            </Text>
          )}
        </TouchableOpacity>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
