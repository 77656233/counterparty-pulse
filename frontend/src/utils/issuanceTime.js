// Utility to determine the first issuance timestamp
// getFirstIssuanceTimestamp(asset, chainType) -> ms | null

export function getFirstIssuanceTimestamp(asset, chainType) {
  if (!asset || !asset.data) return null;
  if (chainType === 'counterparty') {
    const ts = asset.data.counterparty?.first_issuance_block_time;
    return ts ? ts * 1000 : null;
  }
  if (chainType === 'classic') {
    const arr = asset.data.classic?.issuances || [];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const first = arr.reduce((min, curr) => (!min || curr.timestamp < min.timestamp) ? curr : min, null);
    return first?.timestamp ? first.timestamp * 1000 : null;
  }
  return null;
}

// Neutral date formatter used across UI
export function formatLocalUtc(ts) {
  if (!ts) return { local: null, utc: null };
  return {
    local: new Date(ts).toLocaleString(),
    utc: new Date(ts).toISOString()
  };
}

// Backwards-compatible alias
export const formatIssuanceDates = formatLocalUtc;
