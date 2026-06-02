import { WalletActivation } from '@/components/banking/wallet-activation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui/back-button';

export default function WalletActivationScreen() {
  return (
    <SafeAreaView className="flex-1">
      <BackButton />
      <WalletActivation />
    </SafeAreaView>
  );
}
