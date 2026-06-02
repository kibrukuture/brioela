import { createThirdwebClient } from 'thirdweb';

const clientId = process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
  throw new Error('Missing EXPO_PUBLIC_THIRDWEB_CLIENT_ID');
}

export const thirdwebClient = createThirdwebClient({
  clientId,
});
