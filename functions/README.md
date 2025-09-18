# CounterpartyPulse Functions API

Production-ready overview of all Cloud Functions under `functions/` with clear behavior, parameters, auth, and example URLs. Region: `europe-west1`.

Auth
- Every endpoint is protected by an admin key.
- Supply via header `x-api-key: <KEY>` or query `?key=<KEY>`.
- Valid keys: Firestore `config/fetchConfig.auth.apiKeys` (Array) or ENV `ADMIN_API_KEY`.

All endpoints accept GET (POST optional with the same query/body schema).

**Base URLs (Cloud Run):**
```
https://runbatchedfetchershttp-ag7ibyjerq-ew.a.run.app
https://runsingleassethttp-ag7ibyjerq-ew.a.run.app  
https://runcounterpartyactivityscannerhttp-ag7ibyjerq-ew.a.run.app
https://cleanuporphanassetshttp-ag7ibyjerq-ew.a.run.app
https://addorupdateprojecthttp-ag7ibyjerq-ew.a.run.app
https://addassetstoprojecthttp-ag7ibyjerq-ew.a.run.app
https://addadminkeyhttp-ag7ibyjerq-ew.a.run.app
https://seedconfigfromlocalhttp-ag7ibyjerq-ew.a.run.app
https://updatecryptopriceshttp-ag7ibyjerq-ew.a.run.app
```

## HTTP endpoints

1) runBatchedFetchersHttp
- Purpose: Process a single batch of assets (cursor in Firestore). For continuous processing, use external scheduling (cron, GitHub Actions).
- Query:
  - `service` (optional, default `classic`)
  - `batch` (optional, 1..500; default 50)
  - `reset` (optional, true/false; default false) – reset cursor
- Behavior: Maintains cursor in `meta/fullrun_<service>`. Processes exactly one batch and advances cursor.
- Response: JSON `{ service, from, to, processed, total, hasMore, ms, summary, logCount, returnedLogs, logs }`
- Notes:
  - `logs` contains the most recent events of this run (in-memory, not persisted). Use `logLimit` to cap the size (default 500, max 2000).
  - For large-scale continuous processing, call this endpoint via external scheduling rather than chaining HTTP calls.

2) runSingleAssetHttp
- Purpose: Update a single asset (update-only, no auto-create).
- Query:
  - `asset` (required)
  - `project` (optional – otherwise searched across all projects)
  - `services` (optional, CSV)
- Behavior:
  - If the asset exists in config.projects, the function will create/update the Firestore document (`assets/{ASSET}_{PROJECT}`) through the fetchers.
  - Executes only chosen services (and only if enabled on the asset).
- Response: JSON `{ ok, plan, summary, logCount, returnedLogs, logs }` (or `404` if asset not found).
- Query:
  - `logLimit` (optional, default 500, max 2000) – caps number of returned log entries.
- Notes:
  - Logs are returned in the response only (in-memory, not persisted).

3) runCounterpartyActivityScannerHttp
- Purpose: Poll Counterparty events and update only impacted DB assets.
- Behavior:
  - Reads `/v2/events` (cursor stored at `meta/activity_counterparty`).
  - Extracts impacted asset names and matches existing Firestore docs.
  - Respects the `activityProcessor` lock (skips while active).
- Response: JSON `{ ok, impactedNames, updatedDocs, plan, summary, logCount, logs }`.
- Notes: Logs are included in response only (in-memory).

4) cleanupOrphanAssetsHttp
- Purpose: Delete asset docs no longer present in `config.fetchConfig.projects`.
- Response: `200 OK` (`Cleanup deleted=<n>`)

- 5) addOrUpdateProjectHttp
- Purpose: Create project if missing OR remove an entire project from config (assets remain until cleanup).
- Query/Body:
  - `project` (required)
  - `remove=true|false` (optional; when true, deletes the project and all assets in it)
- Behavior:
  - Create: Creates empty array at `projects[project]`; if it exists already, responds `Project exists`.
  - Remove: Deletes `projects[project]` from config only. Use `cleanupOrphanAssetsHttp` to remove asset docs.
- Response: `200 OK` (`Project created` | `Project exists` | `Project removed`) or `404 Project not found` (on remove)

6) addAssetsToProjectHttp
- Purpose: Add assets to an existing project (bulk supported).
- Query/Body:
  - `project` (required)
  - `assets` (required) – CSV (`A,B,C`) or JSON (`[{"name":"A","classic":true}]`).
  - Defaults (optional, for CSV or to fill missing fields on JSON):
    - `classic=true|false`
    - `counterparty=true|false`
    - `info=<string>`
    - `special=<string>`
- Behavior: Errors if project does not exist (`404`).
- Response: `200 OK` (`Assets added`) or `404 Project not found`.
 - Deleting assets: add `remove=true` with `assets` (CSV or JSON) to remove those names from the project's config. Response: `200 OK` (`Assets removed=<n>`)

7) addAdminKeyHttp
- Purpose: Rotate the admin key. Requires knowledge of the old key.
- Query/Body:
  - `old` (required) – current key
  - `next` (required) – new key
- Auth note: The provided header/query key must equal `old`.
- Behavior: Sets a new primary key, updates `auth.apiKeys` (remove old, add new).
- Response: `200 OK` (`Admin key updated`) or `403 Old key mismatch`/`400 Missing old or next`.

8) seedConfigFromLocalHttp
- Purpose: Copy `functions/fetchConfig.json` to Firestore (`config/fetchConfig`).
- Query:
  - `replace=true|false` (optional; default merge)
- Response: `200 OK` (`Seeded fetchConfig to Firestore`).

9) updateCryptoPricesHttp
- Purpose: Stub endpoint for future price updates.
- Response: `200 OK` when called.


## External Scheduling

Since Firebase Scheduled Functions have been removed, use external scheduling systems to call the HTTP endpoints:

**Recommended intervals:**
- `runBatchedFetchersHttp` every 3 minutes (per service)
- `runCounterpartyActivityScannerHttp` every 5 minutes  
- `cleanupOrphanAssetsHttp` every 2 hours

**External scheduling options:**
- **GitHub Actions**: Use cron workflows to call endpoints
- **Cloud Scheduler**: Create HTTP jobs targeting the function URLs
- **VPS Crontab**: Simple curl commands on a scheduled basis
- **Vercel Cron**: For web-based scheduling

**Lock system**: Functions use Firestore locks (`batchProcessor_<service>`, `activityProcessor`) to prevent overlapping executions.

## Configuration

- Primary: Firestore document `config/fetchConfig` (fields `services`, `projects`, `auth.apiKeys`).
- Fallback: `functions/fetchConfig.json` (can be seeded to Firestore via `seedConfigFromLocalHttp`).

## Resources & region

- Global defaults (all functions):
  - Region: `europe-west1`
  - Timeout: `540s`
  - `maxInstances: 1`
  - Memory: `256MiB`

## Logging

- In-Response: Every HTTP endpoint returns the logs of that invocation in the JSON response (collected in-memory, no DB writes).
- Tags are concise and structured (examples: `runAllFetchersHttp:plan`, `assetInfo:written`, `assetHolders:written`, `assetIssuances:written`).
- Use `logLimit` to cap the number of returned entries where supported (default 500, max 2000).

## Folder structure

- `core/` – Orchestrator (`orchestrator.js`) exporting `runAll`
- `endpoints/` – One file per HTTP function
- `services/` – External API handlers (classic, counterparty)
- `fetchers/` – Per-asset steps (info, issuances, holders)
- `lib/` – Shared utilities (auth, config, logging, locks, batching, sleep)

## Examples (GET)

- Single batch (classic, 50 assets):
  - `<BASE>/runBatchedFetchersHttp?service=classic&batch=50&key=YOUR_KEY`
- Single asset (both services):
  - `<BASE>/runSingleAssetHttp?asset=SJCXCARD&project=Spells%20of%20Genesis&services=classic,counterparty&key=YOUR_KEY`
- Trigger scanner manually:
  - `<BASE>/runCounterpartyActivityScannerHttp?key=YOUR_KEY`
- Create project:
  - `<BASE>/addOrUpdateProjectHttp?project=New%20Project&key=YOUR_KEY`
- Remove project (config only):
  - `<BASE>/addOrUpdateProjectHttp?project=Test%20Project&remove=true&key=YOUR_KEY`
  - Then cleanup:
  - `<BASE>/cleanupOrphanAssetsHttp?key=YOUR_KEY`
- Add assets (CSV):
  - `<BASE>/addAssetsToProjectHttp?project=Spells%20of%20Genesis&assets=SJCXCARD,GEMZCARD&key=YOUR_KEY`
- Remove assets (CSV):
  - `<BASE>/addAssetsToProjectHttp?project=Spells%20of%20Genesis&assets=SJCXCARD&remove=true&key=YOUR_KEY`
- Rotate admin key:
  - `<BASE>/addAdminKeyHttp?old=OLD_KEY&next=NEW_KEY&key=OLD_KEY`


