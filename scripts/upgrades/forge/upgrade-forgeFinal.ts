import { deployAndUpgradeForgeDiamond } from "./upgrade-deployAndUpgradeForgeDiamond";
import { upgradeAavegotchiForForge } from "./upgrade-aavegotchiForForge";
import { setForgeProperties } from "./upgrade-forgeSetters";
import { addForgeAssetsToBaazaar } from "../../updates/addForgeAssetsToBaazaar";
import { addForgeWearables } from "../../taskScripts/addForgeWearables";
import { addForgeWearableSideViews } from "../../taskScripts/addForgeWearablesSideViews";
import { upgradeEditItemTypes } from "../upgrade-editItemTypes";

export async function releaseForge() {
  console.log("Starting forge release...");

  // let forgeDiamondAddress = await deployAndUpgradeForgeDiamond();

  const forgeDiamondAddress = "0x4fDfc1B53Fd1D80d969C984ba7a8CE4c7bAaD442";
  // await setForgeProperties(forgeDiamondAddress);

  // await upgradeAavegotchiForForge(forgeDiamondAddress);

  // await addForgeAssetsToBaazaar(forgeDiamondAddress);

  // //Add wearables onchain
  // await addForgeWearables(forgeDiamondAddress);
  await addForgeWearableSideViews();

  console.log("Finished forge release.");

  return forgeDiamondAddress;
}

if (require.main === module) {
  releaseForge()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
