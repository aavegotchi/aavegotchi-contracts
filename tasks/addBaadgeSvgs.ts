import { LedgerSigner } from "@ethersproject/hardware-wallets";

import { task } from "hardhat/config";
import { ContractReceipt, ContractTransaction } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";
import { getItemTypes, ItemTypeOutput } from "../scripts/itemTypeHelpers";
import {
  getDiamondSigner,
  itemManager,
  maticDiamondAddress,
} from "../scripts/helperFunctions";
import { DAOFacet } from "../typechain/DAOFacet";
import { SvgFacet } from "../typechain/SvgFacet";
import { BigNumberish } from "@ethersproject/bignumber";
import { uploadOrUpdateSvg } from "../scripts/svgHelperFunctions";
import { gasPrice } from "../scripts/helperFunctions";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export interface AddBaadgeTaskArgs {
  itemManager: string;
  svgFile: string;
  svgIds: string;
}

task("addBaadgeSvgs", "Adds itemTypes and SVGs")
  .addParam("itemManager", "Address of the item manager", "0")

  .addParam("svgFile", "Name of the itemType SVGs")
  .addParam("svgIds", "List of SVG IDs to add or update")

  .setAction(
    async (taskArgs: AddBaadgeTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const svgFile: string = taskArgs.svgFile;
      const itemManager = taskArgs.itemManager;
      const svgIds: string[] = taskArgs.svgIds
        .split(",")
        .filter((str) => str.length > 0);

      const { baadges } = require(`../svgs/${svgFile}.ts`);

      const svgsArray: string[] = baadges;

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

      let svgFacet = (await hre.ethers.getContractAt(
        "SvgFacet",
        maticDiamondAddress,
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
    }
  );
