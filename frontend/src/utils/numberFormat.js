// Central number / quantity formatting utilities
export function formatQuantity(val, { divisible = false, decimals = 8, trim = true } = {}) {
  const n = Number(val) || 0;
  if (divisible) {
    let out = n.toFixed(decimals);
    if (trim) out = out.replace(/\.0+$/, '').replace(/(\.[0-9]*[1-9])0+$/, '$1');
    return out;
  }
  return n.toFixed(0);
}

export function toDisplayNumber(val) {
  const n = Number(val) || 0;
  return n.toLocaleString();
}
