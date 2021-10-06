import { task } from "hardhat/config";
import { Signer } from "@ethersproject/abstract-signer";
import {
  getDiamondSigner,
  itemManager,
  maticDiamondAddress,
} from "../scripts/helperFunctions";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { SvgViewsFacet } from "../typechain";
import { Dimensions, SideDimensions } from "../scripts/itemTypeHelpers";

export interface UpdateItemSideDimensionsTaskArgs {
  itemIds: string;
  side: string;
  dimensions: string;
}

export function convertSideDimensionsToString (
  d: Dimensions
): string {
  console.log("Converting to String");
  let outputString = "";
    outputString = outputString.concat(
      `$${d.x}$${d.y}$${d.width}$${d.height}`
    );
  console.log("Returning Output", outputString);
  
  return outputString;
}

export function convertStringToSideDimensionsArray(itemId: string, side: string, dimensions: string): SideDimensions[] {
  console.log("Converting to Array");
  const output: SideDimensions[] = [];
  const sideDimensions: string[] =  dimensions
    .split("$")
    .filter((dimensions) => dimensions.length > 0);

  const dimensionsOdject: Dimensions = {
    x: sideDimensions[0],
    y: sideDimensions[1],
    width: sideDimensions[2],
    height: sideDimensions[3],
  }

  output.push({
    itemId: itemId,
    side: side,
    dimensions: dimensionsOdject,
  });

  return output;
}

task(
  "updateItemSideDimensions",
  "Updates item side dimensions, given svgId, side, and dimensions"
)
  .addParam("itemIds", "Item IDs to update dimensions")
  .addParam("side", "Item side to be updated dimensions")
  .addParam("dimensions", "New dimensions of each item")

  .setAction(
    async (
      taskArgs: UpdateItemSideDimensionsTaskArgs,
      hre: HardhatRuntimeEnvironment
    ) => {
        const sideDimensions: SideDimensions[] = convertStringToSideDimensionsArray(
          taskArgs.itemIds,
          taskArgs.side,
          taskArgs.dimensions,
        )

        const signer: Signer = await getDiamondSigner(hre, itemManager, false);
        const svgViewsFacet = (await hre.ethers.getContractAt(
          "SvgViewsFacet",
          maticDiamondAddress,
          signer
        )) as SvgViewsFacet;
      
        let tx = await svgViewsFacet.setSideViewDimensions(sideDimensions);
        console.log("tx hash:", tx.hash);
        let receipt = await tx.wait();
        console.log("New Dimensions set!");
        if (!receipt.status) {
          throw Error(`Error with transaction: ${tx.hash}`);
      }
    }
  );