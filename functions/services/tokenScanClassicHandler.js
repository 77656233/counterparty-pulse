// CounterpartyPulse - TokenScan Classic API Handler
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
 * Fetch asset information from TokenScan Classic
 * @param {string} asset Asset name
 * @param {object} config Service configuration
 * @return {Promise<object|null>} Asset data or null on error
 */
async function getAssetInfo(asset, config) {
  const service = config.services.classic;
  const endpoint = service.endpoints.assetInfo;
  const url = buildEndpoint(service.baseUrl, endpoint.path, {asset});
  try {
    const response = await axios.get(url);
    const data = response.data && response.data.result ?
      response.data.result : response.data;
    return {
      asset: data.asset,
      asset_id: data.asset_id ? String(data.asset_id) : "",
      asset_longname: data.asset_longname || data.asset_longname || "",
      issuer: data.issuer,
      owner: data.owner,
      divisible: data.divisible,
      locked: data.locked,
      supply: data.supply_normalized || data.supply,
      description: data.description,
    };
  } catch (error) {
    console.error(
        `Error fetching ${asset} from TokenScan Classic:`,
        error.message,
    );
    return null;
  }
}

/**
 * Fetch all issuances for an asset from TokenScan Classic
 * @param {string} asset Asset name
 * @param {object} config Service configuration
 * @return {Promise<Array>} List of issuances
 */
async function getAssetIssuances(asset, config) {
  const service = config.services.classic;
  const endpoint = service.endpoints.issuances;
  const url = buildEndpoint(service.baseUrl, endpoint.path, {asset});
  let results = [];
  let page = 1;
  let hasMore = true;
  do {
    const pageUrl = `${url}/${page}/100`;
    const response = await axios.get(pageUrl);
    const data = response.data.data || [];
    results = results.concat(data);
    hasMore = data.length === 100;
    page++;
  } while (hasMore);
  return results;
}

/**
 * Fetch all holders for an asset from TokenScan Classic
 * @param {string} asset Asset name
 * @param {object} config Service configuration
 * @return {Promise<Array>} List of holders
 */
async function getAssetHolders(asset, config) {
  const service = config.services.classic;
  // Endpoint: /api/holders/{asset}
  const url = `${service.baseUrl}holders/${asset}`;
  const response = await axios.get(url);
  // Assumption: response.data is an array of holders
  return response.data;
}

module.exports = {
  getAssetInfo,
  getAssetIssuances,
  getAssetHolders,
};
