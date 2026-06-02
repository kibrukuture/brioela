export function formatAccountIdentifier(params: {
  iban?: string | null;
  accountNumber?: string | null;
  providerId: string;
}): string {
  const raw = (params.iban ?? params.accountNumber ?? params.providerId).replace(/\s+/g, '');
  const last4 = raw.slice(-4);
  return last4 ? `•••• ${last4}` : '—';
}
