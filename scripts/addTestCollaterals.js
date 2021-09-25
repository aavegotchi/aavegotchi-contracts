/* global ethers */
const { LedgerSigner } = require("@ethersproject/hardware-wallets");
const { getCollaterals } = require("../scripts/collateralTypesHaunt2.js");

async function main() {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

  let signer;
  let tx;
  const testing = ["hardhat", "localhost"].includes(hre.network.name);

  if (testing) {
    let itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.provider.getSigner(itemManager);
  } else if (hre.network.name === "hardhat") {
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  // Add collateral types for H1

  if (testing) {
    const itemManagerDaoFacet = await ethers.getContractAt(
      "DAOFacet",
      diamondAddress,
      signer
    );

    collateralFacet = await ethers.getContractAt(
      "CollateralFacet",
      diamondAddress
    );

    const collaterals = await collateralFacet.getAllCollateralTypes();
    console.log("all collaterals:", collaterals);

    let h2collaterals = await collateralFacet.collaterals("2");
    console.log("h2 before adding:", h2collaterals);

    tx = await itemManagerDaoFacet.addCollateralTypes(
      2,
      getCollaterals("hardhat", ghstAddress)
    );
  } else {
    const daoFacet = await ethers.getContractAt(
      "DAOFacet",
      diamondAddress,
      signer
    );
    tx = await daoFacet.addCollateralTypes(
      2,
      getCollaterals("hardhat", ghstAddress)
    );
  }
  console.log("Adding Collateral Types for H2 tx:", tx.hash);
  let receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Adding Collateral Types for H2 failed: ${tx.hash}`);
  }

  h2collaterals = await collateralFacet.collaterals("2");
  console.log("h2 after adding:", h2collaterals);

  return {
    signer,
    diamondAddress,
    ghstAddress,
  };
}

main()
  .then(() => console.log("completed"))
  .catch((error) => {
    console.error(error);
  });

exports.upgradeH2 = main;
