import { run } from "hardhat";
import { AddItemTypesTaskArgs } from "../../tasks/addItemTypes";
import { maticDiamondAddress } from "../helperFunctions";

async function addItemTypes() {
  const itemManager: string = "0x8D46fd7160940d89dA026D59B2e819208E714E82";
  const diamondAddress: string = maticDiamondAddress;
  const itemFile: string = "raffle5wearables";
  const svgFile: string = "raffle5wearables";
  const sleeveStartId: string = "36"; //todo: get this programatically

  const args: AddItemTypesTaskArgs = {
    itemManager: itemManager,
    diamondAddress: diamondAddress,
    itemFile: itemFile,
    svgFile: svgFile,
    sleeveStartId: sleeveStartId,
    uploadItemTypes: true,
    uploadWearableSvgs: true,
    uploadSleeveSvgs: false,

    replaceWearableSvgs: false,
    replaceSleeveSvgs: true,
    associateSleeves: true,
    sendToItemManager: true,
  };

  await run("addItemTypes", args);
}

addItemTypes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addItemTypes = addItemTypes;
