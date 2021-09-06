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

  console.log("===========");
  console.log("Rolling back 0xed3BBbe2e3eacE311a94b059508Bbdda9149AB23");

  let functionCall = facet.interface.encodeFunctionData("rollback1");

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

  // test
  console.log("Checking the result of rolling back");
  const itemsFacet = await ethers.getContractAt("contracts/Aavegotchi/facets/ItemsFacet.sol:ItemsFacet", diamondAddress);
  let bals = await itemsFacet.itemBalancesOfToken(diamondAddress, 1172);
  console.log(bals);

  console.log("===========");
  console.log("Rolling back 0x69aC8b337794dAD862C691b00ccc3a89F1F3293d");

  console.log("Checking balances before rolling back");
  // check balances before
  const userAddress = "0x69aC8b337794dAD862C691b00ccc3a89F1F3293d";
  const aavegotchiWearables = await (await ethers.getContractAt("contracts/shared/interfaces/IERC1155.sol:IERC1155", diamondAddress)).connect(signer);
  for (const tokenId of [57, 58, 59]) {
    let bals = await aavegotchiWearables.balanceOf(diamondAddress, tokenId);
    console.log(`${diamondAddress}(diamond): ${tokenId}: ${bals}`);
    bals = await aavegotchiWearables.balanceOf(userAddress, tokenId);
    console.log(`${userAddress}(user): ${tokenId}: ${bals}`);
  }

  functionCall = facet.interface.encodeFunctionData("rollback2");
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

  console.log("Checking balances after rolling back");
  for (const tokenId of [57, 58, 59]) {
    let bals = await aavegotchiWearables.balanceOf(diamondAddress, tokenId);
    console.log(`${diamondAddress}(diamond): ${tokenId}: ${bals}`);
    bals = await aavegotchiWearables.balanceOf(userAddress, tokenId);
    console.log(`${userAddress}(user): ${tokenId}: ${bals}`);
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
