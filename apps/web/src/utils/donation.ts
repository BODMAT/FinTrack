export function formatDonationAmount(amountMinor: number, currency: string) {
  const normalized = currency?.toUpperCase() || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalized,
    }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(2)} ${normalized}`;
  }
}
