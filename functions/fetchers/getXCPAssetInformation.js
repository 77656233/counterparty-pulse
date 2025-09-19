const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

module.exports = async function(asset, config, project, serviceName, log) {
  let handler;
  if (serviceName === "classic") {
    handler = require("../services/tokenScanClassicHandler");
  } else {
    handler = require("../services/counterpartyHandler");
  }
  const info = await handler.getAssetInfo(asset.name, config);
  const docRef = db.collection("assets").doc(asset.name + "_" + project);
  const assetInfo = {name: asset.name, project};
  if (asset.info !== undefined) assetInfo.info = asset.info;
  if (asset.special !== undefined) assetInfo.special = asset.special;
  const svcUpdatedField = (
    serviceName === "classic" ? "updatedClassic" : "updatedCounterparty"
  );
  // Merge asset info without overwriting holders/issuances
  const updateData = {
    ...assetInfo,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    [svcUpdatedField]: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Add each field individually to avoid overwriting entire data object
  for (const [key, value] of Object.entries(info)) {
    updateData[`data.${serviceName}.${key}`] = value;
  }

  await docRef.set(updateData, {merge: true});
  const meta = {service: serviceName, project, asset: asset.name};
  if (log && log.info) log.info("assetInfo:written", meta);
  else console.log("assetInfo:written", meta);
};
