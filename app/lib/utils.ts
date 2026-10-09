export function formatAddr(addr: string, chars: number = 8): string {
  if (addr.length <= chars * 2) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function formatSol(lamports: bigint | number): string {
  const sol = typeof lamports === "bigint"
    ? Number(lamports) / 1_000_000_000
    : (lamports / 1_000_000_000);
  return sol.toFixed(4);
}

export function formatTokens(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`;
  return amount.toFixed(2);
}
