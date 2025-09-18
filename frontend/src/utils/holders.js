// Utility for holder processing
// prepareHolders(list, { divisible }) -> sorted & formatted holders

export function prepareHolders(list, { divisible = false, fromAtomic = false } = {}) {
  if (!Array.isArray(list)) return [];
  // First pass: compute normalized quantities
  const withQuantities = list.map(h => {
    let q = parseFloat(h.estimated_value?.quantity ?? h.quantity ?? 0) || 0;
    if (fromAtomic && divisible) q = q / 1e8;
    return { ...h, _quantity: q };
  }).filter(h => h._quantity > 0);

  // Sort by quantity desc
  withQuantities.sort((a, b) => b._quantity - a._quantity);

  // Compute total for percentage if not provided
  const total = withQuantities.reduce((sum, h) => sum + (Number(h._quantity) || 0), 0) || 1;
  const pctDecimals = divisible ? 8 : 2;

  return withQuantities.map(h => {
    let pctVal = parseFloat(h.estimated_value?.percentage ?? h.percentage);
    if (!isFinite(pctVal)) {
      pctVal = (Number(h._quantity) || 0) / total * 100;
    }
    const pct = pctVal.toFixed(pctDecimals);
    return { ...h, _percentage: pct };
  });
}
