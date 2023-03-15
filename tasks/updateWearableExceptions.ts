import { task } from "hardhat/config";
import { Signer } from "@ethersproject/abstract-signer";
import {
  gasPrice,
  getDiamondSigner,
  getRelayerSigner,
  itemManager,
  maticDiamondAddress,
} from "../scripts/helperFunctions";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { SvgViewsFacet } from "../typechain";
import { Exceptions } from "../scripts/itemTypeHelpers";

export interface UpdateExceptionTaskArg {
  itemIds: string;
  slotPositions: string;
  sides: string;
  exceptionBools: string;
}

export function convertExceptionsToTaskFormat(exceptions: Exceptions[]) {
  const items: Exceptions[] = [];
  for (let index = 0; index < exceptions.length; index++) {
    items.push(exceptions[index]);
  }
  const exceptionsTaskArg: UpdateExceptionTaskArg = {
    itemIds: items.map((item: Exceptions) => item.itemId).join(),
    slotPositions: items.map((item: Exceptions) => item.slotPosition).join(),
    sides: items.map((item: Exceptions) => item.side).join(),
    exceptionBools: items.map((item: Exceptions) => item.exceptionBool).join(),
  };
  console.log("Task Arg: ", exceptionsTaskArg);

  return exceptionsTaskArg;
}

export function convertStringToExceptionsArray(
  itemIds: string,
  slotPositions: string,
  sides: string,
  exceptionBools: string,
  ethers: any
): Exceptions[] {
  const output: Exceptions[] = [];
  const itemIdsOutput = itemIds.split(",");
  const slotPositionsOutput = slotPositions.split(",");
  const sidesOutput = sides.split(",");
  const exceptionBoolsOutput = exceptionBools.split(",");

  itemIdsOutput.forEach((_, index) => {
    output.push({
      itemId: itemIdsOutput[index],
      slotPosition: slotPositionsOutput[index],
      side: ethers.utils.formatBytes32String(sidesOutput[index]),
      exceptionBool:
        exceptionBoolsOutput[index].toLowerCase() === "true" ? true : false,
    });
  });
  console.log("Output: ", output);
  return output;
}

task(
  "updateWearableExceptions",
  "Updates wearable ids for exceptions of layering order"
)
  .addParam("itemIds", "Wearable IDs to update exception")
  .addParam(
    "slotPositions",
    "Slot position of wearable ID being updated for exception"
  )
  .addParam("sides", "Side of wearable ID being updated for exception")
  .addParam(
    "exceptionBools",
    "Determines whether or not wearble ID is exception"
  )

  .setAction(
    async (
      taskArgs: UpdateExceptionTaskArg,
      hre: HardhatRuntimeEnvironment
    ) => {
      const exceptions: Exceptions[] = convertStringToExceptionsArray(
        taskArgs.itemIds,
        taskArgs.slotPositions,
        taskArgs.sides,
        taskArgs.exceptionBools,
        hre.ethers
      );

      const signer: Signer = await getRelayerSigner(hre);
      const svgViewsFacet = (await hre.ethers.getContractAt(
        "SvgViewsFacet",
        maticDiamondAddress,
        signer
      )) as SvgViewsFacet;

      let tx = await svgViewsFacet.setSideViewExceptions(exceptions);
      console.log("tx hash:", tx.hash);
      let receipt = await tx.wait();
      console.log("Exception Set!");
      if (!receipt.status) {
        throw Error(`Error with transaction: ${tx.hash}`);
      }
    }
  );
