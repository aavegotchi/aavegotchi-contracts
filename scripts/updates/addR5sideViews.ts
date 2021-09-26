import { ethers, network } from "hardhat";

import {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
  wearablesLeftSleeveSvgs,
  wearablesRightSleeveSvgs,
  wearablesBackSleeveSvgs,
} from "../../svgs/wearables-sides";

import { sideViewDimensions9 } from "../../svgs/sideViewDimensions";
import { SvgFacet } from "../../typechain";


/* const hre = require("hardhat"); */

async function main() {

  const gasPrice = 7666197020;
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let account1Signer;
  let account1Address;
  let signer;

  let owner = await (
    await ethers.getContractAt("OwnershipFacet", diamondAddress)
  ).owner();
  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
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
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    const account = await accounts[0].getAddress();
    /* console.log("account:", account); */

    signer = accounts[0]; //new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }

  async function uploadSvgs(
    svg: any,
    svgType: string,
    svgId: number,
    uploadSigner: any
  ) {
    const svgFacet = (await ethers.getContractAt(
      "SvgFacet",
      diamondAddress,
      uploadSigner
    )) as SvgFacet;

    let svgLength = new TextEncoder().encode(svg[svgId]).length;
    const array = [
      {
        svgType: ethers.utils.formatBytes32String(svgType),
        sizes: [svgLength],
      },
    ];

    let tx = await svgFacet.storeSvg(svg[svgId], array, {
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
  console.log("Updating left side");
  for (var i = 245; i < updatingLeftSvgs; i++) {
    console.log("i:", i);
    await uploadSvgs(
      wearablesLeftSvgs,
      "wearables-left",
      i,
      itemSigner
    );
  }

  //right
  console.log("Updating right side");
  for (var i = 245; i < updatingRightSvgs; i++) {
    await uploadSvgs(
      wearablesRightSvgs,
      "wearables-right",
      i,
      itemSigner
    );
  }

  //back
  console.log("Updating back side");
  for (var i = 245; i < updatingBackSvgs; i++) {
    await uploadSvgs(
      wearablesBackSvgs,
      "wearables-back",
      i,
      itemSigner
    );
  }

  //sleeves
  const updatingSleevesLeft = [36, 37, 38, 39, 40];
  const updatingSleevesRight = [36, 37, 38, 39, 40];
  const updatingSleevesBack = [36, 37, 38, 39, 40];

  for (var i = 0; i < updatingSleevesLeft.length; i++) {
    await uploadSvgs(
      wearablesLeftSleeveSvgs,
      "sleeves-left",
      updatingSleevesLeft[i],
      itemSigner
    );
  }

  for (var i = 0; i < updatingSleevesRight.length; i++) {
    await uploadSvgs(
      wearablesRightSleeveSvgs,
      "sleeves-right",
      updatingSleevesRight[i],
      itemSigner
    );
  }

  for (var i = 0; i < updatingSleevesBack.length; i++) {
    await uploadSvgs(
      wearablesBackSleeveSvgs,
      "sleeves-back",
      updatingSleevesBack[i],
      itemSigner
    );
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

   let numTraits1 : [number,number,number,number,number,number]=[99, 99, 99, 99, 12, 9];

  let wearables1 :[number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number]= [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const sidePreview = await svgViewsFacet.previewSideAavegotchi(
    "2",
    "0xE0b22E0037B130A9F56bBb537684E6fA18192341",
    numTraits1,
    wearables1
  );
  console.log("Side Preview: ", sidePreview);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addR5sideViews = main;
