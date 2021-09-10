/* global ethers */
const { sendToMultisig } = require("../libraries/multisig/multisig.js");
const { LedgerSigner } = require("@ethersproject/hardware-wallets");

async function main() {
  const gasPrice = 2000000000;
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let signer;
  let facet;
  let tx;
  const testing = ["hardhat", "localhost"].includes(hre.network.name);

  if (testing) {
    const owner = await (
      await ethers.getContractAt("OwnershipFacet", diamondAddress)
    ).owner();
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner]
    });
    signer = await ethers.provider.getSigner(owner);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }

  const facetFactory = await ethers.getContractFactory("ItemsRollbackFacet");
  facet = await facetFactory.deploy({
    gasPrice: gasPrice
  });
  await facet.deployed();
  console.log("ItemsRollbackFacet deployed:", facet.address);

  const diamondCut = (
    await ethers.getContractAt("IDiamondCut", diamondAddress)
  ).connect(signer);

  let functionCall = facet.interface.encodeFunctionData("rollback");

  if (testing) {
    tx = await diamondCut.diamondCut([], facet.address, functionCall, { gasLimit: 20000000 });
    console.log("Diamond cut tx:", tx.hash);
    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
  } else {
    tx = await diamondCut.populateTransaction.diamondCut([], facet.address, functionCall, { gasLimit: 800000 });
    console.log("tx:", tx);
    await sendToMultisig(process.env.DIAMOND_UPGRADER, signer, tx);
    console.log("Sent to multisig");
  }

  console.log("Rollback completed.");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.upgradeItemsRollback = main;
