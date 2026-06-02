export function getStripePublishableKey(): string {
  const key = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  }
  return key;
}
