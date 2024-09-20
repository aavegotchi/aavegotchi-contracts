import { ethers, network } from "hardhat";
import { Signer } from "@ethersproject/abstract-signer";

import {
  gasPrice,
  itemManagerAlt,
  maticDiamondAddress,
} from "../helperFunctions";

export async function main() {
  const ids: number[] = [416, 417];
  const maxQty: number[] = [50, 50];

  let signer: Signer;

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManagerAlt],
    });
    signer = await ethers.getSigner(itemManagerAlt);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0];

    console.log("signer:", signer);
  } else {
    throw Error("Incorrect network selected");
  }

  const daoFacet = await ethers.getContractAt(
    "DAOFacet",
    maticDiamondAddress,
    signer
  );

  //Update max quantity
  let tx;
  let receipt;
  console.log("Update ItemTypeMaxQuantities");
  tx = await daoFacet.updateItemTypeMaxQuantity(ids, maxQty, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Not Sent: ${tx.hash}`);
  }
  console.log("Updated ItemTypeMaxQuantities successfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
