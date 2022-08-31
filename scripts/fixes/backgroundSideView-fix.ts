import { ethers, network, run } from "hardhat";
import { Signer } from "@ethersproject/abstract-signer";
import { updateSvgTaskForSvgType } from "../../scripts/svgHelperFunctions";
import { gasPrice } from "../helperFunctions";

async function main() {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  let signer: Signer;

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.getSigner(itemManager);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0]; //new LedgerSigner(ethers.provider);

    console.log("signer:", signer);
  } else {
    throw Error("Incorrect network selected");
  }

  const ids: number[] = [210];

  const leftBG = await updateSvgTaskForSvgType(ids, "left");
  const rightBG = await updateSvgTaskForSvgType(ids, "right");
  const backBG = await updateSvgTaskForSvgType(ids, "back");

  await run("updateSvgs", leftBG);
  await run("updateSvgs", rightBG);
  await run("updateSvgs", backBG);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
