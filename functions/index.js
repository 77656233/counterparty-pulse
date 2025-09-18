/* eslint-disable */
const { setGlobalOptions } = require("firebase-functions/v2/options");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

setGlobalOptions({
    region: "europe-west1",
    maxInstances: 1,
    timeoutSeconds: 540,
    memory: "256MiB",
});

// Export HTTP endpoints from modular files
exports.runSingleAssetHttp = require("./endpoints/runSingleAssetHttp");
exports.runCounterpartyActivityScannerHttp = require("./endpoints/runCounterpartyActivityScannerHttp");
exports.cleanupOrphanAssetsHttp = require("./endpoints/cleanupOrphanAssetsHttp");
exports.runBatchedFetchersHttp = require("./endpoints/runBatchedFetchersHttp");
exports.addOrUpdateProjectHttp = require("./endpoints/admin/addOrUpdateProjectHttp");
exports.addAssetsToProjectHttp = require("./endpoints/admin/addAssetsToProjectHttp");
exports.addAdminKeyHttp = require("./endpoints/admin/addAdminKeyHttp");
exports.seedConfigFromLocalHttp = require("./endpoints/admin/seedConfigFromLocalHttp");
exports.updateCryptoPricesHttp = require("./endpoints/updateCryptoPricesHttp");

logger.info("Functions exported: HTTP endpoints only");
