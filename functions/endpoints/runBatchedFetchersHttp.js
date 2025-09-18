const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {loadConfig} = require("../lib/config");
const {isAuthorized} = require("../lib/auth");
const {acquireLock, releaseLock} = require("../lib/locks");
const {createInMemoryLogger, summarizeLogs} = require("../lib/logging");
const {buildTargetsForService, configFromTargets} = require("../lib/batching");
const {runAll} = require("../core/orchestrator");

module.exports = onRequest({maxInstances: 1, memory: "256MiB"},
    async (req, res) => {
      const start = Date.now();
      try {
        const cfg = await loadConfig();
        if (!isAuthorized(req, cfg)) {
          res.status(401).send("Unauthorized");
          return;
        }
        const service = String(req.query.service || "classic").trim();
        if (!cfg.services || !cfg.services[service]) {
          res.status(400).send("Unknown service");
          return;
        }
        const batch = Math.max(1, Math.min(500, Number(req.query.batch || 50)));
        const reset = String(req.query.reset || "false").toLowerCase() ===
          "true";
        const db = admin.firestore();
        const cursorRef = db.collection("meta").doc("fullrun_" + service);
        const lockName = "batchProcessor_" + service;

        const targets = buildTargetsForService(cfg, service);
        const total = targets.length;
        if (total === 0) {
          res.status(200).json({
            service,
            from: 0,
            to: 0,
            processed: 0,
            total: 0,
            hasMore: false,
            ms: Date.now() - start,
          });
          return;
        }

        let index = 0;
        if (!reset) {
          const snap = await cursorRef.get();
          if (snap.exists) {
            const data = snap.data() || {};
            if (typeof data.index === "number") index = data.index;
            if (index >= total) index = 0;
          }
        }

        const owner = "batch-" + Date.now();
        const ttlSec = 5 * 60; // 5 minutes safety TTL
        const acquired = await acquireLock(lockName, ttlSec, owner);
        if (!acquired) {
          res.status(423).send("batchProcessor: BUSY for " + service);
          return;
        }
        const mem = createInMemoryLogger(logger);
        const log = mem.logger;
        try {
          const from = index;
          const end = Math.min(index + batch, total);
          const slice = targets.slice(index, end);

          if (slice.length === 0) {
            res.status(200).json({
              service,
              from,
              to: index,
              processed: 0,
              total,
              hasMore: false,
              ms: Date.now() - start,
              summary: {info: 0, warn: 0, error: 0},
              logCount: 0,
              returnedLogs: 0,
              logs: [],
            });
            return;
          }

          const filteredCfg = configFromTargets(cfg, service, slice);
          log.info("runAllFetchersHttp:plan", {
            services: [service],
            projects: Object.keys(filteredCfg.projects || {}).length,
            assets: slice.length,
          });

          await runAll(filteredCfg, log);

          const newIndex = end >= total ? 0 : end;
          await cursorRef.set({
            service,
            index: newIndex,
            total,
            batch,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});

          const logs = mem.getLogs();
          const limit = Math.max(
              0,
              Math.min(2000, Number(req.query.logLimit || 500)),
          );
          const trimmed = limit > 0 ? logs.slice(-limit) : [];
          const summary = summarizeLogs(logs);
          const body = {
            service,
            from,
            to: newIndex,
            processed: slice.length,
            total,
            hasMore: newIndex !== from,
            ms: Date.now() - start,
            summary,
            logCount: logs.length,
            returnedLogs: trimmed.length,
            logs: trimmed,
          };
          res.status(200).json(body);
        } finally {
          await releaseLock(lockName, owner);
        }
      } catch (e) {
        const msg = (e && e.message) || String(e);
        logger.error("runBatchedFetchersHttp failed: " + msg);
        res.status(500).send("FAILED");
      }
    });
