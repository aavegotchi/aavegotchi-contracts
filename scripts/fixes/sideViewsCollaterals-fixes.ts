
//updating ETH, AAVE, USDT, USDC, YFI, TUSD

import { ethers, network } from "hardhat";

import {
  collateralsLeftSvgs,
  collateralsRightSvgs,
} from "../../svgs/collaterals-sides";

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

  console.log("Updating Wearables");
  const itemIds = [
    1, // "0x20D3922b4a1A8560E1aC99FBA4faDe0c849e2142" ETH
    2, // "0x823CD4264C1b951C9209aD0DeAea9988fE8429bF" AAVE
    4, // "0xDAE5F1590db13E3B40423B5b5c5fbf175515910b" USDT
    5, // "0x9719d867A500Ef117cC201206B8ab51e794d3F82" USDC
    7, // "0xe20f7d1f0eC39C4d5DB01f53554F2EF54c71f613" YFI
    8, // "0xF4b8888427b00d7caf21654408B7CBA2eCf4EbD9" TUSD
  ];

  const svgFacet = (await ethers.getContractAt(
    "SvgFacet",
    diamondAddress,
    signer
  )) as SvgFacet;

  for (let index = 0; index < itemIds.length; index++) {
    const itemId = itemIds[index];

    console.log("Updating SVGs for id: ", itemId);

    const left = collateralsLeftSvgs[itemId];
    const right = collateralsRightSvgs[itemId];

    try {
      await uploadOrUpdateSvg(left, "collaterals-left", itemId, svgFacet, ethers);
      await uploadOrUpdateSvg(
        right,
        "collaterals-right",
        itemId,
        svgFacet,
        ethers
      );
    } catch (error) {
      console.log("error uploading", itemId);
    }
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

  let numTraits1 :[
    number,number,number,number,
    number,number
  ]=[99, 99, 99, 99, 12, 9];

  let wearables1 :[
    number,number,number,number,
    number,number,number,number,
    number,number,number,number,
    number,number,number,number
  ]= [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const svgViewsFacet = await ethers.getContractAt(
    "SvgViewsFacet",
    diamondAddress,
    signer
  );

  const sidePreview = await svgViewsFacet.previewSideAavegotchi(
    "2",
    "0xF4b8888427b00d7caf21654408B7CBA2eCf4EbD9",
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
