import { LedgerSigner } from "@ethersproject/hardware-wallets";

import { task } from "hardhat/config";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { getItemTypes, ItemTypeOutput } from "../scripts/itemTypeHelpers";
import { DAOFacet } from "../typechain/DAOFacet";
import { SvgFacet } from "../typechain/SvgFacet";
import { BigNumberish } from "@ethersproject/bignumber";
import { uploadOrUpdateSvg } from "../scripts/svgHelperFunctions";
import { gasPrice } from "../scripts/helperFunctions";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export interface AddItemTypesTaskArgs {
  itemManager: string;
  diamondAddress: string;
  itemFile: string;
  svgFile: string;
  svgIds: string;
  uploadItemTypes: boolean;
  sendToItemManager: boolean;
}

task("addItemTypes", "Adds itemTypes and SVGs ")
  .addParam("itemManager", "Address of the item manager", "0")
  .addParam("diamondAddress", "Address of the Diamond to upgrade")
  .addParam("itemFile", "File name of the items to add")
  .addParam("svgFile", "File name of the itemType SVGs")
  .addParam("svgIds", "List of SVG IDs to add or update")
  .addFlag("uploadItemTypes", "Upload itemTypes")
  .addFlag("sendToItemManager", "Mint and send the items to itemManager")

  .setAction(
    async (taskArgs: AddItemTypesTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const itemFile: string = taskArgs.itemFile;
      const diamondAddress: string = taskArgs.diamondAddress;
      const svgFile: string = taskArgs.svgFile;
      const itemManager = taskArgs.itemManager;
      const svgIds: string[] = taskArgs.svgIds
        .split(",")
        .filter((str) => str.length > 0);
      const sendToItemManager = taskArgs.sendToItemManager;
      const uploadItemTypes = taskArgs.uploadItemTypes;

      const {
        itemTypes: currentItemTypes,
      } = require(`../data/itemTypes/${itemFile}.ts`);

      const { badgeSvgs } = require(`../svgs/${svgFile}.ts`);

      const itemTypesArray: ItemTypeOutput[] = getItemTypes(currentItemTypes);

      const svgsArray: string[] = badgeSvgs;

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

      for (let index = 0; index < svgIds.length; index++) {
        const svgId = svgIds[index];

        try {
          await uploadOrUpdateSvg(
            svgsArray[index],
            "wearables",
            Number(svgId),
            svgFacet,
            hre.ethers
          );
        } catch (error) {
          console.log("error uploading", svgId, error);
        }
      }

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
