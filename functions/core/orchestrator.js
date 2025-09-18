// CounterpartyPulse - Main runner for all fetchers (exported for CF)
const path = require("path");

/**
 * Sleep helper
 * @param {number} ms milliseconds
 * @return {Promise<void>} resolves after ms
 */
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run a single fetcher step for an asset
 * @param {string} serviceName service key
 * @param {string} fetcherName module name
 * @param {{name:string}} asset asset object
 * @param {string} project project key
 * @param {object} config full config
 * @param {{info:Function,warn:Function,error:Function}} log logger
 * @return {Promise<void>}
 */
async function runFetcher(
    serviceName,
    fetcherName,
    asset,
    project,
    config,
    log,
) {
  const start = Date.now();
  const fetcherPath = path.join(
      __dirname, "..", "fetchers", `${fetcherName}.js`,
  );
  const fetcher = require(fetcherPath);
  try {
    log.info("runFetcher:start", {
      service: serviceName,
      project: project,
      asset: asset.name,
      step: fetcherName,
    });
    if (typeof fetcher === "function") {
      await fetcher(asset, config, project, serviceName, log);
    } else if (typeof fetcher.main === "function") {
      await fetcher.main(asset, config, project, serviceName, log);
    } else {
      log.warn("Fetcher not executable", {fetcher: fetcherName});
    }
    const dur = Date.now() - start;
    log.info("runFetcher:done", {
      service: serviceName,
      project: project,
      asset: asset.name,
      step: fetcherName,
      ms: dur,
    });
  } catch (err) {
    log.error("runFetcher:error", {
      service: serviceName,
      project: project,
      asset: asset.name,
      step: fetcherName,
      error: (err && err.message) || String(err),
    });
  } finally {
    // Rate-Limit nach jedem Request (Service-Ebene)
    const service = config.services[serviceName] || {};
    const rateLimit = service.rateLimit || 1000;
    await sleep(rateLimit);
  }
}

/**
 * Run all services/projects/assets according to config
 * @param {object} config configuration
 * @param {{info:Function,warn:Function,error:Function}} loggerLike logger
 * @return {Promise<void>}
 */
async function runAll(config, loggerLike = console) {
  const log = {
    info: (...args) => (
      loggerLike.info ? loggerLike.info(...args) : console.log(...args)
    ),
    warn: (...args) => (
      loggerLike.warn ? loggerLike.warn(...args) : console.warn(...args)
    ),
    error: (...args) => (
      loggerLike.error ? loggerLike.error(...args) : console.error(...args)
    ),
  };
  log.info("runAll:start", {
    services: Object.keys(config.services).length,
    projects: Object.keys(config.projects).length,
  });
  const servicePromises = [];
  for (const serviceName of Object.keys(config.services)) {
    const service = config.services[serviceName];
    servicePromises.push((async () => {
      log.info("service:start", {service: serviceName});
      for (const project of Object.keys(config.projects)) {
        const assets = config.projects[project];
        log.info("project:start", {
          service: serviceName,
          project: project,
          assets: assets.length,
        });
        for (const assetObj of assets) {
          if (assetObj[serviceName]) {
            for (const fetcherName of service.fetchOrder) {
              await runFetcher(
                  serviceName,
                  fetcherName,
                  assetObj,
                  project,
                  config,
                  log,
              );
            }
          } else {
            log.info("asset:skipped", {
              service: serviceName,
              project: project,
              asset: assetObj.name,
            });
          }
        }
        log.info("project:done", {service: serviceName, project: project});
      }
      log.info("service:done", {service: serviceName});
    })());
  }
  await Promise.all(servicePromises);
  log.info("runAll:done");
}

module.exports = {runAll};
