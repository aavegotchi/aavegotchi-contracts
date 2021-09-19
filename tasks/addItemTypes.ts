import { LedgerSigner } from "@ethersproject/hardware-wallets";

// import { ethers, network } from "hardhat";

import { task } from "hardhat/config";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import {
  getItemTypes,
  ItemTypeOutput,
  SleeveObject,
} from "../scripts/itemTypeHelpers";
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

task("addItemTypes", "Deploys a Diamond Cut, given an address, facers, and ")
  .addParam("itemManager", "Address of the item manager", "0")
  .addParam("diamondAddress", "Address of the Diamond to upgrade")
  .addParam("itemFile", "File name of the items to add")
  .addParam("svgFile", "File name of the itemType SVGs")
  .addOptionalParam("sleeveStartId", "ID of the sleeve to start at")

  .setAction(async (taskArgs, hre: any) => {
    const itemFile: string = taskArgs.itemFile;
    const diamondAddress: string = taskArgs.diamondAddress;
    const svgFile: string = taskArgs.svgFile;
    const sleeveStartId: string = taskArgs.sleeveStartId;
    const itemManager = taskArgs.itemManager;

    const {
      itemTypes: currentItemTypes,
    } = require(`../scripts/addItemTypes/${itemFile}.ts`);

    const { wearables, sleeves } = require(`../svgs/${svgFile}.ts`);

    const itemTypesArray: ItemTypeOutput[] = getItemTypes(currentItemTypes);

    console.log("item types array:", itemTypesArray);

    const svgsArray: string[] = wearables;
    const sleeveSvgsArray: SleeveObject[] = sleeves;

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

    console.log("Adding items", 0, "to", currentItemTypes.length);

    tx = await daoFacet.addItemTypes(itemTypesArray, { gasPrice: gasPrice });

    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
    console.log("Items were added:", tx.hash);

    console.log("Upload SVGs");
    await uploadSvgs(
      signer,
      diamondAddress,
      svgsArray,
      "wearables",
      hre.ethers
    );

    console.log("Uploading Sleeves");

    await uploadSvgs(
      signer,
      diamondAddress,
      sleeveSvgsArray.map((value) => value.svg),
      "sleeves",
      hre.ethers
    );

    interface SleeveInput {
      sleeveId: BigNumberish;
      wearableId: BigNumberish;
    }

    let sleevesSvgId: number = Number(sleeveStartId);
    let sleevesInput: SleeveInput[] = [];
    for (const sleeve of sleeveSvgsArray) {
      sleevesInput.push({
        sleeveId: sleevesSvgId,
        wearableId: sleeve.id,
      });
      sleevesSvgId++;
    }

    console.log("Associating sleeves svgs with body wearable svgs.");
    tx = await svgFacet.setSleeves(sleevesInput, { gasPrice: gasPrice });
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
    console.log("Sleeves associated:", tx.hash);
  });
