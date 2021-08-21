const { mintPortal } = require("../scripts/upgrades/upgrade-mintPortal.js");
const { createH2 } = require("../scripts/createhaunt2.js");
const { VRFUpgrade } = require("../scripts/upgrades/upgrade-VRF.js");
const { upgradeH2 } = require("../scripts/addTestCollaterals.js");

async function main() {
  await mintPortal();
  await createH2();
  await VRFUpgrade();
  await upgradeH2();
}

//main();
