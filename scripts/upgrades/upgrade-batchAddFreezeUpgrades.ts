import { upgrade as upgradeWearableDiamond } from "./wearableDiamond/upgrade-addFreezeFn";
import { upgrade as upgradeForgeDiamond } from "./forge/upgrade-addFreezeFn";
import { upgrade as upgradeAavegotchiDiamond } from "./upgrade-addFreezeFn";

async function main() {
  await upgradeWearableDiamond();
  await upgradeForgeDiamond();
  await upgradeAavegotchiDiamond();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
