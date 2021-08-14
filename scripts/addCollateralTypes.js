/* global ethers */
const { LedgerSigner } = require("@ethersproject/hardware-wallets");
const { getCollaterals } = require("../scripts/collateralTypes.js");

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
  } else if (hre.network.name === "matic") {
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

    let h1collaterals = await collateralFacet.collaterals("1");
    console.log("h1 before adding:", h1collaterals);

    tx = await itemManagerDaoFacet.addCollateralTypes(
      1,
      getCollaterals("matic", ghstAddress)
    );
  } else {
    const daoFacet = await ethers.getContractAt(
      "DAOFacet",
      diamondAddress,
      signer
    );
    tx = await daoFacet.addCollateralTypes(
      1,
      getCollaterals("matic", ghstAddress)
    );
  }
  console.log("Adding Collateral Types for H1 tx:", tx.hash);
  let receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Adding Collateral Types for H1 failed: ${tx.hash}`);
  }

  h1collaterals = await collateralFacet.collaterals("1");
  console.log("h1 after adding:", h1collaterals);

  return {
    signer,
    diamondAddress,
    ghstAddress,
  };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.upgradeHauntCollateralTypes = main;
