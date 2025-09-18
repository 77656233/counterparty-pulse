// Utility for address burn detection & formatting
// calcAddressBurns(holders:Array, { divisible:Boolean, burnPatterns:Array }) -> Number (raw token amount)
// formatAssetQuantity(value, divisible) -> String
// Optional: inferBurnsFromInfo(info, stats) -> { addressBurns, availableSupply }

import { burnAddressPatterns } from './burnConfig.js';

export function calcAddressBurns(holders, { divisible = false, burnPatterns = burnAddressPatterns } = {}) {
  if (!Array.isArray(holders)) return 0;
  return holders.filter(h => {
    if (!h.address) return false;
    const addr = String(h.address).toLowerCase();
    return burnPatterns.some(p => addr.includes(p));
  }).reduce((sum, h) => {
    let q = parseFloat(h.estimated_value?.quantity || h.quantity || 0);
    if (!Number.isFinite(q)) q = 0;
    if (divisible) q = q / 1e8;
    return sum + q;
  }, 0);
}

export function formatAssetQuantity(val, divisible) {
  const n = Number(val) || 0;
  if (divisible) return n.toFixed(8);
  return n.toFixed(0);
}

export function inferBurnData({ supply, burns, holders, divisible }) {
  const addressBurns = calcAddressBurns(holders, { divisible });
  // NOTE: If supply already equals (issued - burns) do NOT subtract burns again here.
  const availableSupply = (Number(supply) || 0) - (Number(burns) || 0) - addressBurns;
  return { addressBurns, availableSupply };
}
