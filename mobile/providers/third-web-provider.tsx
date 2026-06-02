import React, { useEffect, useState } from 'react';
import {
  ThirdwebProvider,
  // useAutoConnect,
  useActiveWallet,
  useActiveAccount,
  AutoConnect,
} from 'thirdweb/react';
import { inAppWallet } from 'thirdweb/wallets';
import { polygon } from 'thirdweb/chains';
import { thirdwebClient } from '@/lib/clients/thirdweb';
import { useAuthStore } from '@/stores/account/use-auth-store';
import { useNetworkStore } from '@/stores/account/use-network-store';

interface Props {
  children: React.ReactNode;
}

const wallets = [inAppWallet()];

function ThirdwebAutoConnect() {
  // useAutoConnect({
  //   client: thirdwebClient,
  //   wallets,
  //   accountAbstraction: {
  //     chain: polygon,
  //     sponsorGas: true,
  //   },
  //   appMetadata: {
  //     name: 'Schnl',
  //     url: 'https://schnl.com',
  //     description: 'Schnl Banking App',
  //   },
  // });
  // return null;

  return (
    <AutoConnect
      wallets={wallets}
      client={thirdwebClient}
      accountAbstraction={{
        chain: polygon,
        sponsorGas: true,
      }}
      appMetadata={{
        name: 'Schnl',
        url: 'https://schnl.com',
        description: 'Schnl Banking App',
      }}
    />
  );
}

function AutoConnectGuard() {
  const userEmail = useAuthStore((s) => s.user?.email);
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const initialize = useNetworkStore((s) => s.initialize);
  const cleanup = useNetworkStore((s) => s.cleanup);
  const isConnected = useNetworkStore((s) => s.isConnected);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    initialize();
    return () => cleanup();
  }, [initialize, cleanup]);

  useEffect(() => {
    setEnabled(Boolean(userEmail) && isConnected && !wallet && !account);
  }, [userEmail, isConnected, wallet, account]);

  if (!enabled) return null;
  return <ThirdwebAutoConnect />;
}

export function ThirdWebProvider({ children }: Props) {
  return (
    <ThirdwebProvider>
      {/* <AutoConnectGuard /> */}
      {children}
    </ThirdwebProvider>
  );
}
