import { task } from "hardhat/config";
import { Signer } from "@ethersproject/abstract-signer";
import {
  gasPrice,
  getDiamondSigner,
  itemManager,
  maticDiamondAddress,
} from "../scripts/helperFunctions";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SvgFacet } from "../typechain";
import { Sleeves } from "../scripts/itemTypeHelpers";

export interface UpdateSleevesTaskArgs {
  sleevesIds: string;
  wearableIds: string;
}

export function convertSleevesToTaskFormat(sleeves: Sleeves[]) {
  const items: Sleeves[] = [];
  for (let index = 0; index < sleeves.length; index++) {
    items.push(sleeves[index]);
  }
  const sleevesTaskArgs: UpdateSleevesTaskArgs = {
    sleevesIds: items.map((item: Sleeves) => item.sleeveId).join(),
    wearableIds: items.map((item: Sleeves) => item.wearableId).join(),
  };
  return sleevesTaskArgs;
}

export function convertStringToSleevesArray(
  sleevesId: string,
  wearableId: string
): Sleeves[] {
  const output: Sleeves[] = [];
  const sleevesIdsOutput = sleevesId.split(",");
  const wearableIdsOutput = wearableId.split(",");

  sleevesIdsOutput.forEach((_, index) => {
    output.push({
      sleeveId: Number(sleevesIdsOutput[index]),
      wearableId: Number(wearableIdsOutput[index]),
    });
  });
  return output;
}

task("updateSleeves", "Updates SVGs, given sleevesIds and a list of svgIds")
  .addParam("sleevesIds", "List of sleeve IDs to add or update")
  .addParam("wearableIds", "List of SVG IDs to add or update")

  .setAction(
    async (taskArgs: UpdateSleevesTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const sleeves: Sleeves[] = convertStringToSleevesArray(
        taskArgs.sleevesIds,
        taskArgs.wearableIds
      );

      const signer: Signer = await getDiamondSigner(hre, itemManager, false);
      const svgFacet = (await hre.ethers.getContractAt(
        "SvgFacet",
        maticDiamondAddress,
        signer
      )) as SvgFacet;

      console.log("Sleeves being set: ", sleeves);

      let tx = await svgFacet.setSleeves(sleeves, { gasPrice: gasPrice });
      console.log("tx hash:", tx.hash);
      let receipt = await tx.wait();
      console.log("Sleeve set!");
      if (!receipt.status) {
        throw Error(`Error with transaction: ${tx.hash}`);
      }
    }
  );
