const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {loadConfig} = require("../lib/config");
const {isAuthorized} = require("../lib/auth");
const {acquireLock, releaseLock} = require("../lib/locks");
const {createInMemoryLogger, summarizeLogs} = require("../lib/logging");
const {runAll} = require("../core/orchestrator");

module.exports = onRequest({maxInstances: 1, memory: "256MiB"},
    async (req, res) => {
      const db = admin.firestore();
      const stateRef = db.collection("meta").doc("activity_counterparty");
      let owner = null; // Define owner outside try block for catch access

      try {
        const config = await loadConfig();
        if (!isAuthorized(req, config)) {
          res.status(401).send("Unauthorized");
          return;
        }

        // Acquire lock for activityProcessor to prevent conflicts
        owner = `activityProcessor_${Date.now()}`;
        const lockAcquired = await acquireLock("activityProcessor", 300, owner);
        if (!lockAcquired) {
          res.status(200).send("Skipped: activityProcessor already running");
          return;
        }
        const base = config.services &&
          config.services.counterparty &&
          config.services.counterparty.baseUrl;
        if (!base) {
          await releaseLock("activityProcessor", owner);
          res.status(400).send("Missing counterparty baseUrl in config");
          return;
        }
        // Use a forward-only approach: remember the highest seen event_index
        // and only process events with a strictly larger index.
        const snap = await stateRef.get();
        const stateData = snap.exists ? (snap.data() || {}) : {};
        let lastEventIndex = 0;
        if (typeof stateData.lastEventIndex === "number") {
          lastEventIndex = stateData.lastEventIndex;
        }
        const url = new URL("events", base);
        url.searchParams.set("limit", "300");
        const resp = await fetch(url.toString());
        if (!resp.ok) {
          logger.warn(
              "activityScannerHttp: fetch failed status=" + resp.status,
          );
          await releaseLock("activityProcessor", owner);
          res.status(502).send("Fetch failed");
          return;
        }
        const json = await resp.json();
        const results = Array.isArray(json && json.result) ? json.result : [];
        // Compute the newest index in this page; events are ordered
        // newest-first by the API
        const indices = results
            .map((ev) => (
              typeof ev.event_index === "number" ?
                ev.event_index : Number(ev.event_index)
            ))
            .filter((n) => Number.isFinite(n));
        const topIndex = indices.length ? Math.max(...indices) : lastEventIndex;
        // First-time init: record current top and do not backfill old history
        if (!lastEventIndex && topIndex) {
          await stateRef.set({
            lastEventIndex: topIndex,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});
          await releaseLock("activityProcessor", owner);
          res.status(200).send(
              "Initialized cursor at current top; no backfill",
          );
          return;
        }
        // Only consider events newer than our last seen index
        const newEvents = results.filter((ev) => {
          const idx = (
            typeof ev.event_index === "number" ?
              ev.event_index : Number(ev.event_index)
          );
          return Number.isFinite(idx) && idx > lastEventIndex;
        });
        const wanted = new Set();
        for (const ev of newEvents) {
          const p = ev && ev.params ? ev.params : {};
          const candidates = [p.asset, p.give_asset, p.get_asset];
          for (const name of candidates) {
            if (typeof name === "string" && name) wanted.add(name);
          }
        }
        if (wanted.size === 0) {
          // Advance pointer even if nothing matched, so we don't
          // reprocess the same page
          if (topIndex && topIndex > lastEventIndex) {
            await stateRef.set({
              lastEventIndex: topIndex,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, {merge: true});
          }
          res.status(200).send("No new events");
          return;
        }
        const assetsByProject = {};
        let matched = 0;
        for (const name of wanted) {
          const qs = await db
              .collection("assets")
              .where("name", "==", name)
              .get();
          qs.forEach((doc) => {
            const data = doc.data() || {};
            const proj = data.project;
            if (!proj) return;
            if (!assetsByProject[proj]) assetsByProject[proj] = [];
            if (!assetsByProject[proj].find((x) => x.name === name)) {
              assetsByProject[proj].push({name, counterparty: true});
              matched++;
            }
          });
        }
        if (Object.keys(assetsByProject).length === 0) {
          // No assets in DB matched the new events; still advance pointer
          if (topIndex && topIndex > lastEventIndex) {
            await stateRef.set({
              lastEventIndex: topIndex,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, {merge: true});
          }
          res.status(200).send("No DB assets impacted");
          return;
        }
        const filteredCfg = {
          services: {counterparty: config.services.counterparty},
          projects: assetsByProject,
        };
        const mem = createInMemoryLogger(logger);
        const log = mem.logger;
        const plan = {projects: Object.keys(assetsByProject).length};
        log.info("activityScannerHttp:plan", plan);
        await runAll(filteredCfg, log);
        // Move pointer to the newest seen index
        if (topIndex && topIndex > lastEventIndex) {
          await stateRef.set({
            lastEventIndex: topIndex,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, {merge: true});
        }
        const logs = mem.getLogs();
        const summary = summarizeLogs(logs);

        // Release lock after successful completion
        await releaseLock("activityProcessor", owner);

        res.status(200).json({
          ok: true,
          impactedNames: wanted.size,
          updatedDocs: matched,
          plan,
          summary,
          logCount: logs.length,
          logs,
        });
      } catch (e) {
        const msg = (e && e.message) || String(e);
        logger.error("runCounterpartyActivityScannerHttp failed: " + msg);

        // Release lock on error
        await releaseLock("activityProcessor", owner);

        res.status(500).send("FAILED");
      }
    });
