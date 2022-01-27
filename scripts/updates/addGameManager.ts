import { ethers, network } from "hardhat";
import { gasPrice } from "../helperFunctions";

import { sendToMultisig } from "../libraries/multisig/multisig";

const { LedgerSigner } = require("@ethersproject/hardware-wallets");

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
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
    console.log("signer:", signer);
  } else {
    throw Error("Incorrect network selected");
  }

  let daoFacet = await ethers.getContractAt("DAOFacet", diamondAddress, signer);
  let tx;
  let receipt;

  let gameManagers = ["0x8D46fd7160940d89dA026D59B2e819208E714E82"];
  console.log("Adding Game Manager");

  if (testing) {
    tx = await daoFacet.addGameManagers(gameManagers, [1000]);
    console.log("Adding game managers tx:", tx.hash);
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Adding item manager failed: ${tx.hash}`);
    }
    console.log("Adding item manager succeeded:", tx.hash);

    let balance = await daoFacet.gameManagerBalance(gameManagers[0]);
    console.log("balance:", balance.toString());

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [gameManagers[0]],
    });
    let gmSigner = await ethers.provider.getSigner(gameManagers[0]);

    const gameManagerDaoFacet = await ethers.getContractAt(
      "DAOFacet",
      diamondAddress,
      gmSigner
    );

    await gameManagerDaoFacet.grantExperience([1484], [1000]);
    balance = await daoFacet.gameManagerBalance(gameManagers[0]);
    console.log("balance:", balance.toString());

    const refreshTime = await daoFacet.gameManagerRefreshTime(gameManagers[0]);
  } else {
    try {
      tx = await daoFacet.populateTransaction.addGameManagers(
        gameManagers,
        [1000000],
        { gasPrice: gasPrice }
      );
      console.log("tx:", tx);
      //@ts-ignore
      await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx, ethers);
    } catch (error) {
      console.log("error:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
