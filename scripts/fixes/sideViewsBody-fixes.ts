
//updating IDs 69 (farmer pitchfork) 229 (Lasso),

import { ethers, network } from "hardhat";

import {
  wearablesSvgs,
} from "../../svgs/wearables";

import { SvgFacet } from "../../typechain";
import { uploadOrUpdateSvg } from "../svgHelperFunctions";
import { Signer } from "@ethersproject/abstract-signer";
import { gasPrice } from "../helperFunctions";

async function main() {
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

    console.log("signer:", signer);
  } else {
    throw Error("Incorrect network selected");
  }

  const svgFacet = (await ethers.getContractAt(
    "SvgFacet",
    diamondAddress,
    signer
  )) as SvgFacet;

  //dimensions
  console.log("Updating Dimensions");
  
  const pajamaPants = [91];
  const rastaShirt = [109];
  const hawaiianBlueShirt = [115];

  const pajamaDimensions = [
    { x:11, y:31, width:42, height:22 }
  ];

/*   const rastaDimensions = [
    { x:12, y:33, width:40, height:15 }
  ]; */

  const hawaiianDimensions = [
    { x:12, y:32, width:40, height:21 }
  ];
  
  let tx = await svgFacet.setItemsDimensions(pajamaPants, pajamaDimensions)
  console.log('Setting SVG dimensions')
  let receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`)
  }
  
/*   tx = await svgFacet.setItemsDimensions(rastaShirt, rastaDimensions)
  console.log('Setting SVG dimensions')
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`)
  } */
  
  tx = await svgFacet.setItemsDimensions(hawaiianBlueShirt, hawaiianDimensions)
  console.log('Setting SVG dimensions')
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Error with transaction: ${tx.hash}`)
  }


  //test
  const svgViewsFacet = await ethers.getContractAt(
    "SvgViewsFacet",
    diamondAddress,
    signer
  );

    // // **** Test ****
  // // BODY = 0;
  // // FACE = 1;
  // // EYES = 2;
  // // HEAD = 3;
  // // RIGHT = 4;
  // // LEFT = 5;
  // // PET = 6;
  // // BG = 7;

  let numTraits1 :[
    number,number,number,number,
    number,number
  ]=[99, 99, 99, 99, 12, 9];

  let wearables1 :[
    number,number,number,number,
    number,number,number,number,
    number,number,number,number,
    number,number,number,number
  ]= [115, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const sidePreview = await svgViewsFacet.previewSideAavegotchi(
    "2",
    /* "0xE0b22E0037B130A9F56bBb537684E6fA18192341", //Dai */
    "0x20D3922b4a1A8560E1aC99FBA4faDe0c849e2142", //aWEth
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
