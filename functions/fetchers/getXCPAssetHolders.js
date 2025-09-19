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
  const holders = await handler.getAssetHolders(asset, config);
  const docRef = db.collection("assets").doc(asset + "_" + project);
  const svcUpdatedField = (
    serviceName === "classic" ? "updatedClassic" : "updatedCounterparty"
  );
  // Read existing document to preserve info/issuances
  const docSnap = await docRef.get();
  const existingData = docSnap.exists ? docSnap.data() : {};
  const existingServiceData = (existingData.data &&
    existingData.data[serviceName]) || {};

  await docRef.set({
    data: {
      ...existingData.data,
      [serviceName]: {
        ...existingServiceData,
        holders,
      },
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    [svcUpdatedField]: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
  let count = 0;
  if (Array.isArray(holders)) count = holders.length;
  else if (holders && holders.data && Array.isArray(holders.data)) {
    count = holders.data.length;
  }
  const meta = {service: serviceName, project, asset, count};
  if (log && log.info) log.info("assetHolders:written", meta);
  else console.log("assetHolders:written", meta);
  return holders;
};
