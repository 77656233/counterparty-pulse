// Utility für Asset-Issuance-Berechnung
import Decimal from "decimal.js";

export function getCounterpartyStats(chain) {
  const issuances = chain.issuances || [];
  let sum = new Decimal(0);
  let firstIssuanceTime = null;
  const divisible = chain.divisible === true;
  for (let i = 0; i < issuances.length; i++) {
    const issuance = issuances[i];
    if (issuance.status === "valid") {
      if (firstIssuanceTime === null && issuance.block_time) {
        firstIssuanceTime = issuance.block_time;
      }
      sum = sum.plus(new Decimal(issuance.quantity));
      if (issuance.locked === true) break;
    }
  }
  if (divisible) {
    sum = sum.div(1e8);
  }
  const supply = new Decimal(chain.supply || 0);
  return {
    issuancesCount: sum.isZero() ? "0" : formatQuantity(sum, divisible),
    burns: sum.isZero() ? "0" : formatQuantity(sum.minus(supply), divisible),
    locked: chain.locked,
    divisible,
    firstIssuanceTime,
  };
}

export function getClassicStats(chain) {
  const issuances = chain.issuances || [];
  let sum = new Decimal(0);
  let firstIssuanceTime = null;
  const divisible = chain.divisible === true;
  for (let i = 0; i < issuances.length; i++) {
    const issuance = issuances[i];
    if (issuance.status === "valid") {
      if (firstIssuanceTime === null && issuance.timestamp) {
        firstIssuanceTime = issuance.timestamp;
      }
      sum = sum.plus(new Decimal(issuance.quantity));
      if (issuance.locked === true) break;
    }
  }
  const supply = new Decimal(chain.supply || 0);
  return {
    issuancesCount: sum.isZero() ? "0" : formatQuantity(sum, divisible),
    burns: sum.isZero() ? "0" : formatQuantity(sum.minus(supply), divisible),
    locked: chain.locked,
    divisible,
    firstIssuanceTime,
  };
}

function formatQuantity(q, divisible) {
  if (divisible) {
    return new Decimal(q).toFixed(8).replace(/\.0+$/, "").replace(/(\.[0-9]*[1-9])0+$/, "$1");
  } else {
    return new Decimal(q).toFixed(0);
  }
}
