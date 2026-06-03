import type React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useUser } from '@/network/users/use-user';
import { LegalNameForm } from '@/components/kyc/legal-name-form';
import { VerificationStart } from '@/components/kyc/verification-start';

export default function KYCScreen(): React.ReactElement {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1D1D1D" />
      </View>
    );
  }

  // Strict Flow: Collect Legal Name FIRST
  if (!user?.firstName || !user?.lastName) {
    return <LegalNameForm />;
  }

  // Once name is secured, show Verification Start
  return <VerificationStart />;
}
