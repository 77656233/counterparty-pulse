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
  // Read existing document to preserve holders/issuances
  const docSnap = await docRef.get();
  const existingData = docSnap.exists ? docSnap.data() : {};
  const existingServiceData = (existingData.data &&
    existingData.data[serviceName]) || {};

  await docRef.set({
    ...assetInfo,
    data: {
      ...existingData.data,
      [serviceName]: {
        ...existingServiceData,
        info,
      },
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    [svcUpdatedField]: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
  const meta = {service: serviceName, project, asset: asset.name};
  if (log && log.info) log.info("assetInfo:written", meta);
  else console.log("assetInfo:written", meta);
};
