import { run } from "hardhat";
import { maticDiamondAddress } from "../helperFunctions";

async function addItemTypes() {
  const itemManager: string = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const diamondAddress: string = maticDiamondAddress;
  const itemTypes: string = "";
  const svgs: string = "";
  const sleeveSvgs: string = "h2wearables";
  const sleeveStartId: string = "29";

  await run("addItemTypes", {
    itemManager: itemManager,
    diamondAddress: diamondAddress,
    itemTypes: itemTypes,
    svgs: svgs,
    sleeveSvgs: sleeveSvgs,
    sleeveStartId: sleeveStartId,
  });
}

addItemTypes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addItemTypes = addItemTypes;
