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
        const body = req.body || {};
        const project = String(
            (body.project != null ? body.project : req.query.project) || "",
        ).trim();
        const removeRaw = (body.remove != null ? body.remove :
          req.query.remove);
        const remove = String(removeRaw || "").toLowerCase() === "true";
        if (!project) {
          res.status(400).send("Missing project");
          return;
        }
        const db = admin.firestore();
        const ref = db.collection("config").doc("fetchConfig");
        const current = (await ref.get()).data() || {};
        const projects = current.projects || {};
        if (remove) {
          if (!projects[project]) {
            res.status(404).send("Project not found");
            return;
          }
          // Remove project only from config using nested field delete.
          // Asset docs are removed separately via cleanupOrphanAssetsHttp.
          await ref.update({
            ["projects." + project]: admin.firestore.FieldValue.delete(),
          });
          res.status(200).send("Project removed");
          return;
        } else {
          if (projects[project]) {
            res.status(200).send("Project exists");
            return;
          }
          projects[project] = [];
          await ref.set({projects}, {merge: true});
          res.status(200).send("Project created");
          return;
        }
      } catch (e) {
        const msg = (e && e.message) || String(e);
        logger.error("addOrUpdateProjectHttp failed: " + msg);
        res.status(500).send("FAILED");
      }
    });
