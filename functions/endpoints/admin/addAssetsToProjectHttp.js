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
        let assets = body.assets != null ? body.assets : req.query.assets;
        const removeMode = String(
            body.remove != null ? body.remove : req.query.remove,
        ).toLowerCase() === "true";
        // Optional defaults via query for CSV or to fill missing fields
        const parseBool = (v) => {
          if (typeof v === "boolean") return v;
          if (v == null) return undefined;
          const s = String(v).trim().toLowerCase();
          if (["true", "1", "yes", "on"].includes(s)) return true;
          if (["false", "0", "no", "off"].includes(s)) return false;
          return undefined;
        };
        const defClassic = parseBool(req.query.classic);
        const defCounterparty = parseBool(req.query.counterparty);
        const defInfo = (
          req.query.info !== undefined ? String(req.query.info) : undefined
        );
        const defSpecial = (
          req.query.special !== undefined ? String(req.query.special) :
            undefined
        );
        if (typeof assets === "string") {
          const s = assets.trim();
          if (s.startsWith("[") || s.startsWith("{")) {
            try {
              assets = JSON.parse(s);
            } catch (e) {
              assets = [];
            }
          } else if (s.length > 0) {
            if (removeMode) {
              assets = s.split(",").map((n) => ({name: n.trim()}));
            } else {
              assets = s.split(",").map((n) => {
                const a = {name: n.trim()};
                if (defClassic !== undefined) a.classic = defClassic;
                if (defCounterparty !== undefined) {
                  a.counterparty = defCounterparty;
                }
                if (defInfo !== undefined) a.info = defInfo;
                if (defSpecial !== undefined) a.special = defSpecial;
                return a;
              });
            }
          } else {
            assets = [];
          }
        }
        if (!Array.isArray(assets)) assets = [];
        if (!project || assets.length === 0) {
          res.status(400).send("Missing project or assets");
          return;
        }
        const db = admin.firestore();
        const ref = db.collection("config").doc("fetchConfig");
        const current = (await ref.get()).data() || {};
        const projects = current.projects || {};
        const existing = projects[project];
        if (!existing) {
          res.status(404).send("Project not found");
          return;
        }
        if (removeMode) {
          const namesToRemove = new Set(
              assets.map((a) => (a && a.name ? String(a.name) : "").trim())
                  .filter(Boolean),
          );
          const kept = existing.filter((x) => !namesToRemove.has(x.name));
          projects[project] = kept;
          await ref.set({projects}, {merge: true});
          res.status(200).send("Assets removed=" + namesToRemove.size);
        } else {
          const merged = existing.slice();
          for (const a of assets) {
            if (!a || !a.name) continue;
            const enriched = {...a};
            if (enriched.classic === undefined && defClassic !== undefined) {
              enriched.classic = defClassic;
            }
            if (
              enriched.counterparty === undefined &&
              defCounterparty !== undefined
            ) {
              enriched.counterparty = defCounterparty;
            }
            if (enriched.info === undefined && defInfo !== undefined) {
              enriched.info = defInfo;
            }
            if (enriched.special === undefined && defSpecial !== undefined) {
              enriched.special = defSpecial;
            }
            const idx = merged.findIndex((x) => x.name === enriched.name);
            if (idx >= 0) merged[idx] = {...merged[idx], ...enriched};
            else merged.push(enriched);
          }
          projects[project] = merged;
          await ref.set({projects}, {merge: true});
          res.status(200).send("Assets added");
        }
      } catch (e) {
        const msg = (e && e.message) || String(e);
        logger.error("addAssetsToProjectHttp failed: " + msg);
        res.status(500).send("FAILED");
      }
    });
