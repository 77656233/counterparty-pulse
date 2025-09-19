const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

module.exports = async function(assetObj, config, project, serviceName, log) {
  const asset = assetObj.name;
  let handler;
  if (serviceName === "classic") {
    handler = require("../services/tokenScanClassicHandler");
  } else {
    handler = require("../services/counterpartyHandler");
  }
  const issuances = await handler.getAssetIssuances(asset, config);
  const docRef = db.collection("assets").doc(asset + "_" + project);
  const svcUpdatedField = (
    serviceName === "classic" ? "updatedClassic" : "updatedCounterparty"
  );
  // Read existing document to preserve info/holders
  const docSnap = await docRef.get();
  const existingData = docSnap.exists ? docSnap.data() : {};
  const existingServiceData = (existingData.data &&
    existingData.data[serviceName]) || {};

  await docRef.set({
    data: {
      ...existingData.data,
      [serviceName]: {
        ...existingServiceData,
        issuances,
      },
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    [svcUpdatedField]: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
  const count = Array.isArray(issuances) ? issuances.length : (
    issuances && Array.isArray(issuances.data) ? issuances.data.length : 0
  );
  const meta = {service: serviceName, project, asset, count};
  if (log && log.info) log.info("assetIssuances:written", meta);
  else console.log("assetIssuances:written", meta);
  return issuances;
};
