const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const {loadConfig} = require("../lib/config");
const {isAuthorized} = require("../lib/auth");

// Placeholder: will later fetch external prices and store them in Firestore
module.exports = onRequest(async (req, res) => {
  try {
    const cfg = await loadConfig();
    if (!isAuthorized(req, cfg)) {
      res.status(401).send("Unauthorized");
      return;
    }
    logger.info("updateCryptoPrices: stub-called");
    res.status(200).send("updateCryptoPrices: stub OK");
  } catch (e) {
    const msg = (e && e.message) || String(e);
    logger.error("updateCryptoPricesHttp failed: " + msg);
    res.status(500).send("FAILED");
  }
});
