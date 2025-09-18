// CounterpartyPulse - Counterparty.io API Handler
const axios = require("axios");

/**
 * Build an endpoint URL from base URL, path template and params.
 * @param {string} baseUrl Base URL of the service
 * @param {string} path Endpoint path with placeholders
 * @param {object} params Params to replace in the path
 * @return {string} Full URL
 */
function buildEndpoint(baseUrl, path, params) {
  let url = path;
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      url = url.replace(`{${key}}`, params[key]);
    }
  }
  return baseUrl + url;
}

/**
 * Fetch asset information from Counterparty.io
 * @param {string} asset Asset name
 * @param {object} config Service configuration
 * @return {Promise<object|null>} Asset data or null on error
 */
async function getAssetInfo(asset, config) {
  const service = config.services.counterparty;
  const endpoint = service.endpoints.assetInfo;
  let url = buildEndpoint(service.baseUrl, endpoint.path, {asset});
  url += "?verbose=true";
  try {
    const response = await axios.get(url);
    const data = response.data && response.data.result ?
      response.data.result : response.data;
    return {
      asset: data.asset,
      asset_id: data.asset_id ? String(data.asset_id) : "",
      asset_longname: data.asset_longname,
      issuer: data.issuer,
      owner: data.owner,
      divisible: data.divisible,
      locked: data.locked,
      supply: data.supply_normalized || data.supply,
      description: data.description,
      first_issuance_block_time: data.first_issuance_block_time || null,
    };
  } catch (error) {
    console.error(
        `Error fetching ${asset} from Counterparty.io:`,
        error.message,
    );
    return null;
  }
}

/**
 * Fetch all issuances for an asset from Counterparty.io
 * @param {string} asset Asset name
 * @param {object} config Service configuration
 * @return {Promise<Array>} List of issuances
 */
async function getAssetIssuances(asset, config) {
  const service = config.services.counterparty;
  const endpoint = service.endpoints.issuances;
  const url = buildEndpoint(service.baseUrl, endpoint.path, {asset});
  console.log("[DEBUG] Issuances URL:", url);
  let results = [];
  let cursor = null;
  do {
    let pageUrl = url + "?limit=100";
    if (cursor) pageUrl += `&cursor=${cursor}`;
    const response = await axios.get(pageUrl);
    const data = response.data.result || [];
    results = results.concat(data);
    cursor = response.data.next_cursor;
  } while (cursor);
  return results;
}

/**
 * Fetch all holders for an asset from Counterparty.io
 * @param {string} asset Asset name
 * @param {object} config Service configuration
 * @return {Promise<Array>} List of holders
 */
async function getAssetHolders(asset, config) {
  const service = config.services.counterparty;
  // Assumption: Endpoint is /v2/assets/{asset}/holders
  const url = `${service.baseUrl}assets/${asset}/holders?limit=100`;
  let results = [];
  let cursor = null;
  do {
    let pageUrl = url;
    if (cursor) pageUrl += `&cursor=${cursor}`;
    const response = await axios.get(pageUrl);
    const data = response.data.result || [];
    results = results.concat(data);
    cursor = response.data.next_cursor;
  } while (cursor);
  return results;
}

module.exports = {
  getAssetInfo,
  getAssetIssuances,
  getAssetHolders,
};
