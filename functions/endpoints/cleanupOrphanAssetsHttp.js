const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {loadConfig} = require("../lib/config");
const {isAuthorized} = require("../lib/auth");

module.exports = onRequest({maxInstances: 1, memory: "256MiB"},
    async (req, res) => {
      try {
        const cfg = await loadConfig();
        if (!isAuthorized(req, cfg)) {
          res.status(401).send("Unauthorized");
          return;
        }
        const active = new Set();
        for (const [project, assets] of Object.entries(cfg.projects || {})) {
          for (const a of assets || []) {
            active.add(`${a.name}_${project}`);
          }
        }
        const db = admin.firestore();
        const snap = await db.collection("assets").get();
        const batch = db.batch();
        let count = 0;
        snap.forEach((doc) => {
          if (!active.has(doc.id)) {
            batch.delete(doc.ref);
            count++;
          }
        });
        if (count > 0) await batch.commit();
        res.status(200).send("Cleanup deleted=" + String(count));
      } catch (e) {
        const msg = (e && e.message) || String(e);
        logger.error("cleanupOrphanAssetsHttp failed: " + msg);
        res.status(500).send("FAILED");
      }
    });
