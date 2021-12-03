//updating ID 8(marine jacket) front sleeves

import { Signer } from "@ethersproject/abstract-signer";
import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { run, network, ethers } from "hardhat";

import { DAOFacet } from "../../typechain";
import { maticDiamondAddress } from "../helperFunctions";

async function main() {
  const itemIds = [
    245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259,
    260, 261, 262, 263, 71, 72, 73, 74, 75,
  ];

  const ghstPrice = [
    100, 10, 10, 10, 100, 100, 100, 5, 5, 5, 300, 300, 300, 10000, 10000, 10000,
    2000, 2000, 2000, 100, 2000, 2000, 2000, 2000,
  ];

  const ghstPricesFinal = ghstPrice.map((price) =>
    ethers.utils.parseEther(price.toString())
  );

  let signer: Signer;

  let owner = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const testing = ["hardhat", "localhost"].includes(network.name);
  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);
  } else if (network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  const daoFacet = (await ethers.getContractAt(
    "DAOFacet",
    maticDiamondAddress,
    signer
  )) as DAOFacet;

  const tx = await daoFacet.batchUpdateItemsPrice(itemIds, ghstPricesFinal);
  console.log("tx hash:", tx.hash);
  await tx.wait();
  console.log("Updated item prices");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.marineJacketSleeveFix = main;
