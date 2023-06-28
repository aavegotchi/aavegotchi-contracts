import { upgradeForgeGeodes } from "./upgrade-forgeGeodes";
import { setForgeGeodeProperties } from "./upgrade-forgeGeodeSetters";

export async function releaseGeodes() {
  console.log("Starting Geode release...");

  await upgradeForgeGeodes();
  await setForgeGeodeProperties();
}

if (require.main === module) {
  releaseGeodes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
