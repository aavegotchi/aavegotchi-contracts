/* global ethers hre */
/* eslint prefer-const: "off" */

const { LedgerSigner } = require("@ethersproject/hardware-wallets");

const { aavegotchiSvgs } = require("../../svgs/aavegotchi-side.js");

const {
  sideViewDimensions1,
  sideViewDimensions2,
  sideViewDimensions3,
  sideViewDimensions4,
  sideViewDimensions5,
  sideViewDimensions6,
  sideViewDimensions7,
  sideViewDimensions8,
} = require("../../svgs/sideViewDimensions.js");

const gasPrice = 70000000000;

async function main() {
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let account1Signer;
  let account1Address;
  let signer;
  let facet;
  let owner = await (
    await ethers.getContractAt("OwnershipFacet", diamondAddress)
  ).owner();
  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await ethers.getSigner(owner);
    let dao = await ethers.getContractAt("DAOFacet", diamondAddress, signer);
    [account1Signer] = await ethers.getSigners();
    account1Address = await account1Signer.getAddress();
    let tx = await dao.addItemManagers([account1Address]);
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
    console.log("assigned", account1Address, "as item manager");
  } else if (hre.network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }

  let tx;
  let receipt;
  let itemSigner;

  if (testing) {
    itemSigner = account1Signer;
  } else {
    itemSigner = signer;
  }

  //dimensions
  const svgViewsFacet = await ethers.getContractAt(
    "SvgViewsFacet",
    diamondAddress,
    itemSigner
  );

  /*  //ID's 1 - 79
  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions1, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 1");
  */

  //ID's 80 - 118
/*   tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions2, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 2"); */

  //ID's 119 - 140
  
  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions3, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 3");

  //ID's 141 - 161 & 201 - 204
  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions4, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 4");

  //ID's 199 - 209
  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions5, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 5");

  //ID's 211 - 216
  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions6, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 6");

  //ID's 217 - 227
  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions7, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 7");

  //ID's 228 - 24
  tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions8, {
    gasPrice: gasPrice,
  });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
  console.log("Uploaded item side dimensions 8");
 
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.sideViewDimensionsUpdate = main;
