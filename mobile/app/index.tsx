import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/account/use-auth-store';
import { ActivityIndicator, View } from 'react-native';
export default function Index() {
  const { isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }
  if (user) {
    return <Redirect href="/tabs/home" />;
  }
  return <Redirect href="/onboarding" />;
}
