/* global ethers hre */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require("@ethersproject/hardware-wallets");
const { sendToMultisig } = require("../libraries/multisig/multisig");

async function main() {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let signer;
  let owner = await (
    await ethers.getContractAt("OwnershipFacet", diamondAddress)
  ).owner();
  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.provider.getSigner(owner);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }

  let daoFacet = await ethers.getContractAt("DAOFacet", diamondAddress, signer);
  let tx;
  let receipt;

  let itemManager;

  if (testing) {
    itemManager = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
  } else {
    itemManager = "0x8D46fd7160940d89dA026D59B2e819208E714E82";
  }

  //Also added 0xb6384935d68e9858f8385ebeed7db84fc93b1420 (defender) as item manager

  let itemManagers = [itemManager];
  console.log("Adding item managers");

  if (testing) {
    tx = await daoFacet.addItemManagers(itemManagers);
    console.log("Adding item managers tx:", tx.hash);
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Adding item manager failed: ${tx.hash}`);
    }
    console.log("Adding item manager succeeded:", tx.hash);
  } else {
    tx = await daoFacet.populateTransaction.addItemManagers(itemManagers);
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
