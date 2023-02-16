import { run } from "hardhat";
import { AddItemTypesTaskArgs } from "../../tasks/addItemTypes";
import { maticDiamondAddress, xpRelayerAddress } from "../helperFunctions";

export async function addForgeWearables(sendToAddress: string) {
  // await upgradeEditItemTypes();

  // Replace wrongly added baadges with forge wearables
  const itemFile: string = "forgewearables1";
  const svgFile: string = "forgewearables1";
  const sleeveStartId: string = "52"; // last sleeve id for this set is 54

  const args: AddItemTypesTaskArgs = {
    diamondAddress: maticDiamondAddress,
    itemFile: itemFile,
    svgFile: svgFile,
    sleeveStartId: sleeveStartId,
    uploadItemTypes: false,
    uploadWearableSvgs: true,
    uploadSleeveSvgs: true,

    replaceItemTypes: true,
    replaceWearableSvgs: false,
    replaceSleeveSvgs: false,
    associateSleeves: true,
    sendToAddress: sendToAddress,
  };

  // await run("addItemTypes", args);

  // Add remained forge wearables
  const itemFile2: string = "forgewearables2";
  const svgFile2: string = "forgewearables2";
  const sleeveStartId2: string = "54"; // last sleeve id for this set is 51

  const args2: AddItemTypesTaskArgs = {
    diamondAddress: maticDiamondAddress,
    itemFile: itemFile2,
    svgFile: svgFile2,
    sleeveStartId: sleeveStartId2,
    uploadItemTypes: true,
    uploadWearableSvgs: true,
    uploadSleeveSvgs: true,

    replaceItemTypes: false,
    replaceWearableSvgs: false,
    replaceSleeveSvgs: false,
    associateSleeves: true,
    sendToAddress: sendToAddress,
  };

  await run("addItemTypes", args2);

  // add sideview dimensions for forge wearables
  // await addSideViews();
}

if (require.main === module) {
  addForgeWearables("0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF")
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
