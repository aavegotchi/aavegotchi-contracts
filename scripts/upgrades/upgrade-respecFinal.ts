import { upgradeAavegotchiForRepec } from "./upgrade-aavegotchiForRespec";
import { setRespecProperties } from "./upgrade-respecSetters";

export async function releaseRespec() {
  console.log("Starting releaseRespec...");

  await upgradeAavegotchiForRepec()
  await setRespecProperties()

  console.log("Finished releaseRespec.");
}

if (require.main === module) {
  releaseRespec()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
