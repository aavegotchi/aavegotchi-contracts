import { upgradeForgeMultiTierGeodes } from "./upgrade-forgeMultiTierGeodes";
import { setForgeMultiTierGeodeProperties } from "./upgrade-forgeMultiTierGeodeSetters";

export async function releaseMultiTierGeodes() {
  console.log("Starting Geode release...");

  await upgradeForgeMultiTierGeodes();
  await setForgeMultiTierGeodeProperties();
}

if (require.main === module) {
  releaseMultiTierGeodes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
