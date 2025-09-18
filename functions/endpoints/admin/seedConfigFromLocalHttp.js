const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const {loadConfig} = require("../../lib/config");
const {isAuthorized} = require("../../lib/auth");
const admin = require("firebase-admin");

module.exports = onRequest({maxInstances: 1, memory: "256MiB"},
    async (req, res) => {
      try {
        const cfg = await loadConfig();
        if (!isAuthorized(req, cfg)) {
          res.status(401).send("Unauthorized");
          return;
        }
        // eslint-disable-next-line global-require
        const localCfg = require("../../fetchConfig.json");
        if (!localCfg || !localCfg.services || !localCfg.projects) {
          res.status(400).send("Invalid local fetchConfig.json");
          return;
        }
        const replace = String(req.query.replace || "false").toLowerCase() ===
          "true";
        const db = admin.firestore();
        const ref = db.collection("config").doc("fetchConfig");
        if (replace) {
          await ref.set(localCfg, {merge: false});
        } else {
          await ref.set({
            services: localCfg.services,
            projects: localCfg.projects,
          }, {merge: true});
        }
        res.status(200).send("Seeded fetchConfig to Firestore");
      } catch (e) {
        const msg = (e && e.message) || String(e);
        logger.error("seedConfigFromLocalHttp failed: " + msg);
        res.status(500).send("FAILED");
      }
    });
