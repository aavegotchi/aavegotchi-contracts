import { Signer } from "ethers";
import { ethers, network, run } from "hardhat";
import { itemManagerAlt } from "./helperFunctions";
import {
  bodyWearable,
  BodyWearableOutput,
  updateSleevesTaskForSvgType,
} from "./svgHelperFunctions";

async function main() {
  let testing = ["hardhat", "localhost"].includes(network.name);
  let signer: Signer;

  const accounts = await ethers.getSigners();

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManagerAlt],
    });
    signer = await ethers.provider.getSigner(itemManagerAlt);
  } else if (network.name === "matic") {
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }

  const sleeve = await updateSleevesTaskForSvgType([36], "front");
  const wearableId = 248;
  const output: BodyWearableOutput = bodyWearable(
    `${wearableId}_UpOnlyShirt`,
    "svgItems"
  );

  await run("updateSvgs", sleeve);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
