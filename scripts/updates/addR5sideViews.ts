import { ethers } from "hardhat";

import {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
  wearablesLeftSleeveSvgs,
  wearablesRightSleeveSvgs,
  wearablesBackSleeveSvgs,
} from "../../svgs/wearables-sides.js";

import {
  sideViewDimensions9
} from "../../svgs/sideViewDimensions.js";

/* const hre = require("hardhat"); */


async function main(){

  const gasPrice = 100000000000;
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let account1Signer;
  let account1Address;
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
    signer = await ethers.getSigner(owner);
    let dao = await ethers.getContractAt("DAOFacet", diamondAddress, signer);
    [account1Signer] = await ethers.getSigners();
    account1Address = await account1Signer.getAddress();
    let tx = await dao.addItemManagers([account1Address]);
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
    /* console.log("assigned", account1Address, "as item manager"); */
  } else if (hre.network.name === "matic") {
    const accounts = await ethers.getSigners();
    const account = await accounts[0].getAddress();
    /* console.log("account:", account); */

    signer = accounts[0]; //new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }

  async function updateSvgs(svg: any, svgType: string, svgId: number, testing: boolean, uploadSigner: any) {
    const svgFacet = await ethers.getContractAt(
      "SvgFacet",
      diamondAddress,
      uploadSigner
    );
    let svgLength = new TextEncoder().encode(svg[svgId]).length;
    const array = [
      {
        svgType: ethers.utils.formatBytes32String(svgType),
        ids: [svgId],
        sizes: [svgLength],
      },
    ];

    let tx = await svgFacet.updateSvg(svg[svgId], array, {
      gasPrice: gasPrice,
    });
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
  }

  let itemSigner;
  if (testing) {
    itemSigner = account1Signer;
  } else {
    itemSigner = signer;
  }

  //wearables
  const updatingLeftSvgs = 264;
  const updatingRightSvgs = 264;
  const updatingBackSvgs = 264;

  //left
  for (var i = 245; i < updatingLeftSvgs; i++) {
    await updateSvgs(
      wearablesLeftSvgs,
      "wearables-left",
      i,
      testing,
      itemSigner
    );
  }

  //right
  for (var i = 245; i < updatingRightSvgs; i++) {
    await updateSvgs(
      wearablesRightSvgs,
      "wearables-right",
      i,
      testing,
      itemSigner
    );
  }

  //back
  for (var i = 245; i < updatingBackSvgs; i++) {
    await updateSvgs(
      wearablesBackSvgs,
      "wearables-back",
      i,
      testing,
      itemSigner
    );
  }

  //sleeves
  const updatingSleevesLeft = [36, 37, 38, 39, 40]
  const updatingSleevesRight = [36, 37, 38, 39, 40]
  const updatingSleevesBack = [36, 37, 38, 39, 40]

  for (var i = 0; i < updatingSleevesLeft.length; i++) {
    await updateSvgs(wearablesLeftSleeveSvgs, 'sleeves-left', updatingSleevesLeft[i], testing, itemSigner)
  }

  for (var i = 0; i < updatingSleevesRight.length; i++) {
    await updateSvgs(wearablesRightSleeveSvgs, 'sleeves-right', updatingSleevesRight[i], testing, itemSigner)
  }

  for (var i = 0; i < updatingSleevesBack.length; i++) {
    await updateSvgs(wearablesBackSleeveSvgs, 'sleeves-back', updatingSleevesBack[i], testing, itemSigner)
  }

  //dimensions
  const svgViewsFacet = await ethers.getContractAt(
    "SvgViewsFacet",
    diamondAddress,
    itemSigner
  );

  let tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions9, {
    gasPrice: gasPrice,
  });
  let receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }

// **** Test ****
  // BODY = 0;
  // FACE = 1;
  // EYES = 2;
  // HEAD = 3;
  // RIGHT = 4;
  // LEFT = 5;
  // PET = 6;
  // BG = 7;

  const numTraits1 = [99, 99, 99, 99, 12, 9];
  const wearables1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const sidePreview = await svgViewsFacet.previewSideAavegotchi("2", "0xE0b22E0037B130A9F56bBb537684E6fA18192341", numTraits1, wearables1);
  console.log("Side Preview: ", sidePreview);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

  exports.addR5sideViews = main;