import { run } from "hardhat";
import { Signer } from "@ethersproject/abstract-signer";
import { DAOFacet } from "../../typechain";
import { maticDiamondAddress } from "../../scripts/helperFunctions";
import { HardhatRuntimeEnvironment } from "hardhat/types";
const hre = require("hardhat"); //had to use this because `HardhatRuntimeEnvironment` didn't work in this test script
async function batchDeposit() {
  ///Start Test
  let signer: Signer;

  //increase limit and mint more items
  const itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const diamondAddress = maticDiamondAddress;

  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [itemManager],
  });
  signer = await hre.ethers.provider.getSigner(itemManager);

  const dao = (
    await hre.ethers.getContractAt("DAOFacet", diamondAddress)
  ).connect(signer) as DAOFacet;
  console.log("increasing limits");
  await await dao.updateItemTypeMaxQuantity([111], [1000]);
  console.log("minting items");
  await dao.mintItems(itemManager, [111], [5]);
  ///End Test
  await run("batchDeposit", {
    filename: "testDrop",
    quantity: "1",
    itemId: "111",
  });
}

batchDeposit()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.batchDeposit = batchDeposit;
