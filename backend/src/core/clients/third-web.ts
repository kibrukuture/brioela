import { createThirdwebClient, type ThirdwebClient, Engine } from 'thirdweb';

function createThirdClient() {
	return createThirdwebClient({
		secretKey: process.env.THIRD_WEB_API_SECRET,
	});
}

let thirdWebClient: ThirdwebClient | null = null;

export function getThirdWebClient() {
	if (thirdWebClient) return thirdWebClient;
	thirdWebClient = createThirdClient();
	return thirdWebClient;
}

// wallet for server-side operations
function createServerWallet() {
	return Engine.serverWallet({
		client: getThirdWebClient(),
		address: process.env.THIRD_WEB_SERVER_WALLET_ADDRESS,
	});
}

let serverWallet: Engine.ServerWallet | null = null;

export function getServerWallet() {
	if (serverWallet) return serverWallet;
	serverWallet = createServerWallet();
	return serverWallet;
}
