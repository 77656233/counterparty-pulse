const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const {loadConfig} = require("../lib/config");
const {isAuthorized} = require("../lib/auth");
const {createInMemoryLogger, summarizeLogs} = require("../lib/logging");
const {runAll} = require("../core/orchestrator");

module.exports = onRequest({maxInstances: 1, memory: "256MiB"},
    async (req, res) => {
      try {
        const project = String(req.query.project || "");
        const assetName = String(req.query.asset || "");
        const cfg = await loadConfig();
        if (!isAuthorized(req, cfg)) {
          res.status(401).send("Unauthorized");
          return;
        }
        const servicesParam = String(req.query.services || "");
        if (!assetName) {
          res.status(400).send("Missing asset");
          return;
        }
        let targets = [];
        if (project) {
          const projAssets = cfg.projects[project] || [];
          const found = projAssets.find((a) => a.name === assetName);
          if (!found) {
            res.status(404).send("Asset not found in given project");
            return;
          }
          targets = [[project, found]];
        } else {
          for (const [proj, assets] of Object.entries(cfg.projects || {})) {
            const found = (assets || []).find((a) => a.name === assetName);
            if (found) targets.push([proj, found]);
          }
          if (targets.length === 0) {
            res.status(404).send("Asset not found in any project");
            return;
          }
        }
        const allServices = Object.keys(cfg.services);
        let selected = allServices;
        if (servicesParam) {
          const reqServices = servicesParam.split(",").map((s) => s.trim());
          selected = allServices.filter((s) => reqServices.includes(s));
        }
        const servicesObj = Object.fromEntries(
            selected.map((s) => [s, cfg.services[s]]),
        );
        const projects = {};
        for (const [proj, assetObj] of targets) {
          const enabled = selected.filter((s) => Boolean(assetObj[s]));
          if (enabled.length === 0) continue;
          if (!projects[proj]) projects[proj] = [];
          projects[proj].push(assetObj);
        }
        if (Object.keys(projects).length === 0) {
          res.status(400).send("No valid services for this asset");
          return;
        }
        const plan = {
          asset: assetName,
          selectedServices: selected,
          targets: Object.keys(projects),
        };
        const mem = createInMemoryLogger(logger);
        const log = mem.logger;
        log.info("runSingleAssetHttp:plan", plan);
        await runAll({services: servicesObj, projects}, log);
        log.info("runSingleAssetHttp:done", {
          asset: assetName,
          projects: Object.keys(projects),
          services: Object.keys(servicesObj),
        });
        const logs = mem.getLogs();
        const limit = Math.max(
            0,
            Math.min(2000, Number(req.query.logLimit || 500)),
        );
        const trimmed = limit > 0 ? logs.slice(-limit) : [];
        const summary = summarizeLogs(logs);
        res.status(200).json({
          ok: true,
          plan,
          summary,
          logCount: logs.length,
          returnedLogs: trimmed.length,
          logs: trimmed,
        });
      } catch (e) {
        const msg = (e && e.message) || String(e);
        logger.error("runSingleAssetHttp failed: " + msg);
        res.status(500).send("runSingleAsset: FAILED");
      }
    });
