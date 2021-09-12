/* global ethers hre */
/* eslint prefer-const: "off" */

import { ethers, network } from "hardhat";

import { maticDiamondAddress } from "../helperFunctions";
import { sets as wearableSets } from "./wearableSets/wearableSetsHaunt2";
import { LedgerSigner } from "@ethersproject/hardware-wallets";

async function main() {
  let signer: any;

  const testing = ["hardhat", "localhost"].includes(network.name);
  if (testing) {
    const itemManager = "0x8D46fd7160940d89dA026D59B2e819208E714E82";

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.provider.getSigner(itemManager);
  } else if (network.name === "matic") {
    //@ts-ignore
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  let daoFacet = await ethers.getContractAt(
    "DAOFacet",
    maticDiamondAddress,
    signer
  );
  let tx;
  let receipt;

  console.log(`Adding ${wearableSets.length} wearable sets`);

  console.log("sets:", wearableSets);

  tx = await daoFacet.addWearableSets(wearableSets);
  console.log("Adding wearable sets tx:", tx.hash);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Adding wearable sets failed: ${tx.hash}`);
  }
  console.log("Adding wearable sets succeeded:", tx.hash);

  let itemsFacet = await ethers.getContractAt(
    "contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet",
    maticDiamondAddress
  );
  let sets = await itemsFacet.getWearableSets();
  for (const set of sets) {
    console.log(set);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
