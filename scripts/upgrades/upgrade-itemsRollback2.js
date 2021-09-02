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

  // check balances before
  const userAddress = "0x69aC8b337794dAD862C691b00ccc3a89F1F3293d";
  const aavegotchiWearables = await (await ethers.getContractAt('contracts/shared/interfaces/IERC1155.sol:IERC1155', diamondAddress)).connect(signer)
  for (const tokenId of [57, 58, 59]) {
    let bals = await aavegotchiWearables.balanceOf(diamondAddress, tokenId)
    console.log(`${diamondAddress}(diamond): ${tokenId}: ${bals}`);
    bals = await aavegotchiWearables.balanceOf(userAddress, tokenId)
    console.log(`${userAddress}(user): ${tokenId}: ${bals}`);
  }

  // deploy and run functions
  const facetFactory = await ethers.getContractFactory("ItemsRollbackFacet2");
  facet = await facetFactory.deploy({
    gasPrice: gasPrice
  });
  await facet.deployed();
  console.log("ItemsRollbackFacet deployed:", facet.address);

  let functionCall = facet.interface.encodeFunctionData("rollback");
  const diamondCut = (
    await ethers.getContractAt("IDiamondCut", diamondAddress)
  ).connect(signer);
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

  // check balance after operation
  for (const tokenId of [57, 58, 59]) {
    let bals = await aavegotchiWearables.balanceOf(diamondAddress, tokenId)
    console.log(`${diamondAddress}(diamond): ${tokenId}: ${bals}`);
    bals = await aavegotchiWearables.balanceOf(userAddress, tokenId)
    console.log(`${userAddress}(user): ${tokenId}: ${bals}`);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.upgradeItemsRollback2 = main;
