import { LedgerSigner } from "@ethersproject/hardware-wallets";

import { task } from "hardhat/config";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { getBaadgeItemTypes, ItemTypeOutput } from "../scripts/itemTypeHelpers";
import {
  itemManagerAlt,
  maticDiamondAddress,
} from "../scripts/helperFunctions";
import { DAOFacet } from "../typechain/DAOFacet";
import { BigNumberish } from "@ethersproject/bignumber";
import { gasPrice } from "../scripts/helperFunctions";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export interface MintBaadgeTaskArgs {
  itemManager: string;
  itemFile: string;
  uploadItemTypes: boolean;
  sendToItemManager: boolean;
}

task("mintBaadgeSvgs", "Adds itemTypes and SVGs")
  .addParam("itemManager", "Address of the item manager", "0")
  .addParam("itemFile", "File name of the items to add")
  .addFlag("uploadItemTypes", "Upload itemTypes")
  .addFlag("sendToItemManager", "Mint and send the items to itemManager")

  .setAction(
    async (taskArgs: MintBaadgeTaskArgs, hre: HardhatRuntimeEnvironment) => {
      console.log("item manager:", taskArgs.itemManager);

      if (taskArgs.itemManager !== itemManagerAlt) {
        throw new Error("Wrong item manager");
      }

      const itemFile: string = taskArgs.itemFile;
      const itemManager = taskArgs.itemManager;
      const sendToItemManager = taskArgs.sendToItemManager;
      const uploadItemTypes = taskArgs.uploadItemTypes;

      const {
        itemTypes: currentItemTypes,
      } = require(`../scripts/addItemTypes/itemTypes/${itemFile}.ts`);

      const itemTypesArray: ItemTypeOutput[] =
        getBaadgeItemTypes(currentItemTypes);

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
        signer = await (await hre.ethers.getSigners())[0];
        // signer = new LedgerSigner(
        //   hre.ethers.provider,
        //   "hid",
        //   "m/44'/60'/2'/0/0"
        // );
      } else {
        throw Error("Incorrect network selected");
      }

      console.log("signer:", await signer.getAddress());

      let tx: ContractTransaction;
      let receipt: ContractReceipt;

      let daoFacet = (await hre.ethers.getContractAt(
        "DAOFacet",
        maticDiamondAddress,
        signer
      )) as DAOFacet;

      if (uploadItemTypes) {
        console.log("Adding items", 0, "to", currentItemTypes.length);

        tx = await daoFacet.addItemTypes(itemTypesArray, {
          gasPrice: gasPrice,
        });

        console.log("tx hash:", tx.hash);

        receipt = await tx.wait();
        if (!receipt.status) {
          throw Error(`Error:: ${tx.hash}`);
        }
        console.log("Items were added:", tx.hash);
      }

      if (sendToItemManager) {
        const itemIds: BigNumberish[] = [];
        const quantities: BigNumberish[] = [];
        currentItemTypes.forEach((itemType: ItemTypeOutput) => {
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
