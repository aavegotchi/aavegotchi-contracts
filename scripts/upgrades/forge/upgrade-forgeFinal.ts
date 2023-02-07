import { deployAndUpgradeForgeDiamond } from "./upgrade-deployAndUpgradeForgeDiamond";
import { upgradeAavegotchiForForge } from "./upgrade-aavegotchiForForge";
import { setForgeProperties } from "./upgrade-forgeSetters";
import { addForgeAssetsToBaazaar } from "../../updates/addForgeAssetsToBaazaar";

export async function releaseForge() {
  console.log("Starting forge release...");

  let forgeDiamondAddress = await deployAndUpgradeForgeDiamond();
  await setForgeProperties(forgeDiamondAddress);
  await upgradeAavegotchiForForge(forgeDiamondAddress);
  await addForgeAssetsToBaazaar(forgeDiamondAddress);

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
