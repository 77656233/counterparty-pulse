// Utility for asset issuance calculations

import Decimal from "decimal.js";

function parseQuantity(q) {
  if (q === undefined || q === null) return new Decimal(0);
  try {
    return new Decimal(q);
  } catch {
    return new Decimal(0);
  }
}

function formatQuantity(q, divisible) {
  if (divisible) {
    return new Decimal(q).toFixed(8).replace(/\.0+$/, "").replace(/(\.[0-9]*[1-9])0+$/, "$1");
  } else {
    return new Decimal(q).toFixed(0);
  }
}

export function getCounterpartyStats(chain) {
  const issuances = chain.issuances || [];
  const validIssuances = issuances.filter(
    (i) => i.locked === false && i.status === "valid"
  );
  const divisible = chain.divisible === true;
  let issuancesTotal = validIssuances.reduce(
    (sum, i) => sum.plus(parseQuantity(i.quantity)),
    new Decimal(0)
  );
  if (divisible) {
    issuancesTotal = issuancesTotal.div(1e8);
  }
  const supply = new Decimal(chain.supply || 0);
  
  return {
    issuancesCount: formatQuantity(issuancesTotal, divisible),
    burns: formatQuantity(issuancesTotal.minus(supply), divisible),
    locked: chain.locked,
    divisible,
    first_issuance_block_time: chain.first_issuance_block_time, // Kommt direkt aus den info-Daten
  };
}

export function getClassicStats(chain) {
  const issuances = chain.issuances || [];
  const validIssuances = issuances.filter(
    (i) => i.locked === false && i.status === "valid"
  );
  const divisible = chain.divisible === true;
  let issuancesTotal = validIssuances.reduce(
    (sum, i) => sum.plus(parseQuantity(i.quantity)),
    new Decimal(0)
  );
  const supply = new Decimal(chain.supply || 0);
  
  // Calculate first issuance time from issuances data
  let firstIssuanceTime = null;
  if (issuances.length > 0) {
    const sortedIssuances = [...issuances].sort((a, b) => {
      const timeA = a.block_time || a.confirmed_at || 0;
      const timeB = b.block_time || b.confirmed_at || 0;
      return timeA - timeB;
    });
    const firstIssuance = sortedIssuances[0];
    firstIssuanceTime = firstIssuance?.block_time || firstIssuance?.confirmed_at || null;
  }
  
  return {
    issuancesCount: formatQuantity(issuancesTotal, divisible),
    burns: formatQuantity(issuancesTotal.minus(supply), divisible),
    locked: chain.locked,
    divisible,
    first_issuance_block_time: firstIssuanceTime,
  };
}
