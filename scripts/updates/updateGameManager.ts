/* global ethers */
/* eslint prefer-const: "off" */
import { ethers, network } from "hardhat";
import { DAOFacet } from "../../typechain";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { gasPrice } from "../helperFunctions";

// const { sendToMultisig } = require("../libraries/multisig/multisig");

async function main() {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let signer;
  let owner = await (
    await ethers.getContractAt("OwnershipFacet", diamondAddress)
  ).owner();
  const testing = ["hardhat", "localhost"].includes(network.name);
  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);
  } else if (network.name === "matic") {
    signer = new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }

  let daoFacet = (await ethers.getContractAt(
    "DAOFacet",
    diamondAddress,
    signer
  )) as DAOFacet;
  let tx;
  let receipt;

  let gameManager = "0x8D46fd7160940d89dA026D59B2e819208E714E82";

  const xpLimit = [1000000];

  let gameManagers = [gameManager];
  console.log("Adding item managers");

  if (testing) {
    //first remove
    tx = await daoFacet.removeGameManagers(gameManagers, {
      gasPrice: gasPrice,
    });

    tx = await daoFacet.addGameManagers(gameManagers, xpLimit, {
      gasPrice: gasPrice,
    });
    console.log("Adding game managers tx:", tx.hash);
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Adding game manager failed: ${tx.hash}`);
    }
    console.log("Adding game manager succeeded:", tx.hash);
  } else {
    //first remove

    console.log("Removing");
    tx = await daoFacet.removeGameManagers(gameManagers, {
      gasPrice: gasPrice,
    });
    await tx.wait();

    console.log("Adding");
    tx = await daoFacet.addGameManagers(gameManagers, xpLimit, {
      gasPrice: gasPrice,
    });
    await tx.wait();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
