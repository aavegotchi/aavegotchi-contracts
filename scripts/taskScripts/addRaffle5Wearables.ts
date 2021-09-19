import { run } from "hardhat";
import { maticDiamondAddress } from "../helperFunctions";

async function addItemTypes() {
  const itemManager: string = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const diamondAddress: string = maticDiamondAddress;
  const itemFile: string = "raffle5wearables";
  const svgFile: string = "h2wearables";
  const sleeveStartId: string = "29"; //todo: get this programatically

  await run("addItemTypes", {
    itemManager: itemManager,
    diamondAddress: diamondAddress,
    itemFile: itemFile,
    svgFile: svgFile,
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
