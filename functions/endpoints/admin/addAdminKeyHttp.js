const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {loadConfig} = require("../../lib/config");
const {isAuthorized} = require("../../lib/auth");

module.exports = onRequest({maxInstances: 1, memory: "256MiB"},
    async (req, res) => {
      try {
        const cfg = await loadConfig();
        if (!isAuthorized(req, cfg)) {
          res.status(401).send("Unauthorized");
          return;
        }
        const providedKey = (
          req.get("x-api-key") || String(req.query.key || "")
        ).trim();
        const oldKey = String(
            (req.body && req.body.old) || req.query.old || "",
        ).trim();
        const nextKey = String(
            (req.body && req.body.next) || req.query.next || "",
        ).trim();
        if (!oldKey || !nextKey) {
          res.status(400).send("Missing old or next");
          return;
        }
        if (providedKey !== oldKey) {
          res.status(403).send("Old key mismatch");
          return;
        }
        const db = admin.firestore();
        const ref = db.collection("config").doc("fetchConfig");
        const snap = await ref.get();
        const data = snap.exists ? snap.data() : {};
        const auth = data.auth || {};
        let apiKeys = Array.isArray(auth.apiKeys) ? auth.apiKeys.slice() : [];
        auth.apiKey = nextKey;
        apiKeys = apiKeys.filter((k) => k !== oldKey);
        if (!apiKeys.includes(nextKey)) apiKeys.push(nextKey);
        auth.apiKeys = apiKeys;
        await ref.set({auth}, {merge: true});
        logger.info("adminKey:rotated");
        res.status(200).send("Admin key updated");
      } catch (e) {
        const msg = (e && e.message) || String(e);
        logger.error("addAdminKeyHttp failed: " + msg);
        res.status(500).send("FAILED");
      }
    });
