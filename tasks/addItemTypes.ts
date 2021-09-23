import { LedgerSigner } from "@ethersproject/hardware-wallets";

import { task } from "hardhat/config";
import {
  Contract,
  ContractReceipt,
  ContractTransaction,
} from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import {
  getItemTypes,
  ItemTypeOutput,
  SleeveObject,
} from "../scripts/itemTypeHelpers";
import { DAOFacet } from "../typechain/DAOFacet";
import { SvgFacet } from "../typechain/SvgFacet";
import { BigNumberish } from "@ethersproject/bignumber";
import {
  setupSvg,
  printSizeInfo,
  svgTypeToBytes,
} from "../scripts/svgHelperFunctions";
import { gasPrice } from "../scripts/helperFunctions";
import { HardhatRuntimeEnvironment } from "hardhat/types";

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
    printSizeInfo(svgType, svgTypesAndSizes[0].sizes);

    console.log("svg types and sizes:", svgTypesAndSizes);

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

async function updateSvgs(
  svgs: string[],
  svgType: string,
  svgIds: number[],
  svgFacet: SvgFacet,
  hre: HardhatRuntimeEnvironment
) {
  console.log("svgs:", svgs);
  console.log("ids:", svgIds);

  for (let index = 0; index < svgIds.length; index++) {
    const svgId = svgIds[index];
    const svg = svgs[index];
    let svgLength = new TextEncoder().encode(svg).length;
    const array = [
      {
        svgType: svgTypeToBytes(svgType, hre.ethers),
        ids: [svgId],
        sizes: [svgLength],
      },
    ];

    console.log(`Update: ${svgType}: ${svgId}`);

    const gasPrice = 100000000000;

    let tx = await svgFacet.updateSvg(svg, array, {
      gasPrice: gasPrice,
    });
    console.log("tx hash:", tx.hash);
    let receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Error:: ${tx.hash}`);
    }
  }
}

export interface AddItemTypesTaskArgs {
  itemManager: string;
  diamondAddress: string;
  itemFile: string;
  svgFile: string;
  sleeveStartId: string;
  uploadItemTypes: boolean;
  uploadWearableSvgs: boolean;
  associateSleeves: boolean;
  sendToItemManager: boolean;
  replaceWearableSvgs: boolean;
  replaceSleeveSvgs: boolean;
  uploadSleeveSvgs: boolean;
}

task("addItemTypes", "Adds itemTypes and SVGs ")
  .addParam("itemManager", "Address of the item manager", "0")
  .addParam("diamondAddress", "Address of the Diamond to upgrade")
  .addParam("itemFile", "File name of the items to add")
  .addParam("svgFile", "File name of the itemType SVGs")
  .addParam("sleeveStartId", "ID of the sleeve to start at")
  .addFlag("uploadItemTypes", "Upload itemTypes")
  .addFlag("uploadWearableSvgs", "Upload the SVGs")
  .addFlag("uploadSleeveSvgs", "Upload sleeve svgs")
  .addFlag("associateSleeves", "Associate the sleeves")
  .addFlag("sendToItemManager", "Mint and send the items to itemManager")
  .addFlag("replaceWearableSvgs", "Replace wearable SVGs instead of uploading")
  .addFlag("replaceSleeveSvgs", "Replace sleeve SVGs instead of uploading")

  .setAction(
    async (taskArgs: AddItemTypesTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const itemFile: string = taskArgs.itemFile;
      const diamondAddress: string = taskArgs.diamondAddress;
      const svgFile: string = taskArgs.svgFile;
      const sleeveStartId: string = taskArgs.sleeveStartId;
      const itemManager = taskArgs.itemManager;
      const sendToItemManager = taskArgs.sendToItemManager;
      const uploadItemTypes = taskArgs.uploadItemTypes;
      const uploadWearableSvgs = taskArgs.uploadWearableSvgs;
      const associateSleeves = taskArgs.associateSleeves;
      const uploadSleeveSvgs = taskArgs.uploadSleeveSvgs;
      const replaceWearableSvgs = taskArgs.replaceWearableSvgs;
      const replaceSleeveSvgs = taskArgs.replaceSleeveSvgs;

      const {
        itemTypes: currentItemTypes,
      } = require(`../data/itemTypes/${itemFile}.ts`);

      const { getWearables } = require(`../svgs/${svgFile}.ts`);
      const { sleeves, wearables } = getWearables();

      const itemTypesArray: ItemTypeOutput[] = getItemTypes(currentItemTypes);

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
        signer = new LedgerSigner(
          hre.ethers.provider,
          "hid",
          "m/44'/60'/2'/0/0"
        );
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

      if (uploadItemTypes) {
        console.log("Adding items", 0, "to", currentItemTypes.length);

        tx = await daoFacet.addItemTypes(itemTypesArray, {
          gasPrice: gasPrice,
        });

        receipt = await tx.wait();
        if (!receipt.status) {
          throw Error(`Error:: ${tx.hash}`);
        }
        console.log("Items were added:", tx.hash);
      }

      if (uploadWearableSvgs) {
        console.log("svgs array:", svgsArray);

        console.log("Upload SVGs");
        await uploadSvgs(
          signer,
          diamondAddress,
          svgsArray,
          "wearables",
          hre.ethers
        );
      }

      if (replaceWearableSvgs) {
        await updateSvgs(
          svgsArray,
          "wearables",
          itemTypesArray.map((value) => Number(value.svgId)),
          svgFacet,
          hre
        );
      }

      if (uploadSleeveSvgs) {
        console.log("Uploading Sleeves");

        await uploadSvgs(
          signer,
          diamondAddress,
          sleeveSvgsArray.map((value) => value.svg),
          "sleeves",
          hre.ethers
        );
      }

      if (replaceSleeveSvgs) {
        await updateSvgs(
          sleeveSvgsArray.map((value) => value.svg),
          "sleeves",
          sleeveSvgsArray.map((value, index) => Number(sleeveStartId) + index),
          svgFacet,
          hre
        );
      }

      if (associateSleeves) {
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
      }

      if (sendToItemManager) {
        const itemIds: BigNumberish[] = [];
        const quantities: BigNumberish[] = [];
        itemTypesArray.forEach((itemType: ItemTypeOutput) => {
          itemIds.push(itemType.svgId);
          quantities.push(itemType.maxQuantity);
        });

        console.log("final quantities:", itemIds, quantities);

        console.log(`Mint prize items to Item Manager ${itemManager}`);

        tx = await daoFacet.mintItems(itemManager, itemIds, quantities, {
          gasPrice: gasPrice,
        });
        receipt = await tx.wait();
        if (!receipt.status) {
          throw Error(`Error:: ${tx.hash}`);
        }

        console.log("Prize items minted:", tx.hash);
      }
    }
  );
