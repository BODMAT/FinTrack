export function formatAmount(amount: string | number): string {
  const n = typeof amount === "number" ? amount : parseFloat(amount);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}
