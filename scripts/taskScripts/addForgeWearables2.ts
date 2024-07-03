import { run } from "hardhat";
import { AddItemTypesTaskArgs } from "../../tasks/addItemTypes";
import { maticDiamondAddress, maticForgeDiamond } from "../helperFunctions";

export async function addForgeWearables(sendToAddress: string) {
  // Replace wrongly added baadges with forge wearables
  const itemFile: string = "forgewearables3";
  const svgFile: string = "forgewearables3";
  const sleeveStartId: string = "55"; // last sleeve id for this set is 57

  const args: AddItemTypesTaskArgs = {
    diamondAddress: maticDiamondAddress,
    itemFile: itemFile,
    svgFile: svgFile,
    sleeveStartId: sleeveStartId,
    uploadItemTypes: true,
    uploadWearableSvgs: true,
    uploadSleeveSvgs: true,

    replaceItemTypes: false,
    replaceWearableSvgs: false,
    replaceSleeveSvgs: false,
    associateSleeves: true,
    sendToAddress: sendToAddress,
  };

  await run("addItemTypes", args);
}

if (require.main === module) {
  addForgeWearables(maticForgeDiamond)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
