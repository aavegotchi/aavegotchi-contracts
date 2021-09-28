import { run, ethers } from "hardhat";
/* import {  } from "../../tasks/addItemTypes"; */
/* import { maticDiamondAddress } from "../helperFunctions"; */
/* import { HardhatRuntimeEnvironment } from "hardhat/types"; */

import {
  wearablesLeftSvgs,
  wearablesRightSvgs,
  wearablesBackSvgs,
  wearablesLeftSleeveSvgs,
  wearablesRightSleeveSvgs,
  wearablesBackSleeveSvgs,
} from "../../svgs/wearables-sides.js";

import {
  sideViewDimensions8
} from "../../svgs/sideViewDimensions.js";


async function main(){

  const gasPrice = 100000000000;
  const diamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  let account1Signer;
  let account1Address;
  let signer;

/*   let owner = await (
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
  } else if (hre.network.name === "matic") {
    const accounts = await ethers.getSigners();
    const account = await accounts[0].getAddress();

    signer = accounts[0]; //new LedgerSigner(ethers.provider);
  } else {
    throw Error("Incorrect network selected");
  } */


  async function updateSvgs(svg: any, svgType: string, svgId: number, uploadSigner: any) {
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

  let itemSigner = signer;

  //wearables
  const updatingLeftSvgs = [229]
  const updatingRightSvgs = [229]
  const updatingBackSvgs = [144, 145, 229]

  //left
  for (var i = 0; i < updatingLeftSvgs.length; i++) {
    await updateSvgs(
      wearablesLeftSvgs,
      "wearables-left",
      updatingLeftSvgs[i],
      itemSigner
    );
  }

  //right
  for (var i = 0; i < updatingRightSvgs.length; i++) {
    await updateSvgs(
      wearablesRightSvgs,
      "wearables-right",
      updatingRightSvgs[i],
      itemSigner
    );
  }

  //back
  for (var i = 0; i < updatingRightSvgs.length; i++) {
    await updateSvgs(
      wearablesBackSvgs,
      "wearables-back",
      updatingBackSvgs[i],
      itemSigner
    );
  }

  //dimensions
  const svgViewsFacet = await ethers.getContractAt(
    "SvgViewsFacet",
    diamondAddress,
    itemSigner
  );

  let tx = await svgViewsFacet.setSideViewDimensions(sideViewDimensions8, {
    gasPrice: gasPrice,
  });
  let receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }


  // BODY = 0;
  // FACE = 1;
  // EYES = 2;
  // HEAD = 3;
  // RIGHT = 4;
  // LEFT = 5;
  // PET = 6;
  // BG = 7;

  const numTraits1 = [99, 99, 99, 99, 12, 9];
  const wearables1 = [0, 0, 0, 145, 229, 229, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const sidePreview = await svgViewsFacet.previewSideAavegotchi("2", "0xE0b22E0037B130A9F56bBb537684E6fA18192341", numTraits1, wearables1);
  console.log("Side Preview: ", sidePreview);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

  exports.sideViewsUpdate3 = main;