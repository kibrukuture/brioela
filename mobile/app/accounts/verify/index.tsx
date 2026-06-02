'use client';

import type React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, ArrowDown, Tray, ArrowsClockwise, Briefcase, Question } from 'phosphor-react-native';

interface BenefitItem {
  icon: React.ReactNode;
  text: string;
  hasInfo?: boolean;
}

export default function GetAccountDetailsScreen(): React.ReactElement {
  const router = useRouter();
  const { currency } = useLocalSearchParams<{ currency: string }>();

  const handleClose = (): void => {
    router.back();
  };

  const handleContinue = (): void => {
    router.replace(`/accounts/details/${currency}`);
  };

  const benefits: BenefitItem[] = [
    {
      icon: <ArrowDown size={24} color="#1c1917" />,
      text: 'Get paid in 20 currencies',
      hasInfo: true,
    },
    {
      icon: <Tray size={24} color="#1c1917" />,
      text: 'Receive transfers, salary or pension',
    },
    {
      icon: <ArrowsClockwise size={24} color="#1c1917" />,
      text: 'Pay bills via Direct Debit',
    },
    {
      icon: <Briefcase size={24} color="#1c1917" />,
      text: 'Connect with services like Stripe',
    },
  ];

  return (
    <SafeAreaView className="flex-1">
      {/* Header */}
      <View className="px-4 py-3">
        <TouchableOpacity
          onPress={handleClose}
          className="h-11 w-11 items-center justify-center rounded-full bg-stone-100">
          <X size={22} color="#1c1917" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 px-6">
        {/* Illustration */}
        <View className="mb-8 mt-8 items-center">
          <Image
            source={{ uri: '/teal-document-cards-illustration.jpg' }}
            className="h-44 w-48"
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text className="mb-10 text-center font-parafina text-3xl font-bold text-stone-900">
          GET ACCOUNT DETAILS{'\n'}FROM SCHNL
        </Text>

        {/* Benefits */}
        <View className="gap-5">
          {benefits.map((item, index) => (
            <View key={index} className="flex-row items-center">
              <View className="w-10">{item.icon}</View>
              <Text className="ml-2 flex-1 text-base text-stone-900">{item.text}</Text>
              {item.hasInfo && (
                <TouchableOpacity className="p-1">
                  <Question size={20} color="#a8a29e" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Continue Button */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          onPress={handleContinue}
          className="items-center rounded-full bg-lime-300 py-4">
          <Text className="text-base font-semibold text-stone-900">Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
