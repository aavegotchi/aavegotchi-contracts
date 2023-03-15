import { task } from "hardhat/config";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import {
  getItemTypes,
  ItemTypeOutput,
  SleeveObject,
} from "../scripts/itemTypeHelpers";
import { DAOFacet } from "../typechain/DAOFacet";
import { SvgFacet } from "../typechain/SvgFacet";
import { BigNumberish } from "@ethersproject/bignumber";
import { uploadSvgs, updateSvgs } from "../scripts/svgHelperFunctions";
import { getRelayerSigner } from "../scripts/helperFunctions";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export interface AddItemTypesTaskArgs {
  diamondAddress: string;
  itemFile: string;
  svgFile: string;
  sleeveStartId: string;
  uploadItemTypes: boolean;
  uploadWearableSvgs: boolean;
  associateSleeves: boolean;
  sendToAddress: string;
  replaceItemTypes: boolean;
  replaceWearableSvgs: boolean;
  replaceSleeveSvgs: boolean;
  uploadSleeveSvgs: boolean;
}

task("addItemTypes", "Adds itemTypes and SVGs ")
  .addParam("diamondAddress", "Address of the Diamond to upgrade")
  .addParam("itemFile", "File name of the items to add")
  .addParam("svgFile", "File name of the itemType SVGs")
  .addParam("sleeveStartId", "ID of the sleeve to start at")
  .addParam("sendToAddress", "Address to mint and send items to.")
  .addFlag("uploadItemTypes", "Upload itemTypes")
  .addFlag("uploadWearableSvgs", "Upload the SVGs")
  .addFlag("uploadSleeveSvgs", "Upload sleeve svgs")
  .addFlag("associateSleeves", "Associate the sleeves")
  .addFlag("replaceItemTypes", "Replace itemTypes instead of uploading")
  .addFlag("replaceWearableSvgs", "Replace wearable SVGs instead of uploading")
  .addFlag("replaceSleeveSvgs", "Replace sleeve SVGs instead of uploading")

  .setAction(
    async (taskArgs: AddItemTypesTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const itemFile: string = taskArgs.itemFile;
      const diamondAddress: string = taskArgs.diamondAddress;
      const svgFile: string = taskArgs.svgFile;
      const sleeveStartId: string = taskArgs.sleeveStartId;
      const sendToAddress = taskArgs.sendToAddress;
      const uploadItemTypes = taskArgs.uploadItemTypes;
      const uploadWearableSvgs = taskArgs.uploadWearableSvgs;
      const associateSleeves = taskArgs.associateSleeves;
      const uploadSleeveSvgs = taskArgs.uploadSleeveSvgs;
      const replaceItemTypes = taskArgs.replaceItemTypes;
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

      let signer = await getRelayerSigner(hre);

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

        tx = await daoFacet.addItemTypes(itemTypesArray);
        console.log("tx:", tx.hash);

        receipt = await tx.wait();
        if (!receipt.status) {
          throw Error(`Error:: ${tx.hash}`);
        }
        console.log("Items were added:", tx.hash);
      }

      const itemIds: number[] = itemTypesArray.map((value) =>
        Number(value.svgId)
      );
      const quantities: BigNumberish[] = itemTypesArray.map((value) =>
        Number(value.maxQuantity)
      );

      if (replaceItemTypes) {
        console.log("Updating items", 0, "to", currentItemTypes.length);

        tx = await daoFacet.updateItemTypes(itemIds, itemTypesArray);
        console.log("tx hash:", tx.hash);

        receipt = await tx.wait();
        if (!receipt.status) {
          throw Error(`Error:: ${tx.hash}`);
        }
        console.log("Items were updated:", tx.hash);
      }

      if (uploadWearableSvgs) {
        console.log("Upload SVGs");
        await uploadSvgs(svgFacet, svgsArray, "wearables", hre.ethers);
        console.log("Upload Done");
      }

      if (replaceWearableSvgs) {
        await updateSvgs(svgsArray, "wearables", itemIds, svgFacet, hre.ethers);
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
          hre.ethers
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
        tx = await svgFacet.setSleeves(sleevesInput);
        receipt = await tx.wait();
        if (!receipt.status) {
          throw Error(`Error:: ${tx.hash}`);
        }
        console.log("Sleeves associated:", tx.hash);
      }

      console.log("final quantities:", itemIds, quantities);

      console.log(`Mint prize items to target address: ${sendToAddress}`);

      tx = await daoFacet.mintItems(sendToAddress, itemIds, quantities);
      console.log("tx hash:", tx.hash);
      receipt = await tx.wait();
      if (!receipt.status) {
        throw Error(`Error:: ${tx.hash}`);
      }

      console.log("Prize items minted:", tx.hash);
    }
  );
