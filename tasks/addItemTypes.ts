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
  uploadSvgs,
  updateSvgs,
} from "../scripts/svgHelperFunctions";
import { gasPrice } from "../scripts/helperFunctions";
import { HardhatRuntimeEnvironment } from "hardhat/types";

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

      const itemTypesArray: ItemTypeOutput[] = getItemTypes(
        currentItemTypes,
        hre.ethers
      );

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
        console.log("Upload SVGs");
        await uploadSvgs(svgFacet, svgsArray, "wearables", hre.ethers);
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
          svgFacet,
          sleeveSvgsArray.map((value) => value.svg),
          "sleeves",
          hre.ethers
        );
      }

      if (replaceSleeveSvgs) {
        await updateSvgs(
          sleeveSvgsArray.map((value) => value.svg),
          "sleeves",
          sleeveSvgsArray.map((_, index) => Number(sleeveStartId) + index),
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

        console.log("sleeves input:", sleevesInput);

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
