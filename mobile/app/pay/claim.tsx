// import { useEffect, useState } from 'react';
// import { ActivityIndicator, Text, View } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { useClaimPayRequest } from '@/network/banking/use-claim-pay-request';
// import { BackButton } from '@/components/ui/back-button';

// export default function PayClaimPage() {
//   const router = useRouter();
//   const params = useLocalSearchParams<{ token?: string }>();
//   const token = typeof params.token === 'string' ? params.token : undefined;
//   const [error, setError] = useState<string | null>(null);

//   const claim = useClaimPayRequest();

//   useEffect(() => {
//     if (!token) return;

//     claim.mutate(
//       { token },
//       {
//         onSuccess: (res) => {
//           router.replace({
//             pathname: '/pay/payout-details/[id]',
//             params: { id: res.payRequestId },
//           });
//         },
//         onError: (e: unknown) => {
//           const message = e instanceof Error ? e.message : 'Failed to claim payment';
//           setError(message);
//         },
//       }
//     );
//   }, [token]);

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       <BackButton onPress={() => router.replace('/tabs/home')} />
//       <View className="flex-1 items-center justify-center px-6">
//         {token && !error ? <ActivityIndicator /> : null}
//         <Text className="mt-4 text-center text-sm text-neutral-600">
//           {token && !error && 'Claiming your payment…'}
//           {!token && 'Invalid link'}
//           {error && 'Failed to claim payment'}
//         </Text>
//         {token && claim.isPending ? null : null}
//         {error ? <Text className="mt-4 text-center text-sm text-red-600">{error}</Text> : null}
//       </View>
//     </SafeAreaView>
//   );
// }

import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useClaimPayRequest } from '@/network/banking/use-claim-pay-request';
import { BackButton } from '@/components/ui/back-button';
import { getPayRequest } from '@/network/banking/banking.api';

export default function PayClaimPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token : undefined;

  const claim = useClaimPayRequest();

  useEffect(() => {
    if (!token) return;

    claim.mutate(
      { token },
      {
        onSuccess: async (res) => {
          const payRequestRes = await getPayRequest(res.payRequestId);
          const status = payRequestRes.payRequest.status;
          const payoutDetailsSubmittedAt = payRequestRes.payRequest.payoutDetailsSubmittedAt;

          if (status === 'claimed' && !payoutDetailsSubmittedAt) {
            router.replace({
              pathname: '/pay/payout-details/[id]',
              params: { id: res.payRequestId },
            });
            return;
          }

          router.replace({
            pathname: '/pay/payout-details/confirmation',
            params: { id: res.payRequestId },
          });
        },
      }
    );
  }, [token]);

  const getState = () => {
    if (!token) return { text: 'Invalid claim link', loading: false };
    if (claim.isError) return { text: claim.error.message, loading: false };
    return { text: 'Claiming payment…', loading: true };
  };

  const { text, loading } = getState();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <BackButton onPress={() => router.replace('/tabs/home')} />
      <View className="flex-1 items-center justify-center gap-3 px-6">
        {loading && <ActivityIndicator size="large" />}
        <Text className="text-center font-parafina text-3xl text-neutral-900">{text}</Text>
      </View>
    </SafeAreaView>
  );
}
