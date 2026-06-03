import Align, { AlignEnvironment } from '@tolbel/align';

function createAlignClient(env?: AlignEnvironment) {
	return new Align({
		// apiKey: env === 'sandbox' ? process.env.ALIGNLAB_SANDBOX_API_KEY : process.env.ALIGNLAB_API_KEY,
		// environment: env || 'production',

		apiKey: process.env.ALIGNLAB_SANDBOX_API_KEY,
		environment: 'sandbox',

		// THIS IS FOR CUSTOM BLOCKCHAIN INTERACTION, NOT PART OF ALIGN LAB PACKAGE.
		// blockchain: {
		// 	customRpcUrls: {
		// 		polygon: process.env.POLYGON_ALCHEMY_URL,
		// 	},
		// },
	});
}

let AlignClient: ReturnType<typeof createAlignClient> | null = null;

export default function getAlignClient(env?: AlignEnvironment) {
	if (AlignClient) return AlignClient;
	AlignClient = createAlignClient(env);
	return AlignClient;
}
