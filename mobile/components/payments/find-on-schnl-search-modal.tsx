import {
  Image,
  InteractionManager,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MagnifyingGlass, X, CaretRight } from 'phosphor-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller, type Control } from 'react-hook-form';
import type { UserSearchResponse } from '@brioela/shared/validators/user-search.validator';
import { useMemo, useRef } from 'react';

interface FindOnSchnlSearchModalProps {
  visible: boolean;
  onClose: () => void;
  control: Control<{ query: string }>;
  modalInputRef: React.RefObject<TextInput | null>;
  searchQuery: string;
  onChangeQuery: (query: string) => void;
  debouncedQuery: string;
  isLoading: boolean;
  error: unknown;
  data: UserSearchResponse | undefined;
  onSelectUser: (user: {
    id: string;
    schnlTag: string;
    name: string;
    profilePicture?: string | null;
  }) => void;
}

export function FindOnSchnlSearchModal({
  visible,
  onClose,
  control,
  modalInputRef,
  searchQuery,
  onChangeQuery,
  debouncedQuery,
  isLoading,
  error,
  data,
  onSelectUser,
}: FindOnSchnlSearchModalProps) {
  const insets = useSafeAreaInsets();
  const stableTopInsetRef = useRef<number>(insets.top);
  if (stableTopInsetRef.current === 0 && insets.top > 0) {
    stableTopInsetRef.current = insets.top;
  }

  const headerPaddingTop = useMemo(() => stableTopInsetRef.current + 8, []);

  const handleModalShow = () => {
    InteractionManager.runAfterInteractions(() => {
      modalInputRef.current?.focus();
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      transparent={false}
      onShow={handleModalShow}
      onRequestClose={onClose}>
      <SafeAreaView edges={[]} className="flex-1 bg-white">
        <View className="flex-1">
          <View className="px-5" style={{ paddingTop: headerPaddingTop }}>
            <View className="flex-row items-center justify-end">
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                <X size={18} weight="bold" color="#171717" />
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAwareScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
            <View>
              <View className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                <View className="flex-row items-center gap-3">
                  <MagnifyingGlass size={18} weight="bold" color="#737373" />
                  <Controller
                    control={control}
                    name="query"
                    render={({ field: { value } }) => (
                      <TextInput
                        ref={modalInputRef}
                        value={value}
                        onChangeText={onChangeQuery}
                        placeholder="SchnlTag, email, phone"
                        className="flex-1 text-base text-neutral-900"
                        placeholderTextColor="#A3A3A3"
                      />
                    )}
                  />
                </View>
              </View>

              {searchQuery.length > 0 && (
                <View className="mt-6">
                  {isLoading && (
                    <View className="rounded-2xl border border-neutral-100 bg-white p-5">
                      <Text className="text-sm text-neutral-600">Searching…</Text>
                    </View>
                  )}

                  {!isLoading && !!error && (
                    <View className="rounded-2xl border border-neutral-100 bg-white p-5">
                      <Text className="text-sm text-neutral-600">Couldn’t load results.</Text>
                    </View>
                  )}

                  {!isLoading &&
                    !error &&
                    (data?.results.length ?? 0) === 0 &&
                    debouncedQuery.length > 0 && (
                      <View className="rounded-2xl border border-neutral-100 bg-white p-5">
                        <Text className="text-base font-semibold text-neutral-900">No results</Text>
                        <Text className="mt-2 text-sm leading-relaxed text-neutral-500">
                          We couldn’t find anyone matching that search. Double-check the spelling
                          and try a different identifier. If the person has disabled “Find me on
                          Schnl”, they won’t appear here.
                        </Text>
                      </View>
                    )}

                  {!isLoading && !error && (data?.results.length ?? 0) > 0 && (
                    <View className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
                      {data?.results.map((result) => (
                        <TouchableOpacity
                          key={result.id}
                          onPress={() => onSelectUser(result)}
                          activeOpacity={0.8}
                          className="flex-row items-center gap-4 border-b border-neutral-100 px-5 py-4">
                          {result.profilePicture ? (
                            <Image
                              source={{ uri: result.profilePicture }}
                              className="h-12 w-12 rounded-full bg-neutral-200"
                            />
                          ) : (
                            <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-200">
                              <Text className="text-base font-semibold text-neutral-700">
                                {result.name.slice(0, 1)}
                              </Text>
                            </View>
                          )}

                          <View className="flex-1">
                            <Text className="text-base font-semibold text-neutral-900">
                              {result.name}
                            </Text>
                            <Text className="mt-0.5 text-sm text-neutral-500">
                              @{result.schnlTag}
                            </Text>
                          </View>

                          <CaretRight size={18} weight="bold" color="#A3A3A3" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </KeyboardAwareScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
