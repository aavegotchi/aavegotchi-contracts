import { LedgerSigner } from "@ethersproject/hardware-wallets";

// import { ethers, network } from "hardhat";

import { task } from "hardhat/config";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { ItemTypeOutput, SleeveObject } from "../scripts/itemTypeHelpers";
// import { gasPrice } from "../scripts/helperFunctions";
import { DAOFacet } from "../typechain/DAOFacet";
import { SvgFacet } from "../typechain/SvgFacet";
import { BigNumberish } from "@ethersproject/bignumber";
import { setupSvg, printSizeInfo } from "../scripts/svgHelperFunctions";
import { gasPrice } from "../scripts/helperFunctions";

async function uploadSvgs(
  signer: Signer,
  diamondAddress: string,
  svgs: string[],
  svgType: string,
  ethers: any
) {
  let svgFacet = (await ethers.getContractAt(
    "SvgFacet",
    diamondAddress,
    signer
  )) as SvgFacet;

  console.log("Uploading ", svgs.length, " svgs");

  console.log("Number of svg:" + svgs.length);
  let svgItemsStart = 0;
  let svgItemsEnd = 0;
  while (true) {
    let itemsSize = 0;
    while (true) {
      if (svgItemsEnd === svgs.length) {
        break;
      }
      itemsSize += svgs[svgItemsEnd].length;
      if (itemsSize > 24576) {
        break;
      }
      svgItemsEnd++;
    }
    const { svg, svgTypesAndSizes } = setupSvg(
      svgType,
      svgs.slice(svgItemsStart, svgItemsEnd),
      ethers
    );
    console.log(`Uploading ${svgItemsStart} to ${svgItemsEnd} wearable SVGs`);

    //this might be incorrect
    printSizeInfo(svgType, svgTypesAndSizes[0].sizes, ethers);

    let tx = await svgFacet.storeSvg(svg, svgTypesAndSizes);
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
    console.log("tx:", tx.hash);
    console.log(svgItemsEnd, svg.length);
    if (svgItemsEnd === svgs.length) {
      break;
    }
    svgItemsStart = svgItemsEnd;
  }
}

/*
function verifyItemTypes(itemTypes: ItemTypeOutput[]) {
  itemTypes.forEach((itemType) => {
    //Run any verifications necessary
  });
}
*/

task("addItemTypes", "Deploys a Diamond Cut, given an address, facers, and ")
  .addParam("itemManager")
  .addParam("diamondAddress", "Address of the Diamond to upgrade")
  .addParam("itemTypes", "Array of itemTypes to add")
  .addParam(
    "svgs",
    "Array of SVGs to add. Must be the same length as itemTypes"
  )
  .addOptionalParam("sleeveSvgs", "Array of sleeve svgs to add")
  .addOptionalParam("sleeveStartId", "ID of the sleeve to start at")

  .setAction(async (taskArgs, hre: any) => {
    const itemTypes: ItemTypeOutput[] = taskArgs.facets;
    const diamondAddress: string = taskArgs.diamondAddress;
    const svgs: string[] = taskArgs.svgs;
    const sleeveSvgs: SleeveObject[] = taskArgs.sleeveSvgs;
    const sleeveStartId = taskArgs.sleeveStartId;
    const itemManager = taskArgs.itemManager;

    let signer: Signer;

    let owner = itemManager;
    const testing = ["hardhat", "localhost"].includes(hre.network.name);
    if (testing) {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [owner],
      });
      signer = await hre.ethers.provider.getSigner(owner);
    } else if (hre.network.name === "matic") {
      signer = new LedgerSigner(hre.ethers.provider, "hid", "m/44'/60'/2'/0/0");
    } else {
      throw Error("Incorrect network selected");
    }

    let tx: ContractTransaction;
    let receipt: ContractReceipt;

    let daoFacet = (await hre.ethers.getContractAt(
      "DAOFacet",
      diamondAddress,
      signer
    )) as DAOFacet;

    let svgFacet = (await hre.ethers.getContractAt(
      "SvgFacet",
      diamondAddress,
      signer
    )) as SvgFacet;

    console.log("Adding items", 0, "to", itemTypes.length);

    //Run verification on all the itemTypes
    // verifyItemTypes(itemTypes);
    tx = await daoFacet.addItemTypes(itemTypes, { gasPrice: gasPrice });

    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
    console.log("Items were added:", tx.hash);

    console.log("Upload SVGs");
    await uploadSvgs(signer, diamondAddress, svgs, "wearables", hre.ethers);

    console.log("Uploading Sleeves");

    await uploadSvgs(
      signer,
      diamondAddress,
      sleeveSvgs.map((value) => value.svg),
      "sleeves",
      hre.ethers
    );

    interface SleeveInput {
      sleeveId: BigNumberish;
      wearableId: BigNumberish;
    }

    let sleevesSvgId: number = sleeveStartId;
    let sleeves: SleeveInput[] = [];
    for (const sleeve of sleeveSvgs) {
      sleeves.push({
        sleeveId: sleevesSvgId,
        wearableId: sleeve.id,
      });
      sleevesSvgId++;
    }

    console.log("Associating sleeves svgs with body wearable svgs.");
    tx = await svgFacet.setSleeves(sleeves, { gasPrice: gasPrice });
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
    console.log("Sleeves associated:", tx.hash);
  });
