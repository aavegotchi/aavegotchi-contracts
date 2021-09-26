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
import { uploadOrUpdateSvg } from "../svgHelperFunctions";
import { Signer } from "@ethersproject/abstract-signer";

/* const hre = require("hardhat"); */

async function main() {
  const gasPrice = 7666197020;
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  let signer: Signer;

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    signer = await ethers.getSigner(itemManager);
  } else if (network.name === "matic") {
    const accounts = await ethers.getSigners();
    signer = accounts[0]; //new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  }

  console.log("Updating Wearables");
  const itemIds = [
    245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259,
    260, 261, 262, 263,
  ];

  const svgFacet = (await ethers.getContractAt(
    "SvgFacet",
    diamondAddress,
    signer
  )) as SvgFacet;

  for (let index = 0; index < itemIds.length; index++) {
    const itemId = itemIds[index];
    const left = wearablesLeftSvgs[itemId];
    const right = wearablesRightSvgs[itemId];
    const back = wearablesBackSvgs[itemId];
    await uploadOrUpdateSvg(left, "wearables-left", itemId, svgFacet, ethers);
    await uploadOrUpdateSvg(right, "wearables-right", itemId, svgFacet, ethers);
    await uploadOrUpdateSvg(back, "wearables-back", itemId, svgFacet, ethers);
  }

  //sleeves
  console.log("Uploading sleeves");
  const sleeveIds = [36, 37, 38, 39, 40];

  for (var i = 0; i < sleeveIds.length; i++) {
    const sleeveId = sleeveIds[i];

    await uploadOrUpdateSvg(
      wearablesLeftSleeveSvgs[sleeveId],
      "sleeves-left",
      sleeveId,
      svgFacet,
      ethers
    );
    await uploadOrUpdateSvg(
      wearablesRightSleeveSvgs[sleeveId],
      "sleeves-right",
      sleeveId,
      svgFacet,
      ethers
    );
    await uploadOrUpdateSvg(
      wearablesBackSleeveSvgs[sleeveId],
      "sleeves-back",
      sleeveId,
      svgFacet,
      ethers
    );
  }

  //dimensions
  const svgViewsFacet = await ethers.getContractAt(
    "SvgViewsFacet",
    diamondAddress,
    signer
  );

  console.log("Update dimensions");
  let tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions9, {
    gasPrice: gasPrice,
  });
  let receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }

  // // **** Test ****
  // // BODY = 0;
  // // FACE = 1;
  // // EYES = 2;
  // // HEAD = 3;
  // // RIGHT = 4;
  // // LEFT = 5;
  // // PET = 6;
  // // BG = 7;

/*    let numTraits1 : [number,number,number,number,number,number]=[99, 99, 99, 99, 12, 9];

  let wearables1 :[
    number,number,number,number,
    number,number,number,number,
    number,number,number,number,
    number,number,number,number
  ]= [258, 260, 262, 263, 257, 257, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const sidePreview = await svgViewsFacet.previewSideAavegotchi(
    "2",
    "0xE0b22E0037B130A9F56bBb537684E6fA18192341",
    numTraits1,
    wearables1
  );
  console.log("Side Preview: ", sidePreview); */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.addR5sideViews = main;
