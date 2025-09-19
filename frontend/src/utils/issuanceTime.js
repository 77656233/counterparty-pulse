// Utility to determine the first issuance timestamp
// getFirstIssuanceTimestamp(asset, chainType) -> ms | null

export function getFirstIssuanceTimestamp(asset, chainType) {
  if (!asset || !asset.data) return null;
  
  if (chainType === 'counterparty') {
    // Try info first, then fallback to issuances calculation
    let ts = asset.data.counterparty?.info?.first_issuance_block_time;
    if (!ts) {
      // Fallback: calculate from issuances
      const issuances = asset.data.counterparty?.issuances || [];
      if (issuances.length > 0) {
        const sortedIssuances = [...issuances].sort((a, b) => {
          const timeA = a.block_time || a.confirmed_at || 0;
          const timeB = b.block_time || b.confirmed_at || 0;
          return timeA - timeB;
        });
        ts = sortedIssuances[0]?.block_time || sortedIssuances[0]?.confirmed_at;
      }
    }
    return ts ? ts * 1000 : null;
  }
  
  if (chainType === 'classic') {
    // Calculate from issuances (Classic doesn't have first_issuance_block_time in info)
    const issuances = asset.data.classic?.issuances || [];
    if (issuances.length === 0) return null;
    
    const sortedIssuances = [...issuances].sort((a, b) => {
      const timeA = a.block_time || a.confirmed_at || a.timestamp || 0;
      const timeB = b.block_time || b.confirmed_at || b.timestamp || 0;
      return timeA - timeB;
    });
    
    const firstIssuance = sortedIssuances[0];
    const ts = firstIssuance?.block_time || firstIssuance?.confirmed_at || firstIssuance?.timestamp;
    return ts ? ts * 1000 : null;
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
